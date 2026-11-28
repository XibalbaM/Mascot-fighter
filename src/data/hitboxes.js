/**
 * Per-character collision boxes, tailored to each mascot's model.
 *
 * Coordinate convention (same as Fighter.getActiveHitbox):
 *   world units, relative to the fighter origin (x, y) = feet center, which is
 *   sprite frame (120, 160) drawn at FIGHTER.SCALE. So a box is simply the
 *   model's rect in the 240x160 sprite frame multiplied by FIGHTER.SCALE
 *   (2.2):  x = (fx - 120) * 2.2 ,  y = (fy - 160) * 2.2 ,  w/h = frame px * 2.2.
 *   +x = forward (model faces right), -y = up. Boxes are mirrored for facing -1.
 *
 * Every value below was derived from the actual limb positions drawn by
 * SpriteGenerator on the attack's active frame(s) (see ANIMATIONS.hitFrames),
 * so a hitbox covers exactly what the animation shows extended.
 *
 * `default` holds the standard humanoid rig (bx=116, by=114) shared by
 * phoenix/lion/pig/husky/dragon/hippo unless overridden per character.
 */

// ---------------------------------------------------------------- attacks --
// stance -> attack key -> hitbox { x, y, w, h }
const DEFAULT_ATTACK_HITBOXES = {
  standing: {
    lightPunch: { x: 4,  y: -86, w: 77,  h: 20 },
    heavyPunch: { x: 4,  y: -88, w: 101, h: 29 },
    lightKick:  { x: 4,  y: -51, w: 57,  h: 20 },
    heavyKick:  { x: 9,  y: -59, w: 79,  h: 22 }
  },
  crouching: {
    lightPunch: { x: 4,  y: -35, w: 73,  h: 17 },
    heavyPunch: { x: 4,  y: -35, w: 77,  h: 21 },
    lightKick:  { x: 9,  y: -14, w: 79,  h: 14 }, // low sweep at the feet
    heavyKick:  { x: 9,  y: -14, w: 79,  h: 14 }
  },
  air: {
    lightPunch: { x: 9,  y: -123, w: 48, h: 29 }, // fist at head height of the airborne model
    heavyPunch: { x: 9,  y: -123, w: 48, h: 29 },
    lightKick:  { x: 13, y: -90,  w: 75, h: 24 }, // extended leg
    heavyKick:  { x: 13, y: -90,  w: 75, h: 24 }
  },
  special: {
    shoryuken: { x: 24, y: -172, w: 42, h: 97 },  // vertical rise column of the fist
    super:     { x: 20, y: -172, w: 51, h: 97 }
  }
};

