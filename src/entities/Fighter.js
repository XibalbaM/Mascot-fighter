import { GAME_CONFIG } from '../config.js';
import { soundManager } from '../audio/SoundManager.js';
import { getCharacter } from '../data/characters.js';
import { ANIMATIONS, frameDurationMs } from '../data/animations.js';
import { getAttackHitbox, getHurtboxSpec, getPushboxSpec, getProjectileSpawn } from '../data/hitboxes.js';

export const FIGHTER_STATE = {
  IDLE: 'IDLE',
  WALK_FWD: 'WALK_FWD',
  WALK_BACK: 'WALK_BACK',
  CROUCH: 'CROUCH',
  JUMP: 'JUMP',
  ATTACK: 'ATTACK',
  HURT: 'HURT',
  BLOCK: 'BLOCK',
  KNOCKDOWN: 'KNOCKDOWN',
  GETUP: 'GETUP',
  VICTORY: 'VICTORY',
  DEFEAT: 'DEFEAT'
};


// Normal attack frame data, indexed by stance and input. Kept as data (not code)
// so balance tweaks don't require touching the state machine.
// startup/active are NOT stored here: resolveAttackPhases() derives them from
// the animation's hit frames (ANIMATIONS.hitFrames), so the hitbox is active
// exactly while the animation shows the limb extended. Hitboxes themselves are
// per-character model data in data/hitboxes.js.
const ATTACK_DATA = {
  standing: {
    lightPunch: { animKey: 'light_punch', damage: 6, recovery: 100, hitstop: GAME_CONFIG.HITSTOP.LIGHT, hitstun: 200, blockstun: 160, knockbackX: 120, knockbackY: 0, isKnockdown: false, attackType: 'mid' },
    heavyPunch: { animKey: 'heavy_punch', damage: 15, recovery: 200, hitstop: GAME_CONFIG.HITSTOP.HEAVY, hitstun: 300, blockstun: 230, knockbackX: 260, knockbackY: 0, isKnockdown: false, attackType: 'mid' },
    lightKick: { animKey: 'light_kick', damage: 7, recovery: 120, hitstop: GAME_CONFIG.HITSTOP.LIGHT, hitstun: 210, blockstun: 170, knockbackX: 140, knockbackY: 0, isKnockdown: false, attackType: 'mid' },
    heavyKick: { animKey: 'heavy_kick', damage: 16, recovery: 220, hitstop: GAME_CONFIG.HITSTOP.HEAVY, hitstun: 310, blockstun: 240, knockbackX: 280, knockbackY: 0, isKnockdown: false, attackType: 'mid' }
  },
  crouching: {
    lightPunch: { animKey: 'crouch_punch', damage: 5, recovery: 110, hitstop: GAME_CONFIG.HITSTOP.LIGHT, hitstun: 180, blockstun: 150, knockbackX: 100, knockbackY: 0, isKnockdown: false, attackType: 'mid' },
    heavyPunch: { animKey: 'crouch_punch', damage: 12, recovery: 160, hitstop: GAME_CONFIG.HITSTOP.HEAVY, hitstun: 260, blockstun: 210, knockbackX: 180, knockbackY: 0, isKnockdown: false, attackType: 'mid' },
    lightKick: { animKey: 'crouch_kick', damage: 6, recovery: 120, hitstop: GAME_CONFIG.HITSTOP.LIGHT, hitstun: 200, blockstun: 170, knockbackX: 110, knockbackY: 0, isKnockdown: false, attackType: 'low' },
    heavyKick: { animKey: 'crouch_kick', damage: 14, recovery: 240, hitstop: GAME_CONFIG.HITSTOP.HEAVY, hitstun: 320, blockstun: 240, knockbackX: 250, knockbackY: -220, isKnockdown: true, attackType: 'low' }
  },
  air: {
    lightPunch: { animKey: 'jump_punch', damage: 7, recovery: 100, hitstop: GAME_CONFIG.HITSTOP.LIGHT, hitstun: 280, blockstun: 200, knockbackX: 160, knockbackY: 0, isKnockdown: false, attackType: 'overhead' },
    heavyPunch: { animKey: 'jump_punch', damage: 12, recovery: 100, hitstop: GAME_CONFIG.HITSTOP.HEAVY, hitstun: 280, blockstun: 200, knockbackX: 160, knockbackY: 0, isKnockdown: false, attackType: 'overhead' },
    lightKick: { animKey: 'jump_kick', damage: 8, recovery: 120, hitstop: GAME_CONFIG.HITSTOP.LIGHT, hitstun: 300, blockstun: 220, knockbackX: 200, knockbackY: 0, isKnockdown: false, attackType: 'overhead' },
    heavyKick: { animKey: 'jump_kick', damage: 14, recovery: 120, hitstop: GAME_CONFIG.HITSTOP.HEAVY, hitstun: 300, blockstun: 220, knockbackX: 200, knockbackY: 0, isKnockdown: false, attackType: 'overhead' }
  }
};

