import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { soundManager } from '../audio/SoundManager.js';
import { Fighter } from '../entities/Fighter.js';
import { Projectile } from '../entities/Projectile.js';
import { ParticleManager } from '../entities/ParticleManager.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { InputManager } from '../systems/InputManager.js';
import { AIController } from '../systems/AIController.js';
import { CameraController } from '../systems/CameraController.js';
import { TICK_MS } from '../sim/constants.js';
import { createRNG } from '../sim/rng.js';
import { HUD } from '../ui/HUD.js';
import { DebugOverlay } from '../ui/DebugOverlay.js';
import { VirtualControls } from '../ui/VirtualControls.js';

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data) {
    this.p1CharId = data?.p1CharId || 'dragon';
    this.p2CharId = data?.p2CharId || 'phoenix';
    this.gameMode = data?.gameMode || 'CPU'; // 'CPU', 'PVP', 'TRAINING'
    // Match seed: drives the sim RNG (AI). Fixed by default so a local match is
    // deterministic run-to-run; online play overrides it with the host's seed.
    this.seed = (data?.seed ?? 0xC0FFEE) >>> 0;
  }

  create() {
    this.projectiles = [];
    this.pendingKOs = []; // fighters knocked out during the current tick
    this.roundState = 'INTRO';
    this.currentRound = 1;
    this.roundTime = GAME_CONFIG.ROUND_TIME;
    this.roundToken = 0; // bumped every round/match to invalidate stale scheduled callbacks
    this.tick = 0;       // sim tick counter (60 Hz)
    this.accum = 0;      // fixed-tick accumulator (ms of unconsumed real time)
    this.scheduled = []; // tick-based callbacks replacing time.delayedCall in game flow

    // 1. Stage Parallax Setup
    this.createStage();

    // 2. Systems and Managers
    this.particleManager = new ParticleManager(this);
    this.combatSystem = new CombatSystem(this);
    this.inputManager = new InputManager(this);
    this.rng = createRNG(this.seed);
    this.aiController = new AIController(this.rng);
    this.cameraController = new CameraController(this);

    // 3. Spawn Fighters
    const p1StartX = GAME_CONFIG.STAGE_WIDTH / 2 - 160;
    const p2StartX = GAME_CONFIG.STAGE_WIDTH / 2 + 160;

    this.p1 = new Fighter(this, p1StartX, GAME_CONFIG.GROUND_Y, this.p1CharId, 1, true);
    this.p2 = new Fighter(this, p2StartX, GAME_CONFIG.GROUND_Y, this.p2CharId, -1, false);

    this.p1.setOpponent(this.p2);
    this.p2.setOpponent(this.p1);

    // 4. UI Elements
    this.ui = new HUD(this);
    this.debugOverlay = new DebugOverlay(this);
    this.virtualControls = new VirtualControls(this);

    // Link global HTML buttons to game controls
    this.setupHtmlButtons();

    // Escape key listener to return to character select
    this.input.keyboard.on('keydown-Escape', () => {
      this.returnToCharSelect();
    });

    // Remove the InputManager's window listeners when the scene shuts down,
    // otherwise they accumulate on every visit to the battle scene.
    this.events.once(Phaser.Events.SHUTDOWN, () => {
      this.inputManager?.destroy();
    });

    // 5. Start Round 1
    this.startRound();
  }

  returnToCharSelect() {
    this.scene.start('CharacterSelectScene', { gameMode: this.gameMode });
  }

  createStage() {
    // Parallax Sky & Skyline
    this.bgSky = this.add.image(0, 0, 'stage_sky').setOrigin(0, 0);
    this.bgSky.setScrollFactor(0.25, 1.0);

    // Parallax Midground Pagoda / Arena
    this.bgMid = this.add.image(0, 0, 'stage_mid').setOrigin(0, 0);
    this.bgMid.setScrollFactor(0.65, 1.0);

    // Foreground Floor
    this.floor = this.add.image(0, GAME_CONFIG.GROUND_Y - 4, 'stage_floor').setOrigin(0, 0);
    this.floor.setDepth(2);
  }

  setupHtmlButtons() {
    const btnCpu = document.getElementById('btn-mode-cpu');
    const btn2p = document.getElementById('btn-mode-2p');
    const btnDummy = document.getElementById('btn-mode-dummy');
    const btnHitboxes = document.getElementById('btn-hitboxes');
    const btnScanlines = document.getElementById('btn-scanlines');
    const btnTouch = document.getElementById('btn-touch');
    const btnReset = document.getElementById('btn-reset');
    const btnCharSelect = document.getElementById('btn-char-select');

    if (btnCharSelect) {
      btnCharSelect.onclick = () => {
        this.returnToCharSelect();
      };
    }

    const setModeActive = (activeBtn) => {
      [btnCpu, btn2p, btnDummy].forEach(b => b?.classList.remove('active'));
      activeBtn?.classList.add('active');
    };

    if (btnCpu) {
      btnCpu.onclick = () => {
        this.gameMode = 'CPU';
        setModeActive(btnCpu);
        this.ui.showBanner('MODE: P1 vs CPU', '', '#ffa502', 800);
      };
    }

    if (btn2p) {
      btn2p.onclick = () => {
        this.gameMode = 'PVP';
        setModeActive(btn2p);
        this.ui.showBanner('MODE: 2 PLAYERS', 'LOCAL MATCH', '#2ed573', 800);
      };
    }

    if (btnDummy) {
      btnDummy.onclick = () => {
        this.gameMode = 'TRAINING';
        setModeActive(btnDummy);
        this.ui.showBanner('MODE: TRAINING DUMMY', 'INFINITE HEALTH', '#70a1ff', 800);
      };
    }

    if (btnHitboxes) {
      btnHitboxes.onclick = () => {
        this.debugOverlay.toggle();
        btnHitboxes.classList.toggle('active', this.debugOverlay.visible);
      };
    }

    if (btnScanlines) {
      btnScanlines.onclick = () => {
        const scanlines = document.getElementById('scanlines');
        scanlines?.classList.toggle('off');
        btnScanlines.classList.toggle('active', !scanlines?.classList.contains('off'));
      };
    }

    if (btnTouch) {
      btnTouch.onclick = () => {
        this.virtualControls.toggle();
        btnTouch.classList.toggle('active', this.virtualControls.visible);
      };
    }

    if (btnReset) {
      btnReset.onclick = () => {
        this.restartMatch();
      };
    }
  }

  startRound() {
    // Invalidate pending scheduled callbacks (FIGHT! banner, KO flow...) from a previous round
    this.roundToken++;
    this.roundState = 'INTRO';
    this.roundTime = GAME_CONFIG.ROUND_TIME;
    this.pendingKOs = [];

    // Reset fighter positions
    const p1StartX = GAME_CONFIG.STAGE_WIDTH / 2 - 160;
    const p2StartX = GAME_CONFIG.STAGE_WIDTH / 2 + 160;
    this.p1.resetRound(p1StartX, 1);
    this.p2.resetRound(p2StartX, -1);

    // Destroy leftover projectiles
    this.projectiles.forEach(p => p.destroy());
    this.projectiles = [];

    // Announce Round
    const roundLabel = ((this.p1.wins === GAME_CONFIG.ROUNDS_TO_WIN - 1) && (this.p2.wins === GAME_CONFIG.ROUNDS_TO_WIN - 1)) ? 'FINAL ROUND' : `ROUND ${this.currentRound}`;
    soundManager.playRoundFight();
    this.ui.showBanner(roundLabel, 'GET READY...', '#ff4757', 900);

    this.scheduleTicks(1100, () => {
      soundManager.playRoundFight();
      this.ui.showBanner('FIGHT!', '', '#ffa502', 600);
      this.roundState = 'FIGHTING';
    });
  }

  // Tick-based replacement for this.time.delayedCall in game-flow code: the
  // callback fires after `ms` worth of 60 Hz sim ticks, and only if the round
  // token is still current (startRound/restartMatch bump it to invalidate
  // stale transitions). Wall-clock scheduling here would desync replays/netplay.
  scheduleTicks(ms, fn) {
    this.scheduled.push({
      ticksLeft: Math.max(1, Math.round(ms / TICK_MS)),
      token: this.roundToken,
      fn
    });
  }

  runScheduled() {
    for (let i = this.scheduled.length - 1; i >= 0; i--) {
      const s = this.scheduled[i];
      s.ticksLeft--;
      if (s.ticksLeft <= 0) {
        this.scheduled.splice(i, 1);
        if (s.token === this.roundToken) s.fn();
      }
    }
  }

  update(time, delta) {
    // Fixed-tick simulation: the sim only ever advances in exact TICK_MS steps,
    // so the game state is identical at any display refresh rate (60/144/240 Hz)
    // — the core requirement for deterministic lockstep netcode.
    this.accum += Math.min(delta, 100);
    let steps = 0;
    while (this.accum >= TICK_MS && steps < 6) {
      this.accum -= TICK_MS;
      this.simTick();
      steps++;
    }
    if (steps === 6) this.accum = 0; // heavy stall: drop the backlog instead of spiraling

    // Presentation-only systems run once per rendered frame
    const frameDt = Math.min(delta, 50); // clamp to avoid huge camera jumps
    this.cameraController.update(this.p1, this.p2, frameDt);
    this.ui.update(this.p1, this.p2, this.roundTime);
    this.debugOverlay.update(this.p1, this.p2, this.projectiles);
  }

  // One deterministic 60 Hz simulation step.
  simTick() {
    const dt = TICK_MS;
    this.tick++;

    // 1. Process Inputs (sampled once per tick, not per rendered frame)
    if (this.roundState === 'FIGHTING') {
      this.inputManager.update(dt, this.p1, this.p2, this.gameMode);
      this.aiController.update(dt, this.p2, this.p1, this.gameMode);

      // Decrement Timer (training mode never runs out of time)
      this.roundTime -= TICK_MS / 1000;
      if (this.roundTime <= 0) {
        if (this.gameMode === 'TRAINING') {
          this.roundTime = GAME_CONFIG.ROUND_TIME;
        } else {
          this.handleTimeOver();
        }
      }
    } else {
      // Freeze input intents during round transitions
      this.clearFighterInputs(this.p1);
      this.clearFighterInputs(this.p2);
    }

    // 2. Combat System & Collisions
    const isFrozen = this.combatSystem.update(dt, this.p1, this.p2, this.projectiles);

    // Every KO triggered by this tick's collisions is resolved together:
    // one KO = a winner, two KOs on the same tick = DRAW.
    this.resolvePendingKOs();

    // Hitstop freezes the sim; freeze the Phaser anims with it so non-attack
    // visuals don't drift from the hitbox timeline. Attack frames are driven
    // from the sim timer (Fighter.updateAttackFrame) and freeze automatically.
    for (const p of [this.p1, this.p2]) {
      if (isFrozen) p.sprite.anims.pause();
      else p.sprite.anims.resume();
    }

    // If game is in hitstop freeze, fighters pause animation and movement!
    if (!isFrozen) {
      this.p1.update(dt);
      this.p2.update(dt);

      // Projectiles update
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.update(dt);
        if (p.isDead) {
          this.projectiles.splice(i, 1);
        }
      }
    }

    // 3. Tick-based round/match flow transitions
    this.runScheduled();
  }

  clearFighterInputs(fighter) {
    Object.keys(fighter.input).forEach(k => {
      fighter.input[k] = false;
    });
  }

  spawnProjectile(owner, x, y, direction) {
    const proj = new Projectile(this, owner, x, y, direction);
    this.projectiles.push(proj);
  }

  // Called by Fighter.triggerDefeat(). The KO is only queued here: it is resolved
  // once per frame in resolvePendingKOs(), so the first fighter to die in a frame
  // does not automatically lose when the other one dies on the same frame.
  triggerKO(loser) {
    if (this.roundState === 'ROUND_OVER' || this.roundState === 'MATCH_OVER') return;
    if (!this.pendingKOs.includes(loser)) {
      this.pendingKOs.push(loser);
    }
  }

  resolvePendingKOs() {
    if (this.pendingKOs.length === 0) return;

    const losers = this.pendingKOs;
    this.pendingKOs = [];

    if (this.roundState === 'ROUND_OVER' || this.roundState === 'MATCH_OVER') return;
    this.roundState = 'ROUND_OVER';

    // Both fighters KO'd on the same tick: DRAW (no round point for anyone)
    if (losers.length >= 2) {
      this.handleDoubleKO();
      return;
    }

    const loser = losers[0];
    const winner = (loser === this.p1) ? this.p2 : this.p1;

    // Training mode: the dummy gets back up where it fell, the round never ends
    if (this.gameMode === 'TRAINING') {
      this.ui.showBanner('K.O.!', 'DUMMY GETS BACK UP', '#70a1ff', 1200);
      this.scheduleTicks(1300, () => {
        loser.resetRound(loser.x, loser.facing);
        this.roundState = 'FIGHTING';
      });
      return;
    }

    winner.wins++;

    const isPerfect = (winner.health === winner.maxHealth);
    this.ui.showBanner('K.O.!', isPerfect ? 'PERFECT VICTORY!' : '', '#ff4757', 1500);

    this.scheduleTicks(1600, () => {
      winner.triggerVictory();

      if (winner.wins >= GAME_CONFIG.ROUNDS_TO_WIN) {
        // Match Over!
        this.roundState = 'MATCH_OVER';
        this.ui.showBanner(`${winner.name} WINS!`, 'CHAMPION!', '#ffa502', 3000);

        this.scheduleTicks(3500, () => {
          this.restartMatch();
        });
      } else {
        // Next round
        this.currentRound++;
        this.scheduleTicks(1500, () => {
          this.startRound();
        });
      }
    });
  }

  handleDoubleKO() {
    this.ui.showBanner('DOUBLE K.O.!', 'DRAW GAME!', '#70a1ff', 2000);

    // Same flow as a time-over draw: nobody scores, next round
    this.scheduleTicks(2400, () => {
      this.currentRound++;
      this.startRound();
    });
  }

  handleTimeOver() {
    if (this.roundState !== 'FIGHTING') return;
    this.roundState = 'ROUND_OVER';
    soundManager.playKO();

    if (this.p1.health > this.p2.health) {
      this.p1.wins++;
      this.p2.triggerDefeat();
      this.ui.showBanner('TIME OVER', 'PLAYER 1 WINS!', '#ffa502', 2000);
    } else if (this.p2.health > this.p1.health) {
      this.p2.wins++;
      this.p1.triggerDefeat();
      this.ui.showBanner('TIME OVER', 'PLAYER 2 WINS!', '#ffa502', 2000);
    } else {
      this.ui.showBanner('TIME OVER', 'DRAW GAME!', '#70a1ff', 2000);
    }

    this.scheduleTicks(2400, () => {
      if (this.p1.wins >= GAME_CONFIG.ROUNDS_TO_WIN || this.p2.wins >= GAME_CONFIG.ROUNDS_TO_WIN) {
        this.restartMatch();
      } else {
        this.currentRound++;
        this.startRound();
      }
    });
  }

  restartMatch() {
    this.p1.wins = 0;
    this.p2.wins = 0;
    this.p1.health = GAME_CONFIG.FIGHTER.MAX_HEALTH;
    this.p2.health = GAME_CONFIG.FIGHTER.MAX_HEALTH;
    this.p1.superMeter = 0;
    this.p2.superMeter = 0;
    this.currentRound = 1;
    this.startRound();
  }
}