const CHARACTER_ATTACK_HITBOXES = {
  phoenix: {
    standing: {
      lightPunch: { x: 4, y: -90, w: 79, h: 26 } // wing-blade slash reaches further
    }
  },
  lion: {
    standing: {
      heavyPunch: { x: 4, y: -92, w: 110, h: 35 } // massive claw swipe
    }
  },
  pig: {
    standing: {
      heavyPunch: { x: 4, y: -90, w: 97, h: 31 }, // tusk ram / headbutt
      lightKick:  { x: 4, y: -51, w: 66, h: 20 }  // wider feet
    }
  },
  hippo: {
    standing: {
      heavyPunch: { x: 0, y: -92, w: 79, h: 57 }, // hammer fist slams downward
      lightKick:  { x: 4, y: -51, w: 66, h: 20 }
    }
  },
  dragon: {
    standing: {
      heavyPunch: { x: 4, y: -88, w: 101, h: 29 } // claw + fire trail
    }
  },
  husky: {
    standing: {
      heavyPunch: { x: 4, y: -92, w: 92, h: 35 } // frost paw swipe
    }
  },
  palmtree: {
    // vine arms attached at trunk mid (armX=114, armY=109); long reach
    standing: {
      lightPunch: { x: 86, y: -132, w: 31, h: 26 }, // whip fist
      heavyPunch: { x: 95, y: -145, w: 40, h: 35 }, // heavy whip fist
      lightKick:  { x: 64, y: -29,  w: 35, h: 13 }, // root-foot pad (low)
      heavyKick:  { x: 90, y: -55,  w: 35, h: 13 }  // root-foot pad (mid, off the ground)
    },
    crouching: {
      lightPunch: { x: 66, y: -58, w: 26, h: 18 },
      heavyPunch: { x: 66, y: -58, w: 26, h: 18 },
      lightKick:  { x: 55, y: -22, w: 35, h: 14 },
      heavyKick:  { x: 55, y: -22, w: 35, h: 14 }
    },
    air: {
      lightPunch: { x: 77, y: -194, w: 31, h: 29 }, // fist + jump lift
      heavyPunch: { x: 77, y: -194, w: 31, h: 29 },
      lightKick:  { x: 81, y: -114, w: 24, h: 18 }, // kicking root + lift/lean
      heavyKick:  { x: 81, y: -114, w: 24, h: 18 }
    },
    special: {
      shoryuken: { x: -18, y: -227, w: 44, h: 114 }, // vine uppercut column
      super:     { x: -22, y: -227, w: 53, h: 114 }
    }
  },
  squid: {
    // tentacle arms attached at mantle base (botY=116); very long reach
    standing: {
      lightPunch: { x: 106, y: -141, w: 20, h: 20 }, // whip strike sucker
      heavyPunch: { x: 92,  y: -158, w: 29, h: 55 }, // double strike + ink splash
      lightKick:  { x: 79,  y: -22,  w: 20, h: 18 }, // low sweep sucker
      heavyKick:  { x: 97,  y: -62,  w: 20, h: 18 }  // high sweep sucker
    },
    crouching: {
      lightPunch: { x: 79, y: -68, w: 20, h: 14 },
      heavyPunch: { x: 79, y: -68, w: 20, h: 14 },
      lightKick:  { x: 79, y: -14, w: 20, h: 14 },
      heavyKick:  { x: 79, y: -14, w: 20, h: 14 }
    },
    air: {
      lightPunch: { x: 88, y: -189, w: 20, h: 20 }, // air whip + lift
      heavyPunch: { x: 88, y: -189, w: 20, h: 20 },
      lightKick:  { x: 97, y: -128, w: 18, h: 20 }, // air kick + lift/lean
      heavyKick:  { x: 97, y: -128, w: 18, h: 20 }
    },
    special: {
      shoryuken: { x: -13, y: -224, w: 31, h: 128 }, // tentacle uppercut column
      super:     { x: -18, y: -224, w: 40, h: 128 }
    }
  }
};

// ---------------------------------------------------------------- hurtboxes --
// standing/crouch -> list of named boxes covering the model's silhouette
const DEFAULT_HURTBOXES = {
  standing: [
    { name: 'head', x: -26, y: -145, w: 66, h: 62 },
    { name: 'body', x: -26, y: -92,  w: 79, h: 84 }
  ],
  crouch: [
    { name: 'crouch_body', x: -26, y: -127, w: 79, h: 114 }
  ]
};