// Input priority when several attack buttons are pressed on the same frame
const ATTACK_PRIORITY = ['lightPunch', 'heavyPunch', 'lightKick', 'heavyKick'];

export class Fighter {
  constructor(scene, x, y, charId, facing = 1, isPlayer1 = true) {
    this.scene = scene;
    this.charId = charId; // character roster id (e.g. 'phoenix', 'dragon', 'lion', etc.)
    this.charConfig = getCharacter(charId);
    this.name = this.charConfig.name;
    this.stats = this.charConfig.stats;
    this.isPlayer1 = isPlayer1;
    this.facing = facing; // 1 = facing right, -1 = facing left

    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.lungeVx = 0; // decaying forward impulse of heavy attacks (separate from vx)
    this.groundY = GAME_CONFIG.GROUND_Y;

    // Derived Attributes from Character Stats
    // 1. HP: Base maximum health
    this.maxHealth = this.stats.hp || GAME_CONFIG.FIGHTER.MAX_HEALTH;
    this.health = this.maxHealth;
    this.superMeter = 0;
    this.maxSuper = GAME_CONFIG.FIGHTER.MAX_SUPER;
    this.wins = 0;

    // 2. Defense Factor: Scales incoming damage
    this.defenseFactor = Math.max(0.65, 1.0 - ((this.stats.defense - 50) * 0.005));

    // 3. Offense Factor: Scales damage dealt
    this.offenseFactor = Math.max(0.7, 1.0 + ((this.stats.offense - 50) * 0.004));

    // 4. Speed Factor: Scales walking and dashing
    this.speedFactor = Math.max(0.7, 1.0 + ((this.stats.speed - 50) * 0.005));
    this.walkSpeedFwd = GAME_CONFIG.FIGHTER.WALK_SPEED_FWD * this.speedFactor;
    this.walkSpeedBack = GAME_CONFIG.FIGHTER.WALK_SPEED_BACK * this.speedFactor;

    // 5. Attack Speed Factor: Decreases startup and recovery frames
    this.attackSpeedFactor = Math.max(0.75, 1.0 + ((this.stats.attackSpeed - 50) * 0.005));

    // State machine
    this.state = FIGHTER_STATE.IDLE;
    this.isGrounded = true;
    this.isCrouching = false;
    this.isBlocking = false;
    this.isInvincible = false;
    this.opponent = null;

    // Attack tracking
    this.currentAttack = null;
    this.attackFrameTimer = 0;
    this.activeHitbox = null;
    this.comboCounter = 0;
    this.canCancelIntoSpecial = false;

    // Timers
    this.stateTimer = 0;
    this.hitstunTimer = 0;
    this.blockstunTimer = 0;
    this.invincibilityTimer = 0;

    // Input intent flags (updated each frame by InputManager / AI)
    this.input = {
      up: false,
      justUp: false,
      down: false,
      left: false,
      right: false,
      lightPunch: false,
      heavyPunch: false,
      lightKick: false,
      heavyKick: false,
      fireball: false,
      uppercut: false,
      super: false,
      // Just pressed edge triggers
      justLightPunch: false,
      justHeavyPunch: false,
      justLightKick: false,
      justHeavyKick: false,
      justFireball: false,
      justUppercut: false,
      justSuper: false,
    };

    // Pushbox / hurtboxes are per-character model data (data/hitboxes.js),
    // resolved in getPushBox() / getHurtBoxes().
    // While attacking, the sprite frame is driven manually from the sim timer
    // (see startAttackAnim) so visuals stay locked to the hitbox window.
    this.manualAttackFrames = false;

    // Phaser Sprite
    this.sprite = scene.add.sprite(x, y, `${charId}_idle_0`);
    this.sprite.setScale(GAME_CONFIG.FIGHTER.SCALE);
    this.sprite.setOrigin(0.5, 1.0);
    this.sprite.play(`${charId}_idle`);

    // Shadow on the ground (depth above the floor so it stays visible)
    this.shadow = scene.add.ellipse(x, this.groundY, 48, 12, 0x000000, 0.45).setDepth(3);
  }

  setOpponent(opp) {
    this.opponent = opp;
  }

  resetRound(x, facing) {
    this.x = x;
    this.y = this.groundY;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.health = this.maxHealth;
    this.isGrounded = true;
    this.isCrouching = false;
    this.isBlocking = false;
    this.isInvincible = false;
    this.currentAttack = null;
    this.activeHitbox = null;
    this.hitstunTimer = 0;
    this.blockstunTimer = 0;
    this.invincibilityTimer = 0;
    this.stateTimer = 0;
    this.comboCounter = 0;
    this.canCancelIntoSpecial = false;
    this.lungeVx = 0;
    this.state = FIGHTER_STATE.IDLE;
    this.playAnimation('idle');
    this.sprite.setAlpha(1.0);
    this.sprite.setPosition(this.x, this.y);
  }

