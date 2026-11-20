import { GAME_CONFIG } from '../config.js';
import { soundManager } from '../audio/SoundManager.js';
import { getCharacter } from '../data/characters.js';

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

    // Pushbox and Hurtbox definitions (relative to x, y)
    this.width = GAME_CONFIG.FIGHTER.WIDTH;
    this.height = GAME_CONFIG.FIGHTER.HEIGHT;

    // Phaser Sprite
    this.sprite = scene.add.sprite(x, y, `${charId}_idle_0`);
    this.sprite.setScale(GAME_CONFIG.FIGHTER.SCALE);
    this.sprite.setOrigin(0.5, 0.88);
    this.sprite.play(`${charId}_idle`);

    // Shadow on the ground
    this.shadow = scene.add.ellipse(x, this.groundY, 48, 12, 0x000000, 0.45);
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
    this.state = FIGHTER_STATE.IDLE;
    this.playAnimation('idle');
    this.sprite.setAlpha(1.0);
    this.sprite.setPosition(this.x, this.y);
  }

  update(dt) {
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
        // Flash during invincibility
        this.sprite.setAlpha(Math.floor(Date.now() / 60) % 2 === 0 ? 0.4 : 1.0);
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

    // 2. Jumping
    if (this.input.up && this.isGrounded) {
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
    // Air attack triggers
    if (this.input.justLightPunch || this.input.justHeavyPunch) {
      this.startAttack('jump_punch', {
        damage: this.input.justHeavyPunch ? 12 : 7,
        startup: 80,
        active: 180,
        recovery: 100,
        hitstop: this.input.justHeavyPunch ? GAME_CONFIG.HITSTOP.HEAVY : GAME_CONFIG.HITSTOP.LIGHT,
        hitstun: 280,
        blockstun: 200,
        knockbackX: 160,
        knockbackY: 0,
        isKnockdown: false,
        attackType: 'overhead', // Jump-ins are overheads!
        hitbox: { x: 26, y: -45, w: 32, h: 28 }
      });
    } else if (this.input.justLightKick || this.input.justHeavyKick) {
      this.startAttack('jump_kick', {
        damage: this.input.justHeavyKick ? 14 : 8,
        startup: 90,
        active: 200,
        recovery: 120,
        hitstop: this.input.justHeavyKick ? GAME_CONFIG.HITSTOP.HEAVY : GAME_CONFIG.HITSTOP.LIGHT,
        hitstun: 300,
        blockstun: 220,
        knockbackX: 200,
        knockbackY: 0,
        isKnockdown: false,
        attackType: 'overhead',
        hitbox: { x: 30, y: -25, w: 36, h: 28 }
      });
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

    // Crouching Attacks
    if (this.isCrouching) {
      if (this.input.justLightPunch) {
        this.startAttack('crouch_punch', {
          damage: 5,
          startup: 80,
          active: 100,
          recovery: 110,
          hitstop: GAME_CONFIG.HITSTOP.LIGHT,
          hitstun: 180,
          blockstun: 150,
          knockbackX: 100,
          knockbackY: 0,
          isKnockdown: false,
          attackType: 'mid',
          hitbox: { x: 28, y: -22, w: 30, h: 18 }
        });
        return true;
      }
      if (this.input.justHeavyPunch) {
        this.startAttack('crouch_punch', {
          damage: 12,
          startup: 120,
          active: 130,
          recovery: 160,
          hitstop: GAME_CONFIG.HITSTOP.HEAVY,
          hitstun: 260,
          blockstun: 210,
          knockbackX: 180,
          knockbackY: 0,
          isKnockdown: false,
          attackType: 'mid',
          hitbox: { x: 32, y: -22, w: 34, h: 22 }
        });
        return true;
      }
      if (this.input.justLightKick) {
        this.startAttack('crouch_kick', {
          damage: 6,
          startup: 90,
          active: 110,
          recovery: 120,
          hitstop: GAME_CONFIG.HITSTOP.LIGHT,
          hitstun: 200,
          blockstun: 170,
          knockbackX: 110,
          knockbackY: 0,
          attackType: 'low',
          isKnockdown: false,
          hitbox: { x: 30, y: -8, w: 38, h: 16 }
        });
        return true;
      }
      if (this.input.justHeavyKick) {
        // Heavy crouch kick = SWEEP (causes knockdown!)
        this.startAttack('crouch_kick', {
          damage: 14,
          startup: 140,
          active: 150,
          recovery: 240,
          hitstop: GAME_CONFIG.HITSTOP.HEAVY,
          hitstun: 320,
          blockstun: 240,
          knockbackX: 250,
          knockbackY: -220,
          attackType: 'low',
          isKnockdown: true,
          hitbox: { x: 36, y: -8, w: 45, h: 16 }
        });
        return true;
      }
    }

    // Standing Attacks
    if (this.input.justLightPunch) {
      this.startAttack('light_punch', {
        damage: 6,
        startup: 70,
        active: 90,
        recovery: 100,
        hitstop: GAME_CONFIG.HITSTOP.LIGHT,
        hitstun: 200,
        blockstun: 160,
        knockbackX: 120,
        knockbackY: 0,
        isKnockdown: false,
        attackType: 'mid',
        hitbox: { x: 32, y: -48, w: 30, h: 20 }
      });
      return true;
    }

    if (this.input.justHeavyPunch) {
      this.startAttack('heavy_punch', {
        damage: 15,
        startup: 130,
        active: 140,
        recovery: 200,
        hitstop: GAME_CONFIG.HITSTOP.HEAVY,
        hitstun: 300,
        blockstun: 230,
        knockbackX: 260,
        knockbackY: 0,
        isKnockdown: false,
        attackType: 'mid',
        hitbox: { x: 42, y: -48, w: 38, h: 24 }
      });
      return true;
    }

    if (this.input.justLightKick) {
      this.startAttack('light_kick', {
        damage: 7,
        startup: 90,
        active: 100,
        recovery: 120,
        hitstop: GAME_CONFIG.HITSTOP.LIGHT,
        hitstun: 210,
        blockstun: 170,
        knockbackX: 140,
        knockbackY: 0,
        isKnockdown: false,
        attackType: 'mid',
        hitbox: { x: 34, y: -30, w: 32, h: 22 }
      });
      return true;
    }

    if (this.input.justHeavyKick) {
      this.startAttack('heavy_kick', {
        damage: 16,
        startup: 140,
        active: 140,
        recovery: 220,
        hitstop: GAME_CONFIG.HITSTOP.HEAVY,
        hitstun: 310,
        blockstun: 240,
        knockbackX: 280,
        knockbackY: 0,
        isKnockdown: false,
        attackType: 'mid',
        hitbox: { x: 44, y: -40, w: 42, h: 26 }
      });
      return true;
    }

    return false;
  }

  startAttack(animKey, attackData) {
    this.state = FIGHTER_STATE.ATTACK;
    const scaledDamage = Math.max(1, Math.round(attackData.damage * this.offenseFactor));
    const scaledStartup = Math.max(30, Math.round(attackData.startup / this.attackSpeedFactor));
    const scaledRecovery = Math.max(40, Math.round(attackData.recovery / this.attackSpeedFactor));

    this.currentAttack = {
      ...attackData,
      damage: scaledDamage,
      startup: scaledStartup,
      recovery: scaledRecovery,
      animKey: animKey,
      phase: 'startup', // startup -> active -> recovery
      timer: 0,
      hasHit: false,
    };
    this.activeHitbox = null;
    this.canCancelIntoSpecial = false;

    // Slight forward step for grounded heavy attacks
    if (this.isGrounded) {
      this.vx = (animKey.includes('heavy') ? this.facing * (60 * this.speedFactor) : 0);
    }

    this.playAnimation(animKey);
    soundManager.playWhoosh(animKey.includes('heavy') ? 0.9 : 1.3);
  }

  startSpecialFireball() {
    this.state = FIGHTER_STATE.ATTACK;
    this.canCancelIntoSpecial = false;
    this.currentAttack = {
      name: 'HADOUKEN',
      animKey: 'special_hadouken',
      phase: 'startup',
      startup: Math.max(50, Math.round(160 / this.attackSpeedFactor)),
      active: 80,
      recovery: Math.max(60, Math.round(240 / this.attackSpeedFactor)),
      timer: 0,
      hasFiredProjectile: false,
    };
    this.vx = 0;
    this.activeHitbox = null;
    this.playAnimation('special_hadouken');
    soundManager.playFireball();
  }

  startSpecialUppercut() {
    this.state = FIGHTER_STATE.ATTACK;
    this.canCancelIntoSpecial = false;
    this.currentAttack = {
      name: 'SHORYUKEN',
      animKey: 'special_shoryuken',
      phase: 'startup',
      startup: Math.max(30, Math.round(80 / this.attackSpeedFactor)),
      active: 280,
      recovery: Math.max(70, Math.round(320 / this.attackSpeedFactor)),
      timer: 0,
      damage: Math.max(1, Math.round(22 * this.offenseFactor)),
      hitstop: GAME_CONFIG.HITSTOP.HEAVY,
      hitstun: 360,
      blockstun: 260,
      knockbackX: 240,
      knockbackY: -340,
      attackType: 'mid',
      isKnockdown: true,
      hasHit: false,
      hitbox: { x: 26, y: -70, w: 40, h: 65 }
    };
    this.isInvincible = true;
    this.invincibilityTimer = 160; // Dragon punch invincibility on startup!
    this.playAnimation('special_shoryuken');
    soundManager.playUppercut();
  }

  executeSuperMove() {
    this.superMeter = 0;
    this.state = FIGHTER_STATE.ATTACK;
    this.canCancelIntoSpecial = false;
    this.currentAttack = {
      name: 'SUPER_COMBO',
      animKey: 'special_shoryuken',
      phase: 'startup',
      startup: Math.max(40, Math.round(140 / this.attackSpeedFactor)),
      active: 380,
      recovery: Math.max(70, Math.round(280 / this.attackSpeedFactor)),
      timer: 0,
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
      hitbox: { x: 30, y: -65, w: 46, h: 70 }
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
    this.playAnimation('special_shoryuken');
  }

  handleAttackUpdate(dt) {
    if (!this.currentAttack) {
      this.state = this.isGrounded ? FIGHTER_STATE.IDLE : FIGHTER_STATE.JUMP;
      return;
    }

    const atk = this.currentAttack;
    atk.timer += dt;

    if (atk.phase === 'startup') {
      if (atk.timer >= atk.startup) {
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

        // Fire projectile if fireball
        if (atk.name === 'HADOUKEN' && !atk.hasFiredProjectile) {
          atk.hasFiredProjectile = true;
          const spawnX = this.x + this.facing * 45;
          const spawnY = this.y - 36;
          this.scene.spawnProjectile(this, spawnX, spawnY, this.facing);
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

      if (atk.timer >= atk.active) {
        atk.phase = 'recovery';
        atk.timer = 0;
        this.activeHitbox = null; // Hitbox becomes inactive during recovery
      }
    } else if (atk.phase === 'recovery') {
      if (atk.timer >= atk.recovery) {
        this.currentAttack = null;
        this.activeHitbox = null;
        this.canCancelIntoSpecial = false;

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

    // Horizontal friction on hit/knockback
    if (this.state === FIGHTER_STATE.HURT || this.state === FIGHTER_STATE.BLOCK || this.state === FIGHTER_STATE.KNOCKDOWN) {
      this.vx *= 0.88;
    }

    this.x += this.vx * delta;

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
    if (this.sprite.anims.currentAnim?.key !== key) {
      this.sprite.play(key, true);
    }
  }

  // Bounding boxes for combat collision system
  getPushBox() {
    const h = this.isCrouching ? 60 : this.height;
    return {
      x: this.x - this.width / 2,
      y: this.y - h,
      w: this.width,
      h: h
    };
  }

  getHurtBoxes() {
    if (this.isInvincible || this.state === FIGHTER_STATE.KNOCKDOWN || this.state === FIGHTER_STATE.GETUP) {
      return [];
    }

    const boxes = [];
    if (this.isCrouching) {
      boxes.push({
        name: 'crouch_body',
        x: this.x - 22,
        y: this.y - 55,
        w: 44,
        h: 55
      });
    } else {
      // Head
      boxes.push({
        name: 'head',
        x: this.x - 16,
        y: this.y - 92,
        w: 32,
        h: 28
      });
      // Torso & legs
      boxes.push({
        name: 'body',
        x: this.x - 22,
        y: this.y - 64,
        w: 44,
        h: 64
      });
    }
    return boxes;
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