const CHARACTER_HURTBOXES = {
  phoenix: {
    standing: [
      { name: 'head', x: -40, y: -167, w: 75, h: 79 }, // head + flame crest + beak
      { name: 'body', x: -26, y: -92,  w: 79, h: 84 }
    ],
    crouch: [{ name: 'crouch_body', x: -26, y: -127, w: 79, h: 114 }]
  },
  lion: {
    standing: [
      { name: 'head', x: -44, y: -154, w: 84, h: 79 }, // full mane
      { name: 'body', x: -26, y: -92,  w: 79, h: 84 }
    ],
    crouch: [{ name: 'crouch_body', x: -26, y: -127, w: 79, h: 114 }]
  },
  pig: {
    standing: [
      { name: 'head', x: -26, y: -145, w: 62, h: 62 }, // head + floppy ears
      { name: 'body', x: -26, y: -92,  w: 70, h: 88 }  // wide heavyweight trunk
    ],
    crouch: [{ name: 'crouch_body', x: -26, y: -112, w: 75, h: 103 }]
  },
  husky: {
    standing: [
      { name: 'head', x: -22, y: -163, w: 62, h: 79 }, // head + tall ears
      { name: 'body', x: -26, y: -92,  w: 79, h: 84 }
    ],
    crouch: [{ name: 'crouch_body', x: -26, y: -127, w: 79, h: 114 }]
  },
  dragon: {
    standing: [
      { name: 'head', x: -31, y: -167, w: 66, h: 84 }, // snout + swept horns
      { name: 'body', x: -26, y: -92,  w: 79, h: 84 }
    ],
    crouch: [{ name: 'crouch_body', x: -26, y: -127, w: 79, h: 114 }]
  },
  hippo: {
    standing: [
      { name: 'head', x: -35, y: -147, w: 75, h: 64 }, // massive muzzle
      { name: 'body', x: -26, y: -92,  w: 70, h: 88 }
    ],
    crouch: [{ name: 'crouch_body', x: -26, y: -112, w: 75, h: 103 }]
  },
  palmtree: {
    standing: [
      { name: 'crown', x: -119, y: -277, w: 211, h: 132 }, // fanned fronds
      { name: 'trunk', x: -35,  y: -167, w: 48,  h: 154 }  // segmented trunk + roots
    ],
    crouch: [
      { name: 'crown', x: -119, y: -193, w: 211, h: 90 },
      { name: 'trunk', x: -35,  y: -118, w: 48,  h: 105 }
    ]
  },
  squid: {
    standing: [
      { name: 'mantle', x: -73, y: -224, w: 119, h: 132 }, // teardrop mantle + fins
      { name: 'legs',   x: -48, y: -97,  w: 70,  h: 84 }   // tentacle legs
    ],
    crouch: [
      { name: 'mantle', x: -73, y: -153, w: 119, h: 87 },
      { name: 'legs',   x: -48, y: -68,  w: 70,  h: 55 }
    ]
  }
};

// ---------------------------------------------------------------- pushboxes --
const DEFAULT_PUSHBOX = { w: 73, h: 141, crouchH: 88 };
const CHARACTER_PUSHBOXES = {
  pig:      { w: 80, h: 141, crouchH: 88 },
  hippo:    { w: 80, h: 141, crouchH: 88 },
  palmtree: { w: 48, h: 150, crouchH: 100 }, // narrow trunk
  squid:    { w: 64, h: 190, crouchH: 90 }
};

// ------------------------------------------------------- projectile spawn --
// where the hadouken orb appears in the model's hands on the release frame
const DEFAULT_PROJECTILE_SPAWN = { x: 92, y: -64 };
const CHARACTER_PROJECTILE_SPAWNS = {
  palmtree: { x: 97, y: -119 }, // coconut at the trunk crown side
  squid:    { x: 97, y: -123 }  // ink orb at the mantle tip side
};

// ------------------------------------------------------------------ getters --

export function getAttackHitbox(charId, stance, key) {
  return CHARACTER_ATTACK_HITBOXES[charId]?.[stance]?.[key]
      || DEFAULT_ATTACK_HITBOXES[stance][key];
}

export function getHurtboxSpec(charId) {
  return CHARACTER_HURTBOXES[charId] || DEFAULT_HURTBOXES;
}

export function getPushboxSpec(charId) {
  return CHARACTER_PUSHBOXES[charId] || DEFAULT_PUSHBOX;
}

export function getProjectileSpawn(charId) {
  return CHARACTER_PROJECTILE_SPAWNS[charId] || DEFAULT_PROJECTILE_SPAWN;
}
