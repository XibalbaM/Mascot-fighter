/**
 * Animation timing table — SINGLE SOURCE OF TRUTH for both presentation
 * (SpriteGenerator registers the Phaser anims from this) and simulation
 * (Fighter derives attack phase windows and drives the sprite frame from it).
 *
 * Keeping one table is what guarantees an attack's hitbox is active exactly
 * while the animation shows the limb extended (see `hitFrames`).
 *
 * - frames:    number of frames in the anim (textures `<id>_<prefix>_<i>`)
 * - frameRate: fps the anim plays at
 * - repeat:    loop forever (presentation) — sim attacks never loop
 * - prefix:    texture prefix when it differs from the anim key
 * - hitFrames: [first, last] frame indices during which the attack's hitbox
 *              is active (the "extended limb" frames of the animation)
 */
export const ANIMATIONS = {
  idle:              { frames: 4, frameRate: 8,  repeat: true  },
  walk_fwd:          { frames: 4, frameRate: 10, repeat: true,  prefix: 'walk' },
  walk_back:         { frames: 4, frameRate: 8,  repeat: true,  prefix: 'walk' },
  crouch:            { frames: 2, frameRate: 8,  repeat: true  },
  jump_up:           { frames: 3, frameRate: 6,  repeat: false, prefix: 'jump' },
  dash_fwd:          { frames: 3, frameRate: 16, repeat: false },
  dash_back:         { frames: 3, frameRate: 16, repeat: false },

  light_punch:       { frames: 3, frameRate: 15, repeat: false, hitFrames: [1, 1] },
  heavy_punch:       { frames: 4, frameRate: 12, repeat: false, hitFrames: [2, 2] },
  light_kick:        { frames: 3, frameRate: 14, repeat: false, hitFrames: [1, 1] },
  heavy_kick:        { frames: 4, frameRate: 11, repeat: false, hitFrames: [1, 2] },

  crouch_punch:      { frames: 3, frameRate: 14, repeat: false, hitFrames: [1, 1] },
  crouch_kick:       { frames: 3, frameRate: 12, repeat: false, hitFrames: [1, 2] },

  jump_punch:        { frames: 2, frameRate: 10, repeat: false, hitFrames: [1, 1] },
  jump_kick:         { frames: 2, frameRate: 10, repeat: false, hitFrames: [1, 1] },

  throw:             { frames: 3, frameRate: 10, repeat: false },
  // release frames: the projectile spawns when frame 2 starts displaying
  special_hadouken:  { frames: 4, frameRate: 12, repeat: false, prefix: 'hadouken',  hitFrames: [2, 3] },
  // rising frames: the uppercut hitbox is active while the fist travels up
  special_shoryuken: { frames: 4, frameRate: 12, repeat: false, prefix: 'shoryuken', hitFrames: [1, 3] },
  taunt:             { frames: 4, frameRate: 6,  repeat: false },

  hurt_high:         { frames: 2, frameRate: 12, repeat: false },
  hurt_low:          { frames: 2, frameRate: 12, repeat: false },
  block_high:        { frames: 1, frameRate: 10, repeat: false },
  block_low:         { frames: 1, frameRate: 10, repeat: false },

  knockdown:         { frames: 4, frameRate: 8,  repeat: false },
  getup:             { frames: 3, frameRate: 8,  repeat: false },
  victory:           { frames: 4, frameRate: 6,  repeat: true  },
  defeat:            { frames: 1, frameRate: 6,  repeat: true  }
};

/** Duration (ms) of one frame of an animation at the given playback factor. */
export function frameDurationMs(animKey, factor = 1) {
  const anim = ANIMATIONS[animKey];
  return 1000 / anim.frameRate / factor;
}
