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
  }

  create() {
    this.projectiles = [];
    this.pendingKOs = []; // fighters knocked out during the current frame
    this.roundState = 'INTRO';
    this.currentRound = 1;
    this.roundTime = GAME_CONFIG.ROUND_TIME;

    // 1. Stage Parallax Setup
    this.createStage();

    // 2. Systems and Managers
    this.particleManager = new ParticleManager(this);
    this.combatSystem = new CombatSystem(this);
    this.inputManager = new InputManager(this);
    this.aiController = new AIController();
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

    this.time.delayedCall(1100, () => {
      soundManager.playRoundFight();
      this.ui.showBanner('FIGHT!', '', '#ffa502', 600);
      this.roundState = 'FIGHTING';
    });
  }

  update(time, delta) {
    const dt = Math.min(delta, 50); // Clamp delta to avoid huge physics jumps

    // 1. Process Inputs
    if (this.roundState === 'FIGHTING') {
      this.inputManager.update(dt, this.p1, this.p2, this.gameMode);
      this.aiController.update(dt, this.p2, this.p1, this.gameMode);

      // Decrement Timer
      this.roundTime -= dt / 1000;
      if (this.roundTime <= 0) {
        this.handleTimeOver();
      }
    } else {
      // Freeze input intents during round transitions
      this.clearFighterInputs(this.p1);
      this.clearFighterInputs(this.p2);
    }

    // 2. Combat System & Collisions
    const isFrozen = this.combatSystem.update(dt, this.p1, this.p2, this.projectiles);

    // Every KO triggered by this frame's collisions is resolved together:
    // one KO = a winner, two KOs on the same frame = DRAW.
    this.resolvePendingKOs();

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

    // 3. Camera Dynamic Tracking
    this.cameraController.update(this.p1, this.p2);

    // 4. UI & HUD Update
    this.ui.update(this.p1, this.p2, this.roundTime);

    // 5. Hitbox Debugger Overlay
    this.debugOverlay.update(this.p1, this.p2, this.projectiles);
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

    // Both fighters KO'd on the same frame: DRAW (no round point for anyone)
    if (losers.length >= 2) {
      this.handleDoubleKO();
      return;
    }

    const loser = losers[0];
    const winner = (loser === this.p1) ? this.p2 : this.p1;
    winner.wins++;

    const isPerfect = (winner.health === winner.maxHealth);
    this.ui.showBanner('K.O.!', isPerfect ? 'PERFECT VICTORY!' : '', '#ff4757', 1500);

    this.time.delayedCall(1600, () => {
      winner.triggerVictory();

      if (winner.wins >= GAME_CONFIG.ROUNDS_TO_WIN && this.gameMode !== 'TRAINING') {
        // Match Over!
        this.roundState = 'MATCH_OVER';
        this.ui.showBanner(`${winner.name} WINS!`, 'CHAMPION!', '#ffa502', 3000);

        this.time.delayedCall(3500, () => {
          this.restartMatch();
        });
      } else {
        // Next round
        this.currentRound++;
        this.time.delayedCall(1500, () => {
          this.startRound();
        });
      }
    });
  }

  handleDoubleKO() {
    this.ui.showBanner('DOUBLE K.O.!', 'DRAW GAME!', '#70a1ff', 2000);

    // Same flow as a time-over draw: nobody scores, next round
    this.time.delayedCall(2400, () => {
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

    this.time.delayedCall(2400, () => {
      if ((this.p1.wins >= GAME_CONFIG.ROUNDS_TO_WIN || this.p2.wins >= GAME_CONFIG.ROUNDS_TO_WIN) && this.gameMode !== 'TRAINING') {
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