  update(dt) {
    // dt is always exactly one sim tick (TICK_MS = 1000/60): BattleScene drives
    // the sim through a fixed-tick accumulator, so every timer below advances
    // deterministically regardless of the display refresh rate.
    const delta = dt / 1000;

    // Update timers
    if (this.hitstunTimer > 0) {
      this.hitstunTimer -= dt;
      if (this.hitstunTimer <= 0) {
        this.recoverFromHit();
      }
    }

    if (this.blockstunTimer > 0) {
      this.blockstunTimer -= dt;
      if (this.blockstunTimer <= 0) {
        this.recoverFromBlock();
      }
    }

    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= dt;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
        this.sprite.setAlpha(1.0);
      } else {
        // Flash during invincibility — blink derived from the tick-based timer,
        // never from the wall clock (Date.now would desync replays/netplay)
        this.sprite.setAlpha(Math.floor(this.invincibilityTimer / 60) % 2 === 0 ? 0.4 : 1.0);
      }
    }

    // Facing updates (grounded non-attacking fighters face opponent)
    if (this.opponent && this.isGrounded && this.state !== FIGHTER_STATE.ATTACK && 
        this.state !== FIGHTER_STATE.HURT && this.state !== FIGHTER_STATE.KNOCKDOWN &&
        this.state !== FIGHTER_STATE.GETUP && this.state !== FIGHTER_STATE.DEFEAT) {
      if (this.x < this.opponent.x) {
        this.facing = 1;
      } else {
        this.facing = -1;
      }
    }

    // Apply state logic
    this.handleStateLogic(dt, delta);

    // Physics integration
    this.applyPhysics(dt, delta);

    // Sync visuals
    this.sprite.setPosition(this.x, this.y);
    this.sprite.setScale(GAME_CONFIG.FIGHTER.SCALE * this.facing, GAME_CONFIG.FIGHTER.SCALE);
    this.shadow.setPosition(this.x, this.groundY);
    // Shadow scales with jump height
    const jumpDist = Math.max(0, this.groundY - this.y);
    const shadowScale = Math.max(0.3, 1 - (jumpDist / 300));
    this.shadow.setScale(shadowScale);
    this.shadow.setAlpha(0.45 * shadowScale);
  }

  handleStateLogic(dt, delta) {
    switch (this.state) {
      case FIGHTER_STATE.IDLE:
      case FIGHTER_STATE.WALK_FWD:
      case FIGHTER_STATE.WALK_BACK:
      case FIGHTER_STATE.CROUCH:
        this.handleGroundedInputs();
        break;

      case FIGHTER_STATE.JUMP:
        this.handleAirborneInputs();
        break;

      case FIGHTER_STATE.ATTACK:
        this.handleAttackUpdate(dt);
        break;

      case FIGHTER_STATE.KNOCKDOWN:
        this.stateTimer += dt;
        if (this.stateTimer > 700) {
          this.state = FIGHTER_STATE.GETUP;
          this.stateTimer = 0;
          this.isInvincible = true;
          this.invincibilityTimer = 600;
          this.playAnimation('getup');
        }
        break;

      case FIGHTER_STATE.GETUP:
        this.stateTimer += dt;
        if (this.stateTimer > 400) {
          this.state = FIGHTER_STATE.IDLE;
          this.playAnimation('idle');
        }
        break;

      case FIGHTER_STATE.VICTORY:
      case FIGHTER_STATE.DEFEAT:
        this.vx = 0;
        break;
    }
  }

  handleGroundedInputs() {
    // 1. Attack / Special move priority checks
    if (this.checkAttackTriggers()) return;

    // 2. Jumping (edge-triggered: holding up doesn't bunny-hop)
    if (this.input.justUp && this.isGrounded) {
      this.initiateJump();
      return;
    }

    // 3. Crouching
    if (this.input.down) {
      this.isCrouching = true;
      this.vx = 0;
      if (this.state !== FIGHTER_STATE.CROUCH) {
        this.state = FIGHTER_STATE.CROUCH;
        this.playAnimation('crouch');
      }
      return;
    } else {
      this.isCrouching = false;
    }

    // 4. Walking & Guarding
    const moveLeft = this.input.left;
    const moveRight = this.input.right;

    if (moveLeft || moveRight) {
      const movingForward = (this.facing === 1 && moveRight) || (this.facing === -1 && moveLeft);

      if (movingForward) {
        this.vx = this.facing * this.walkSpeedFwd;
        if (this.state !== FIGHTER_STATE.WALK_FWD) {
          this.state = FIGHTER_STATE.WALK_FWD;
          this.playAnimation('walk_fwd');
        }
      } else {
        // Walking backwards = Auto-guard ready!
        this.vx = -this.facing * this.walkSpeedBack;
        if (this.state !== FIGHTER_STATE.WALK_BACK) {
          this.state = FIGHTER_STATE.WALK_BACK;
          this.playAnimation('walk_back');
        }
      }
    } else {
      this.vx = 0;
      if (this.state !== FIGHTER_STATE.IDLE) {
        this.state = FIGHTER_STATE.IDLE;
        this.playAnimation('idle');
      }
    }
  }

  initiateJump() {
    this.isGrounded = false;
    this.state = FIGHTER_STATE.JUMP;
    this.vy = GAME_CONFIG.FIGHTER.JUMP_FORCE;

    // Jump direction
    if (this.input.right) {
      this.vx = (this.facing === 1 ? GAME_CONFIG.FIGHTER.WALK_SPEED_FWD : GAME_CONFIG.FIGHTER.WALK_SPEED_BACK) * 1.15;
    } else if (this.input.left) {
      this.vx = (this.facing === -1 ? GAME_CONFIG.FIGHTER.WALK_SPEED_FWD : GAME_CONFIG.FIGHTER.WALK_SPEED_BACK) * -1.15;
    } else {
      this.vx = 0;
    }

    this.playAnimation('jump_up');
    soundManager.playWhoosh(1.2);
    this.scene.particleManager.spawnDust(this.x, this.groundY);
  }

  handleAirborneInputs() {
    // Air attack triggers (jump-ins are overheads)
    if (this.input.justLightPunch || this.input.justHeavyPunch) {
      const heavy = this.input.justHeavyPunch;
      this.startAttack('jump_punch', heavy ? ATTACK_DATA.air.heavyPunch : ATTACK_DATA.air.lightPunch, 'air', heavy ? 'heavyPunch' : 'lightPunch');
    } else if (this.input.justLightKick || this.input.justHeavyKick) {
      const heavy = this.input.justHeavyKick;
      this.startAttack('jump_kick', heavy ? ATTACK_DATA.air.heavyKick : ATTACK_DATA.air.lightKick, 'air', heavy ? 'heavyKick' : 'lightKick');
    }
  }

  checkAttackTriggers() {
    // Super Move Check (Requires 100% EX / Super)
    if (this.input.justSuper && this.superMeter >= 100) {
      this.executeSuperMove();
      return true;
    }

    // Special: Fireball (Hadouken)
    if (this.input.justFireball) {
      this.startSpecialFireball();
      return true;
    }

    // Special: Uppercut (Shoryuken)
    if (this.input.justUppercut) {
      this.startSpecialUppercut();
      return true;
    }

    // Normal attacks come from the ATTACK_DATA table, picked by stance
    const stance = this.isCrouching ? 'crouching' : 'standing';
    const table = ATTACK_DATA[stance];
    for (const key of ATTACK_PRIORITY) {
      const justFlag = 'just' + key.charAt(0).toUpperCase() + key.slice(1);
      if (this.input[justFlag]) {
        const data = table[key];
        this.startAttack(data.animKey, data, stance, key);
        return true;
      }
    }

    return false;
  }

  // Derive the startup/active/recovery windows from the animation's hit
  // frames, so the hitbox exists exactly while the animation shows the limb
  // extended. Everything is scaled by attackSpeedFactor like before, and the
  // sprite frame is driven from the same timer (updateAttackFrame), so the
  // visual extension and the hitbox window can never drift apart.
  resolveAttackPhases(animKey, recoveryMs) {
    const anim = ANIMATIONS[animKey];
    const [f0, f1] = anim.hitFrames || [0, anim.frames - 1];
    const frameDur = 1000 / anim.frameRate;
    const factor = this.attackSpeedFactor;
    return {
      startup: Math.max(30, Math.round(f0 * frameDur / factor)),
      active: Math.max(30, Math.round((f1 + 1 - f0) * frameDur / factor)),
      recovery: Math.max(40, Math.round(recoveryMs / factor))
    };
  }

  startAttack(animKey, attackData, stance, key) {
    this.state = FIGHTER_STATE.ATTACK;
    const scaledDamage = Math.max(1, Math.round(attackData.damage * this.offenseFactor));
    const phases = this.resolveAttackPhases(animKey, attackData.recovery);

    this.currentAttack = {
      ...attackData,
      damage: scaledDamage,
      startup: phases.startup,
      active: phases.active,
      recovery: phases.recovery,
      animKey: animKey,
      hitbox: getAttackHitbox(this.charId, stance, key),
      phase: 'startup', // startup -> active -> recovery
      timer: 0,
      animTimer: 0, // monotonic ms since attack start — drives the sprite frame
      hasHit: false,
    };
    this.activeHitbox = null;
    this.canCancelIntoSpecial = false;

    // Slight forward step for grounded heavy attacks: a short decaying impulse
    // (lungeVx) instead of a persistent vx, so the fighter doesn't slide
    // through the whole attack animation
    if (this.isGrounded) {
      this.vx = 0;
      this.lungeVx = animKey.includes('heavy') ? this.facing * (60 * this.speedFactor) : 0;
    }

    this.startAttackAnim(animKey);
    soundManager.playWhoosh(animKey.includes('heavy') ? 0.9 : 1.3);
  }

  // Attack animations are played frame-by-frame from the sim timer instead of
  // the Phaser clock: the displayed frame and the hitbox phase come from the
  // same atk.timer, and both freeze during hitstop (the sim doesn't advance).
  startAttackAnim(animKey) {
    this.manualAttackFrames = true;
    this.sprite.anims.stop();
    this.updateAttackFrame();
  }

  // Returns the animation frame the attack should display at animTimer, and
  // sets it on the sprite. animTimer is monotonic (unlike atk.timer, which
  // resets at each phase transition), so the frame advances continuously
  // through startup -> active -> recovery.
  updateAttackFrame() {
    const atk = this.currentAttack;
    if (!atk) return -1;
    const anim = ANIMATIONS[atk.animKey];
    if (!anim) return -1;
    const fd = frameDurationMs(atk.animKey, this.attackSpeedFactor);
    const frame = Math.min(anim.frames - 1, Math.floor(atk.animTimer / fd));
    this.sprite.setTexture(`${this.charId}_${anim.prefix || atk.animKey}_${frame}`);
    return frame;
  }

  startSpecialFireball() {
    this.state = FIGHTER_STATE.ATTACK;
    this.canCancelIntoSpecial = false;
    // hitFrames [2,3]: the projectile fires exactly when the release frame
    // starts displaying
    const phases = this.resolveAttackPhases('special_hadouken', 240);
    this.currentAttack = {
      name: 'HADOUKEN',
      animKey: 'special_hadouken',
      phase: 'startup',
      startup: Math.max(50, phases.startup),
      active: phases.active,
      recovery: Math.max(60, phases.recovery),
      timer: 0,
      animTimer: 0, // monotonic ms since attack start — drives the sprite frame
      hasFiredProjectile: false,
    };
    this.vx = 0;
    this.activeHitbox = null;
    this.startAttackAnim('special_hadouken');
    soundManager.playFireball();
  }

  startSpecialUppercut() {
    this.state = FIGHTER_STATE.ATTACK;
    this.canCancelIntoSpecial = false;
    // hitFrames [1,3]: the rising fist column is active for the whole rise
    const phases = this.resolveAttackPhases('special_shoryuken', 320);
    this.currentAttack = {
      name: 'SHORYUKEN',
      animKey: 'special_shoryuken',
      phase: 'startup',
      startup: Math.max(30, phases.startup),
      active: phases.active,
      recovery: Math.max(70, phases.recovery),
      timer: 0,
      animTimer: 0, // monotonic ms since attack start — drives the sprite frame
      damage: Math.max(1, Math.round(22 * this.offenseFactor)),
      hitstop: GAME_CONFIG.HITSTOP.HEAVY,
      hitstun: 360,
      blockstun: 260,
      knockbackX: 240,
      knockbackY: -340,
      attackType: 'mid',
      isKnockdown: true,
      hasHit: false,
      hitbox: getAttackHitbox(this.charId, 'special', 'shoryuken')
    };
    this.isInvincible = true;
    this.invincibilityTimer = 160; // Dragon punch invincibility on startup!
    this.startAttackAnim('special_shoryuken');
    soundManager.playUppercut();
  }

  executeSuperMove() {
    this.superMeter = 0;
    this.state = FIGHTER_STATE.ATTACK;
    this.canCancelIntoSpecial = false;
    const phases = this.resolveAttackPhases('special_shoryuken', 280);
    this.currentAttack = {
      name: 'SUPER_COMBO',
      animKey: 'special_shoryuken',
      phase: 'startup',
      startup: Math.max(40, phases.startup),
      active: phases.active,
      recovery: Math.max(70, phases.recovery),
      timer: 0,
      animTimer: 0, // monotonic ms since attack start — drives the sprite frame
      damage: Math.max(1, Math.round(42 * this.offenseFactor)),
      hitstop: GAME_CONFIG.HITSTOP.SUPER,
      hitstun: 420,
      blockstun: 280,
      knockbackX: 380,
      knockbackY: -400,
      attackType: 'mid',
      isKnockdown: true,
      hasHit: false,
      isSuper: true,
      hitbox: getAttackHitbox(this.charId, 'special', 'super')
    };

    // Super Flash effects
    soundManager.playSuperFlash();
    this.scene.cameras.main.flash(200, 255, 255, 255);
    const auraColor = parseInt((this.charConfig.palette.specialColor || '#ffa502').replace('#', ''), 16);
    this.scene.particleManager.spawnSuperAura(this.x, this.y, auraColor);
    this.isInvincible = true;
    this.invincibilityTimer = 300;

    // Surge forward
    this.vx = this.facing * 340;
    this.startAttackAnim('special_shoryuken');
  }

  handleAttackUpdate(dt) {
    if (!this.currentAttack) {
      this.state = this.isGrounded ? FIGHTER_STATE.IDLE : FIGHTER_STATE.JUMP;
      return;
    }

    const atk = this.currentAttack;
    atk.timer += dt;
    atk.animTimer += dt;
    // The phase is derived FROM the displayed frame (not from a parallel ms
    // clock), so the hitbox is active exactly on the animation's hitFrames —
    // no drift even under tick quantization or attackSpeedFactor scaling.
    const frame = this.updateAttackFrame();
    const anim = ANIMATIONS[atk.animKey];
    const [f0, f1] = anim.hitFrames || [0, anim.frames - 1];
    const animDuration = anim.frames * frameDurationMs(atk.animKey, this.attackSpeedFactor);

    if (atk.phase === 'startup') {
      if (frame >= f0) {
        atk.phase = 'active';
        atk.timer = 0;

        // Activate hitbox
        if (atk.hitbox) {
          this.activeHitbox = {
            ...atk.hitbox,
            damage: atk.damage,
            hitstop: atk.hitstop,
            hitstun: atk.hitstun,
            blockstun: atk.blockstun,
            knockbackX: atk.knockbackX,
            knockbackY: atk.knockbackY,
            attackType: atk.attackType,
            isKnockdown: atk.isKnockdown,
            isSuper: atk.isSuper,
            attacker: this
          };
        }

        // Fire projectile if fireball — spawn point is where the model's
        // hands hold the orb on the release frame (per character)
        if (atk.name === 'HADOUKEN' && !atk.hasFiredProjectile) {
          atk.hasFiredProjectile = true;
          const spawn = getProjectileSpawn(this.charId);
          const spawnX = this.x + this.facing * spawn.x;
          const spawnY = this.y + spawn.y;
          this.scene.spawnProjectile(this, spawnX, spawnY, this.facing);

          // NOUVEAU : effet de lancer
          const color = parseInt((this.charConfig.palette.specialColor || '#ffa502').replace('#', ''), 16);
          this.scene.particleManager.spawnFireballLaunch(spawnX, spawnY, this.facing, color);
        }

        // Uppercut rising launch
        if (atk.name === 'SHORYUKEN') {
          this.isGrounded = false;
          this.vy = -560;
          this.vx = this.facing * 140;
        }
      }
    } else if (atk.phase === 'active') {
      // Cancel on hit (Super / Special cancel combo routing!)
      if (this.canCancelIntoSpecial) {
        if (this.input.justSuper && this.superMeter >= 100) {
          this.executeSuperMove();
          return;
        }
        if (this.input.justUppercut && this.isGrounded) {
          this.startSpecialUppercut();
          return;
        }
        if (this.input.justFireball && atk.name !== 'HADOUKEN') {
          this.startSpecialFireball();
          return;
        }
      }

      // Active ends when the animation leaves the hit frames (or reaches its
      // last frame, for hitFrames that extend to the end of the anim)
      if (frame > f1 || atk.animTimer >= animDuration) {
        atk.phase = 'recovery';
        atk.timer = 0;
        this.activeHitbox = null; // Hitbox becomes inactive during recovery
      }
    } else if (atk.phase === 'recovery') {
      if (atk.timer >= atk.recovery) {
        this.currentAttack = null;
        this.activeHitbox = null;
        this.canCancelIntoSpecial = false;
        this.lungeVx = 0;

        if (this.isGrounded) {
          this.state = this.isCrouching ? FIGHTER_STATE.CROUCH : FIGHTER_STATE.IDLE;
          this.playAnimation(this.isCrouching ? 'crouch' : 'idle');
        } else {
          this.state = FIGHTER_STATE.JUMP;
          this.playAnimation('jump_up');
        }
      }
    }
  }

  takeDamage(hitbox) {
    if (this.isInvincible || this.state === FIGHTER_STATE.KNOCKDOWN || this.state === FIGHTER_STATE.DEFEAT) {
      return { blocked: false, damage: 0 };
    }

    // Check if defender is blocking:
    // Standing block: holding Back while standing blocks High / Mid attacks (not Low)
    // Crouching block: holding Down-Back blocks Mid / Low attacks (not Overhead)
    const isHoldingBack = (this.facing === 1 && this.input.left) || (this.facing === -1 && this.input.right);
    // Guard only from a "free" state (not while attacking, hurt, airborne, getting up...).
    // BLOCK is included so the next hits of a string are blocked during the blockstun.
    const canGuardState = this.state === FIGHTER_STATE.IDLE
                       || this.state === FIGHTER_STATE.WALK_FWD
                       || this.state === FIGHTER_STATE.WALK_BACK
                       || this.state === FIGHTER_STATE.CROUCH
                       || this.state === FIGHTER_STATE.BLOCK;
    let isGuarding = false;

    if (isHoldingBack && this.isGrounded && this.input.left !== this.input.right && canGuardState) {
      if (hitbox.attackType === 'low' && this.isCrouching) {
        isGuarding = true; // Crouching blocks Low!
      } else if (hitbox.attackType === 'overhead' && !this.isCrouching) {
        isGuarding = true; // Standing blocks Overhead!
      } else if (hitbox.attackType === 'mid') {
        isGuarding = true; // Mid is blocked both standing and crouching!
      }
    }

    // Compute damage mitigated by character's defense stat
    const incomingDamage = Math.max(1, Math.round(hitbox.damage * this.defenseFactor));

    if (isGuarding) {
      // Guard successful!
      const chipDamage = Math.max(1, Math.round(incomingDamage * GAME_CONFIG.FIGHTER.BLOCK_DAMAGE_RATIO));
      this.health = Math.max(0, this.health - chipDamage);

      if (this.health <= 0) {
      this.triggerDefeat();
      return { blocked: true, damage: incomingDamage, ko: true};
      }

      // Block pushback & stun
      this.vx = -this.facing * (hitbox.knockbackX * 0.7);
      this.state = FIGHTER_STATE.BLOCK;
      this.blockstunTimer = hitbox.blockstun || 160;
      this.currentAttack = null;
      this.activeHitbox = null;

      this.playAnimation(this.isCrouching ? 'block_low' : 'block_high');
      soundManager.playBlock();

      // Guard sparks
      const sparkX = this.x + this.facing * 20;
      const sparkY = this.y - 35;
      this.scene.particleManager.spawnBlockSpark(sparkX, sparkY);

      // Build small defensive meter
      this.gainSuper(3);

      return { blocked: true, damage: chipDamage };
    }

    // Full Hit connected!
    this.health = Math.max(0, this.health - incomingDamage);

    // Meter gains
    this.gainSuper(Math.round(incomingDamage * 0.5));
    if (hitbox.attacker) {
      hitbox.attacker.gainSuper(Math.round(incomingDamage * 0.8));
      if (!hitbox.isProjectile) hitbox.attacker.canCancelIntoSpecial = true; // Enables combo canceling (melee hits only)!
      hitbox.attacker.comboCounter++;
    }

    // Sound and particles
    if (hitbox.hitstop >= GAME_CONFIG.HITSTOP.HEAVY) {
      soundManager.playHeavyHit();
      this.scene.cameras.main.shake(160, 0.015);
    } else {
      soundManager.playLightHit();
      this.scene.cameras.main.shake(80, 0.006);
    }

    const sparkX = hitbox.isProjectile ? hitbox.x : (this.x + (hitbox.attacker ? hitbox.attacker.x : this.x)) / 2;
    const sparkY = this.y - 40;

    this.scene.particleManager.spawnHitSpark(sparkX, sparkY);
    this.scene.ui.showDamageText(this.x, this.y - 70, incomingDamage, hitbox.attacker ? hitbox.attacker.comboCounter : 1);

    // Knockdown or Hitstun
    if (this.health <= 0) {
      this.triggerDefeat();
      return { blocked: false, damage: incomingDamage, ko: true };
    }

    if (hitbox.isKnockdown || !this.isGrounded) {
      // Knockdown launch
      this.state = FIGHTER_STATE.KNOCKDOWN;
      this.stateTimer = 0;
      this.isGrounded = false;
      this.vx = -this.facing * hitbox.knockbackX;
      this.vy = hitbox.knockbackY || -260;
      this.currentAttack = null;
      this.activeHitbox = null;
      this.playAnimation('knockdown');
    } else {
      // Ground hit flinch
      this.state = FIGHTER_STATE.HURT;
      this.hitstunTimer = hitbox.hitstun || 220;
      this.vx = -this.facing * hitbox.knockbackX;
      this.currentAttack = null;
      this.activeHitbox = null;
      this.playAnimation(this.isCrouching ? 'hurt_low' : 'hurt_high');
    }

    return { blocked: false, damage: hitbox.damage, ko: false };
  }

  triggerDefeat() {
    this.health = 0;
    this.state = FIGHTER_STATE.DEFEAT;
    this.isGrounded = false;
    this.vx = -this.facing * 280;
    this.vy = -300;
    this.currentAttack = null;
    this.activeHitbox = null;
    this.playAnimation('knockdown');
    soundManager.playKO();
    this.scene.triggerKO(this);
  }

  triggerVictory() {
    this.state = FIGHTER_STATE.VICTORY;
    this.vx = 0;
    this.vy = 0;
    this.currentAttack = null;
    this.activeHitbox = null;
    this.playAnimation('victory');
  }

  gainSuper(amount) {
    this.superMeter = Math.min(this.maxSuper, this.superMeter + amount);
  }

  recoverFromHit() {
    // The combo belongs to the attacker: it ends when the defender recovers
    if (this.opponent) this.opponent.comboCounter = 0;
    this.comboCounter = 0;
    this.state = this.isCrouching ? FIGHTER_STATE.CROUCH : FIGHTER_STATE.IDLE;
    this.playAnimation(this.isCrouching ? 'crouch' : 'idle');
  }

  recoverFromBlock() {
    this.state = this.isCrouching ? FIGHTER_STATE.CROUCH : FIGHTER_STATE.IDLE;
    this.playAnimation(this.isCrouching ? 'crouch' : 'idle');
  }

  applyPhysics(dt, delta) {
    // Gravity
    if (!this.isGrounded) {
      this.vy += GAME_CONFIG.FIGHTER.GRAVITY * delta;
      this.y += this.vy * delta;

      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.vy = 0;
        this.isGrounded = true;

        if (this.state === FIGHTER_STATE.JUMP) {
          this.state = FIGHTER_STATE.IDLE;
          this.playAnimation('idle');
          this.scene.particleManager.spawnDust(this.x, this.groundY);
        } else if (this.state === FIGHTER_STATE.KNOCKDOWN && this.stateTimer < 50) {
          // Bounce on knockdown ground impact
          this.vy = -120;
          this.isGrounded = false;
          this.scene.particleManager.spawnDust(this.x, this.groundY);
        }
      }
    }

    // Horizontal friction on hit/knockback. The sim advances in fixed 60 Hz
    // ticks (dt is always exactly TICK_MS), so the per-tick decay is a plain
    // constant — no Math.pow in the sim path, and frame-rate independent.
    if (this.state === FIGHTER_STATE.HURT || this.state === FIGHTER_STATE.BLOCK || this.state === FIGHTER_STATE.KNOCKDOWN) {
      this.vx *= 0.88;
    }

    this.x += this.vx * delta;

    // Decaying forward impulse of heavy attacks (per-tick decay constant)
    if (this.lungeVx !== 0) {
      this.x += this.lungeVx * delta;
      this.lungeVx *= 0.85;
      if (Math.abs(this.lungeVx) < 2) this.lungeVx = 0;
    }

    // Arena Boundaries clamp
    const minX = 70;
    const maxX = GAME_CONFIG.STAGE_WIDTH - 70;
    if (this.x < minX) {
      this.x = minX;
      this.vx = 0;
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx = 0;
    }
  }

  playAnimation(name) {
    const key = `${this.charId}_${name}`;
    if (this.manualAttackFrames) {
      // Coming out of a sim-driven attack animation: anims.stop() keeps
      // currentAnim set, so force a restart of the (possibly same-keyed) anim.
      this.manualAttackFrames = false;
      this.sprite.anims.stop();
      this.sprite.play(key, true);
      return;
    }
    if (this.sprite.anims.currentAnim?.key !== key) {
      this.sprite.play(key, true);
    }
  }

  // Bounding boxes for combat collision system — per-character model data
  // (data/hitboxes.js), in world units relative to (x, y), mirrored by facing.
  getPushBox() {
    const spec = getPushboxSpec(this.charId);
    const h = this.isCrouching ? spec.crouchH : spec.h;
    return {
      x: this.x - spec.w / 2,
      y: this.y - h,
      w: spec.w,
      h: h
    };
  }

  getHurtBoxes() {
    if (this.isInvincible || this.state === FIGHTER_STATE.KNOCKDOWN || this.state === FIGHTER_STATE.GETUP ||
        this.state === FIGHTER_STATE.DEFEAT || this.state === FIGHTER_STATE.VICTORY) {
      return [];
    }

    const spec = getHurtboxSpec(this.charId);
    const set = this.isCrouching ? spec.crouch : spec.standing;
    return set.map(b => ({
      name: b.name,
      x: this.facing === 1 ? this.x + b.x : this.x - b.x - b.w,
      y: this.y + b.y,
      w: b.w,
      h: b.h
    }));
  }

  getActiveHitbox() {
    if (!this.activeHitbox) return null;
    const hb = this.activeHitbox;
    const worldX = this.facing === 1 ? (this.x + hb.x) : (this.x - hb.x - hb.w);
    const worldY = this.y + hb.y;
    return {
      x: worldX,
      y: worldY,
      w: hb.w,
      h: hb.h,
      damage: hb.damage,
      hitstop: hb.hitstop,
      hitstun: hb.hitstun,
      blockstun: hb.blockstun,
      knockbackX: hb.knockbackX,
      knockbackY: hb.knockbackY,
      attackType: hb.attackType,
      isKnockdown: hb.isKnockdown,
      isSuper: hb.isSuper,
      attacker: this
    };
  }
}
