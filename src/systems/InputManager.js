import { GAME_CONFIG } from '../config.js';

export class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.keyState = {};
    this.prevKeyState = {};

    // Motion input history buffers for P1 and P2
    this.p1History = [];
    this.p2History = [];

    // Touch / Virtual controls state
    this.virtualInput = {
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
      super: false
    };

    this.prevVirtualInput = { ...this.virtualInput };

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      // Prevent browser scrolling on space/arrows
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      this.keyState[e.code] = true;

      // Global hotkeys
      if (e.code === 'KeyH') {
        this.scene.debugOverlay.toggle();
      } else if (e.code === 'KeyR') {
        this.scene.restartMatch();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keyState[e.code] = false;
    });
  }

  update(dt, p1, p2, gameMode) {
    // 1. Process P1 inputs
    this.updatePlayer1(p1);

    // 2. Process P2 inputs (if in 2P mode)
    if (gameMode === 'PVP') {
      this.updatePlayer2(p2);
    }

    // Save previous state for justPressed edge detection
    this.prevKeyState = { ...this.keyState };
    this.prevVirtualInput = { ...this.virtualInput };
  }

  isDown(code) {
    return !!this.keyState[code];
  }

  justPressed(code) {
    return !!this.keyState[code] && !this.prevKeyState[code];
  }

  justPressedVirtual(name) {
    return !!this.virtualInput[name] && !this.prevVirtualInput[name];
  }

  updatePlayer1(p1) {
    const k = GAME_CONFIG.P1_KEYS;
    const v = this.virtualInput;

    const up = this.isDown(k.UP) || v.up;
    const down = this.isDown(k.DOWN) || v.down;
    const left = this.isDown(k.LEFT) || v.left;
    const right = this.isDown(k.RIGHT) || v.right;

    // Attacks
    const lpDown = this.isDown(k.LIGHT_PUNCH) || v.lightPunch;
    const hpDown = this.isDown(k.HEAVY_PUNCH) || v.heavyPunch;
    const lkDown = this.isDown(k.LIGHT_KICK) || v.lightKick;
    const hkDown = this.isDown(k.HEAVY_KICK) || v.heavyKick;
    const fbDown = this.isDown(k.FIREBALL) || v.fireball;
    const dpDown = this.isDown(k.UPPERCUT) || v.uppercut;
    const spDown = this.isDown(k.SUPER) || v.super;

    const justLP = this.justPressed(k.LIGHT_PUNCH) || this.justPressedVirtual('lightPunch');
    const justHP = this.justPressed(k.HEAVY_PUNCH) || this.justPressedVirtual('heavyPunch');
    const justLK = this.justPressed(k.LIGHT_KICK) || this.justPressedVirtual('lightKick');
    const justHK = this.justPressed(k.HEAVY_KICK) || this.justPressedVirtual('heavyKick');
    const justFB = this.justPressed(k.FIREBALL) || this.justPressedVirtual('fireball');
    const justDP = this.justPressed(k.UPPERCUT) || this.justPressedVirtual('uppercut');
    const justSP = this.justPressed(k.SUPER) || this.justPressedVirtual('super');

    // Motion input buffer tracking (Quarter circle forward: ↓ ↘ → + P)
    this.recordDirection(this.p1History, down, left, right, p1.facing);
    const motionFireball = (justLP || justHP) && this.checkQCF(this.p1History, p1.facing);
    const motionUppercut = (justLP || justHP) && this.checkDP(this.p1History, p1.facing);

    p1.input = {
      up,
      down,
      left,
      right,
      lightPunch: lpDown,
      heavyPunch: hpDown,
      lightKick: lkDown,
      heavyKick: hkDown,
      fireball: fbDown,
      uppercut: dpDown,
      super: spDown,

      justLightPunch: justLP,
      justHeavyPunch: justHP,
      justLightKick: justLK,
      justHeavyKick: justHK,
      justFireball: justFB || motionFireball,
      justUppercut: justDP || motionUppercut,
      justSuper: justSP,
    };
  }

  updatePlayer2(p2) {
    const k = GAME_CONFIG.P2_KEYS;

    const up = this.isDown(k.UP);
    const down = this.isDown(k.DOWN);
    const left = this.isDown(k.LEFT);
    const right = this.isDown(k.RIGHT);

    const lpDown = this.isDown(k.LIGHT_PUNCH) || this.isDown(k.ALT_LIGHT_PUNCH);
    const hpDown = this.isDown(k.HEAVY_PUNCH) || this.isDown(k.ALT_HEAVY_PUNCH);
    const lkDown = this.isDown(k.LIGHT_KICK) || this.isDown(k.ALT_LIGHT_KICK);
    const hkDown = this.isDown(k.HEAVY_KICK) || this.isDown(k.ALT_HEAVY_KICK);
    const fbDown = this.isDown(k.FIREBALL) || this.isDown(k.ALT_FIREBALL);
    const dpDown = this.isDown(k.UPPERCUT) || this.isDown(k.ALT_UPPERCUT);
    const spDown = this.isDown(k.SUPER);

    const justLP = this.justPressed(k.LIGHT_PUNCH) || this.justPressed(k.ALT_LIGHT_PUNCH);
    const justHP = this.justPressed(k.HEAVY_PUNCH) || this.justPressed(k.ALT_HEAVY_PUNCH);
    const justLK = this.justPressed(k.LIGHT_KICK) || this.justPressed(k.ALT_LIGHT_KICK);
    const justHK = this.justPressed(k.HEAVY_KICK) || this.justPressed(k.ALT_HEAVY_KICK);
    const justFB = this.justPressed(k.FIREBALL) || this.justPressed(k.ALT_FIREBALL);
    const justDP = this.justPressed(k.UPPERCUT) || this.justPressed(k.ALT_UPPERCUT);
    const justSP = this.justPressed(k.SUPER);

    this.recordDirection(this.p2History, down, left, right, p2.facing);
    const motionFireball = (justLP || justHP) && this.checkQCF(this.p2History, p2.facing);
    const motionUppercut = (justLP || justHP) && this.checkDP(this.p2History, p2.facing);

    p2.input = {
      up,
      down,
      left,
      right,
      lightPunch: lpDown,
      heavyPunch: hpDown,
      lightKick: lkDown,
      heavyKick: hkDown,
      fireball: fbDown,
      uppercut: dpDown,
      super: spDown,

      justLightPunch: justLP,
      justHeavyPunch: justHP,
      justLightKick: justLK,
      justHeavyKick: justHK,
      justFireball: justFB || motionFireball,
      justUppercut: justDP || motionUppercut,
      justSuper: justSP,
    };
  }

  recordDirection(history, down, left, right, facing) {
    const fwd = (facing === 1 && right) || (facing === -1 && left);
    const back = (facing === 1 && left) || (facing === -1 && right);

    let dir = 5; // Numpad 5 = neutral
    if (down && fwd) dir = 3;
    else if (down && back) dir = 1;
    else if (down) dir = 2;
    else if (fwd) dir = 6;
    else if (back) dir = 4;

    const now = Date.now();
    if (history.length === 0 || history[history.length - 1].dir !== dir) {
      history.push({ dir, time: now });
      if (history.length > 20) history.shift();
    }
  }

  checkQCF(history, facing) {
    // Looks for 2 -> 3 -> 6 (Down -> Down-Forward -> Forward) within last 400ms
    const now = Date.now();
    const recent = history.filter(h => now - h.time < 400).map(h => h.dir);
    const str = recent.join('');
    return str.includes('236') || str.includes('26');
  }

  checkDP(history, facing) {
    // Looks for 6 -> 2 -> 3 (Forward -> Down -> Down-Forward) within last 400ms
    const now = Date.now();
    const recent = history.filter(h => now - h.time < 400).map(h => h.dir);
    const str = recent.join('');
    return str.includes('623');
  }
}
