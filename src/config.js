export const GAME_CONFIG = {
  WIDTH: 960,
  HEIGHT: 540,
  STAGE_WIDTH: 1500,
  STAGE_HEIGHT: 540,
  GROUND_Y: 450,
  ROUND_TIME: 99,
  ROUNDS_TO_WIN: 2,

  FIGHTER: {
    SCALE: 2.2,
    WIDTH: 50,
    HEIGHT: 96,
    GRAVITY: 1500,
    JUMP_FORCE: -680,
    WALK_SPEED_FWD: 220,
    WALK_SPEED_BACK: 160,
    DASH_SPEED: 420,
    MAX_HEALTH: 100,
    MAX_SUPER: 100,
    BLOCK_DAMAGE_RATIO: 0.15, // 15% chip damage on block
    KNOCKBACK_LIGHT: 140,
    KNOCKBACK_HEAVY: 280,
    KNOCKBACK_SUPER: 380,
  },

  HITSTOP: {
    LIGHT: 70,    // ms
    HEAVY: 130,   // ms
    SUPER: 240,   // ms
    BLOCK: 60,    // ms
  },

  P1_KEYS: {
    UP: 'KeyW',
    DOWN: 'KeyS',
    LEFT: 'KeyA',
    RIGHT: 'KeyD',
    LIGHT_PUNCH: 'KeyJ',
    HEAVY_PUNCH: 'KeyU',
    LIGHT_KICK: 'KeyK',
    HEAVY_KICK: 'KeyI',
    FIREBALL: 'KeyO',
    UPPERCUT: 'KeyL',
    SUPER: 'Space',
  },

  P2_KEYS: {
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    LIGHT_PUNCH: 'Numpad1',
    HEAVY_PUNCH: 'Numpad4',
    LIGHT_KICK: 'Numpad2',
    HEAVY_KICK: 'Numpad5',
    FIREBALL: 'Numpad6',
    UPPERCUT: 'Numpad3',
    SUPER: 'Enter',
    // Secondary fallbacks for keyboards without numpad:
    ALT_LIGHT_PUNCH: 'KeyB',
    ALT_HEAVY_PUNCH: 'KeyG',
    ALT_LIGHT_KICK: 'KeyN',
    ALT_HEAVY_KICK: 'KeyH',
    ALT_FIREBALL: 'KeyY',
    ALT_UPPERCUT: 'KeyT',
  }
};
