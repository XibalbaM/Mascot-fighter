/**
 * Mascot Fighter - 8 Character Roster Configuration
 * 
 * Roster:
 * 1. Phoenix
 * 2. Lion
 * 3. Palm Tree
 * 4. Pig
 * 5. Squid
 * 6. Husky
 * 7. Dragon
 * 8. Hippo
 * 
 * Note: Base stats are provided with distinct playstyle baselines and will be updated
 * with custom stats from the user.
 */

export const CHARACTERS = {
  phoenix: {
    id: 'phoenix',
    name: 'PHÉNIKTARACE',
    title: 'VENERABLE PIAF IMMORTEL',
    archetype: 'Aerial / Flame Striker',
    avatarColor: '#ff4757',
    palette: {
      primary: '#d63031',      // Fiery crimson body/feathers
      secondary: '#ff7675',    // Light flame plumage
      hairOrHead: '#f39c12',   // Golden head crest / flame feathers
      cloth: '#f5cd79',        // Sunburst sash
      belt: '#2c2c54',         // Dark mystic belt
      headband: '#ff4757',     // Flame circlet
      specialColor: '#ffa502', // Radiant golden fire FX
      eye: '#ffeaa7',          // Amber glowing eye
      claw: '#f5cd79'          // Golden talons
    },
    stats: {
      hp: 130,
      defense: 100,
      offense: 100,
      speed: 100,
      attackSpeed: 100
    },
    specials: ['Phoenix Flare (Fireball)', 'Rising Fire Wing (Uppercut)'],
    description: 'A blazing mythical bird with rapid wing-blade strikes, fiery plumage, and swift aerial combustion.'
  },
  
  lion: {
    id: 'lion',
    name: 'DEWAELION',
    title: 'SIMBA',
    archetype: 'Heavy Striker / Pressure',
    avatarColor: '#f39c12',
    palette: {
      primary: '#f39c12',      // Golden tawny coat
      secondary: '#e67e22',    // Warm amber belly
      hairOrHead: '#b33939',   // Dark crimson/mahogany majestic mane
      cloth: '#ffffff',        // Traditional white karate gi
      belt: '#2d3436',         // Black belt
      headband: '#ff4757',     // Red headband
      specialColor: '#f1c40f', // Golden roar aura
      eye: '#2ecc71',          // Emerald feline eye
      claw: '#ecf0f1'          // Sharp ivory claws
    },
    stats: {
      hp: 87,
      defense: 62,
      offense: 87,
      speed: 89,
      attackSpeed: 70
    },
    specials: ['Lion Roar Blast', 'Royal Rising Claw'],
    description: 'A regal and imposing lion martial artist with a ferocious mane, devastating heavy paws, and relentless pressure.'
  },

  palmtree: {
    id: 'palmtree',
    name: 'PALMITO',
    title: 'PROVENANCE : JARDIN DES PLANTES',
    archetype: 'Zoner / Wacky Long-Limb',
    avatarColor: '#2ed573',
    palette: {
      primary: '#795548',      // Sturdy bark trunk
      secondary: '#8d6e63',    // Textured wood tone
      hairOrHead: '#2ecc71',   // Wild fanned palm fronds
      cloth: '#f1c40f',        // Floral island shorts
      belt: '#e67e22',         // Vine rope sash
      headband: '#27ae60',     // Green leafy headband
      specialColor: '#2ed573', // Tropical leaf gale FX
      eye: '#ffffff',          // Expressive eyes
      claw: '#5d4037'          // Woody root knuckles
    },
    stats: {
      hp: 100,
      defense: 72,
      offense: 80,
      speed: 64,
      attackSpeed: 50
    },
    specials: ['Coconut Cannon', 'Tropical Hurricane'],
    description: 'A wildly charismatic palm tree mascot whose fanned leafy fronds, whipping trunk, and coconut artillery dominate spacing.'
  },

  pig: {
    id: 'pig',
    name: 'PIGROS',
    title: 'EN VENTE A LA BOUCHERIE DES ARENES',
    archetype: 'Heavy Brawler / Sumo',
    avatarColor: '#fd79a8',
    palette: {
      primary: '#fd79a8',      // Warm pink pig skin
      secondary: '#fab1a0',    // Peach snout and inner ears
      hairOrHead: '#e84393',   // Darker pink ear tips
      cloth: '#2d3436',        // Dark sumo mawashi / trousers
      belt: '#ff4757',         // Red champion sash
      headband: '#ffffff',     // White hachimaki headband
      specialColor: '#e17055', // Mud & grit burst FX
      eye: '#2d3436',          // Dark determined eyes
      claw: '#ffeaa7'          // Ivory curved tusks
    },
    stats: {
      hp: 115,
      defense: 84,
      offense: 82,
      speed: 58,
      attackSpeed: 64
    },
    specials: ['Mud Boulder Shot', 'Tusk Rising Slam'],
    description: 'A stout, muscular heavyweight pig with curved tusks, an iconic curly tail, and thunderous close-range body checks.'
  },

  squid: {
    id: 'squid',
    name: 'POULPY',
    title: 'CUISINÉ PROFESSIONNEL',
    archetype: 'Trickster / Ninja',
    avatarColor: '#8e44ad',
    palette: {
      primary: '#8e44ad',      // Deep oceanic purple
      secondary: '#9b59b6',    // Magenta sucker pads
      hairOrHead: '#e056fd',   // Pointed mantle fins
      cloth: '#1e1b2e',        // Stealth ninja vest
      belt: '#00d2d3',         // Neon aqua ninja belt
      headband: '#00d2d3',     // Cyan ninja headband
      specialColor: '#00cec9', // Dark ink & bio-luminescence
      eye: '#f1c40f',          // Golden horizontal slit eye
      claw: '#a29bfe'          // Barbed tentacle tips
    },
    stats: {
      hp: 92,
      defense: 62,
      offense: 85,
      speed: 88,
      attackSpeed: 94
    },
    specials: ['Ink Jet Cannon', 'Tentacle Cyclone'],
    description: 'A stealthy deep-sea squid ninja who whips out long-range tentacle strikes, blinding ink blasts, and deceptive evasions.'
  },

  husky: {
    id: 'husky',
    name: 'ISO',
    title: 'FIGURANT',
    archetype: 'Agile Rushdown / Frost',
    avatarColor: '#0984e3',
    palette: {
      primary: '#636e72',      // Grey wolf coat
      secondary: '#dfe6e9',    // Snow white muzzle, chest & paws
      hairOrHead: '#2d3436',   // Pointed black-tipped ears & mask
      cloth: '#0984e3',        // Electric blue winter jacket
      belt: '#74b9ff',         // Sky blue belt
      headband: '#0984e3',     // Blue runner headband
      specialColor: '#74b9ff', // Crystalline frost & snow FX
      eye: '#00cec9',          // Icy arctic blue eyes
      claw: '#ffffff'          // Snowy padded paws & claws
    },
    stats: {
      hp: 98,
      defense: 68,
      offense: 82,
      speed: 96,
      attackSpeed: 88
    },
    specials: ['Frost Gale (Ice Orb)', 'Blizzard Uppercut'],
    description: 'An enthusiastic and relentless arctic husky with a bushy curled tail, sharp snow claws, and unmatched running footsies.'
  },

  dragon: {
    id: 'dragon',
    name: '???',
    title: 'TEXT OVERFLOW',
    archetype: 'Balanced All-Rounder',
    avatarColor: '#10ac84',
    palette: {
      primary: '#10ac84',      // Emerald scales
      secondary: '#1dd1a1',    // Jade plated belly
      hairOrHead: '#ee5253',   // Crimson horns and dorsal spikes
      cloth: '#222f3e',        // Dark martial trousers
      belt: '#ff9f43',         // Amber dragon sash
      headband: '#ff6b6b',     // Crimson warrior headband
      specialColor: '#ff9f43', // Fiery breath & magma FX
      eye: '#feca57',          // Slit golden dragon eye
      claw: '#c8d6e5'          // Razor dragon claws
    },
    stats: {
      hp: 108,
      defense: 80,
      offense: 88,
      speed: 72,
      attackSpeed: 76
    },
    specials: ['Dragon Breath Fireball', 'Rising Dragon Uppercut'],
    description: 'A legendary dragon martial artist sporting sweeping horns, armored jade scales, wing blades, and searing flame breath.'
  },

  hippo: {
    id: 'hippo',
    name: 'HYPOLITE',
    title: 'NOT ENOUGH MARTYRED YET',
    archetype: 'Colossus / Grappler',
    avatarColor: '#57606f',
    palette: {
      primary: '#57606f',      // Slate blue-grey thick hide
      secondary: '#747d8c',    // Lighter belly and muzzle
      hairOrHead: '#2f3542',   // Tiny twitchy ears
      cloth: '#c0392b',        // Heavyweight crimson boxer wraps
      belt: '#f1c40f',         // Heavy gold championship belt
      headband: '#f1c40f',     // Golden championship headband
      specialColor: '#3498db', // Massive water wave / splash FX
      eye: '#f5f6fa',          // Piercing heavyweight eyes
      claw: '#ced6e0'          // Blunt crushing knuckles
    },
    stats: {
      hp: 125,
      defense: 90,
      offense: 86,
      speed: 52,
      attackSpeed: 58
    },
    specials: ['Hydro Torrent Ball', 'Colossus Rising Slam'],
    description: 'A colossal river titan with an enormous crushing jaw, thick impervious hide, and unstoppable charging weight.'
  }
};

export const CHARACTER_LIST = Object.values(CHARACTERS);

export function getCharacter(id) {
  return CHARACTERS[id] || CHARACTERS.dragon;
}
