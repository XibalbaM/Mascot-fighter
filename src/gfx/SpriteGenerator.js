import { CHARACTERS } from '../data/characters.js';

export class SpriteGenerator {
  constructor(scene) {
    this.scene = scene;
    this.frameWidth = 240;
    this.frameHeight = 160;
  }

  generateAll() {
    Object.values(CHARACTERS).forEach(char => {
      this.generateFighterSprites(char.id, char.palette);
      this.generatePortrait(char);
    });

    this.generateLockedPortrait();
    this.generateProjectiles();
    this.generateFX();
    this.generateStage();
  }

  p(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  }

  generatePortrait(char) {
    const canvas = document.createElement('canvas');
    canvas.width = 72;
    canvas.height = 72;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Background gradient using character's primary color
    const grad = ctx.createLinearGradient(0, 0, 72, 72);
    grad.addColorStop(0, char.avatarColor || char.palette.primary);
    grad.addColorStop(0.6, '#181226');
    grad.addColorStop(1, '#0c0b1e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 72, 72);

    // Subtle corner grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(6, 6, 60, 60);

    // Draw stylized head close-up
    ctx.save();
    ctx.translate(18, 25);
    this.drawFighterHead(ctx, char.id, char.palette, 0, 0, 0);
    ctx.restore();

    // Frame border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(1.5, 1.5, 69, 69);

    // Bottom name bar
    ctx.fillStyle = 'rgba(10, 8, 20, 0.9)';
    ctx.fillRect(0, 52, 72, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8.5px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(char.name, 36, 65);

    const key = `portrait_${char.id}`;
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    this.scene.textures.addCanvas(key, canvas);
  }

  generateLockedPortrait() {
    const canvas = document.createElement('canvas');
    canvas.width = 72;
    canvas.height = 72;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = '#110f19';
    ctx.fillRect(0, 0, 72, 72);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 70, 70);

    ctx.font = 'bold 26px "Teko", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.textAlign = 'center';
    ctx.fillText('?', 36, 40);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 52, 72, 20);
    ctx.fillStyle = '#747d8c';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('LOCKED', 36, 65);

    const key = 'portrait_locked';
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    this.scene.textures.addCanvas(key, canvas);
  }

  generateFighterSprites(id, palette) {
    const actions = [
      'idle_0', 'idle_1', 'idle_2', 'idle_3',
      'walk_0', 'walk_1', 'walk_2', 'walk_3',
      'crouch_0', 'crouch_1',
      'jump_0', 'jump_1', 'jump_2',
      'light_punch_0', 'light_punch_1', 'light_punch_2',
      'heavy_punch_0', 'heavy_punch_1', 'heavy_punch_2', 'heavy_punch_3',
      'light_kick_0', 'light_kick_1', 'light_kick_2',
      'heavy_kick_0', 'heavy_kick_1', 'heavy_kick_2', 'heavy_kick_3',
      'crouch_punch_0', 'crouch_punch_1', 'crouch_punch_2',
      'crouch_kick_0', 'crouch_kick_1', 'crouch_kick_2',
      'jump_punch_0', 'jump_punch_1',
      'jump_kick_0', 'jump_kick_1',
      'hadouken_0', 'hadouken_1', 'hadouken_2', 'hadouken_3',
      'shoryuken_0', 'shoryuken_1', 'shoryuken_2', 'shoryuken_3',
      'hurt_high_0', 'hurt_high_1',
      'hurt_low_0', 'hurt_low_1',
      'block_high_0',
      'block_low_0',
      'knockdown_0', 'knockdown_1', 'knockdown_2', 'knockdown_3',
      'getup_0', 'getup_1', 'getup_2',
      'victory_0', 'victory_1', 'victory_2', 'victory_3',
      'defeat_0'
    ];

    actions.forEach(action => {
      const canvas = document.createElement('canvas');
      canvas.width = this.frameWidth;
      canvas.height = this.frameHeight;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      this.drawFighterFrame(ctx, id, palette, action);

      const textureKey = `${id}_${action}`;
      if (this.scene.textures.exists(textureKey)) {
        this.scene.textures.remove(textureKey);
      }
      this.scene.textures.addCanvas(textureKey, canvas);
    });

    this.registerAnimations(id);
  }

  drawFighterFrame(ctx, id, pal, action) {
    const W = this.frameWidth;
    const H = this.frameHeight;
    const cx = W / 2;
    const groundY = H - 6;

    let bx = cx - 4;
    let by = groundY - 40;
    let scaleY = 1.0;
    let angle = 0;

    const parts = action.split('_');
    const frameIndex = parseInt(parts[parts.length - 1], 10);
    const animName = parts.slice(0, parts.length - 1).join('_');

    ctx.save();

    if (animName === 'idle') {
      const bob = Math.sin(frameIndex * Math.PI / 2) * 2;
      by += bob;
    } else if (animName === 'walk') {
      const bounce = Math.abs(Math.sin(frameIndex * Math.PI / 2)) * 3;
      by -= bounce;
      bx += (frameIndex % 2 === 0 ? 1 : -1);
    } else if (animName === 'crouch' || animName === 'block_low') {
      by += 16;
      scaleY = 0.72;
    } else if (animName === 'jump') {
      // already handled by physic, bug patched
    } else if (animName === 'jump_punch' || animName === 'jump_kick') {
      // same bug patched
    } else if (animName === 'crouch_punch' || animName === 'crouch_kick') {
      by += 16;
      scaleY = 0.72;
    } else if (animName === 'shoryuken') {
      // same bug as the jump
    } else if (animName === 'hurt_high') {
      bx -= (frameIndex + 1) * 3;
      by += 2;
      angle = -0.15;
    } else if (animName === 'hurt_low') {
      bx -= (frameIndex + 1) * 3;
      by += 6;
      scaleY = 0.85;
      angle = 0.2;
    } else if (animName === 'knockdown') {
      if (frameIndex === 0) {
        bx -= 10; by -= 15; angle = -0.6;
      } else if (frameIndex === 1) {
        bx -= 18; by -= 6; angle = -1.2;
      } else {
        bx -= 24; by += 24; angle = -1.57; scaleY = 0.8;
      }
    } else if (animName === 'defeat') {
      bx -= 24; by += 24; angle = -1.57; scaleY = 0.8;
    } else if (animName === 'getup') {
      if (frameIndex === 0) { bx -= 18; by += 16; angle = -0.8; scaleY = 0.85; }
      else if (frameIndex === 1) { bx -= 8; by += 6; angle = -0.3; scaleY = 0.9; }
      else { by += 2; }
    } else if (animName === 'victory') {
      const pump = Math.sin(frameIndex * Math.PI / 2) * 4;
      by -= pump + 4;
    }

    ctx.translate(bx + 12, by + 20);
    if (angle !== 0) ctx.rotate(angle);
    ctx.scale(1.0, scaleY);
    ctx.translate(-(bx + 12), -(by + 20));

    // 1. CHARACTER SPECIFIC TAIL / WINGS / ACCESSORY
    this.drawFighterTail(ctx, id, pal, bx, by, frameIndex);

    // 2. LEGS / FEET
    this.drawLegs(ctx, bx, by, pal, animName, frameIndex);

    // 3. TORSO & CLOTHING
    this.drawFighterBody(ctx, id, pal, bx, by);

    // 4. HEAD & MASCOT SILHOUETTE
    this.drawFighterHead(ctx, id, pal, bx - 2, by - 16, frameIndex);

    // 5. ARMS & ATTACKS
    this.drawArms(ctx, bx, by, pal, animName, frameIndex, id);

    ctx.restore();
  }

  drawFighterTail(ctx, id, pal, bx, by, frameIndex) {
    const wag = Math.sin((frameIndex || 0) * 1.5) * 4;

    if (id === 'phoenix') {
      // Flowing flame plumage feathers
      ctx.fillStyle = pal.hairOrHead;
      ctx.beginPath();
      ctx.moveTo(bx - 6, by + 16);
      ctx.quadraticCurveTo(bx - 22, by + 10 + wag, bx - 30, by + wag);
      ctx.quadraticCurveTo(bx - 18, by + 20 + wag, bx - 4, by + 24);
      ctx.fill();

      ctx.fillStyle = pal.secondary;
      ctx.beginPath();
      ctx.moveTo(bx - 4, by + 18);
      ctx.quadraticCurveTo(bx - 18, by + 18 + wag, bx - 26, by + 12 + wag);
      ctx.quadraticCurveTo(bx - 14, by + 26 + wag, bx - 2, by + 28);
      ctx.fill();
    } else if (id === 'lion') {
      // Slender feline tail with bushy tuft tip
      ctx.strokeStyle = pal.primary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx - 6, by + 20);
      ctx.quadraticCurveTo(bx - 20, by + 14 + wag, bx - 24, by + 8 + wag);
      ctx.stroke();

      // Bushy tuft
      this.p(ctx, bx - 28, by + 4 + wag, 7, 7, pal.hairOrHead);
    } else if (id === 'palmtree') {
      // Sprouting root / tropical leafy vine
      ctx.fillStyle = pal.hairOrHead;
      this.p(ctx, bx - 14, by + 24 + wag * 0.5, 8, 4, pal.hairOrHead);
      this.p(ctx, bx - 20, by + 22 + wag * 0.5, 7, 5, pal.secondary);
    } else if (id === 'pig') {
      // Cute spiral curly tail @
      ctx.strokeStyle = pal.primary;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(bx - 12, by + 18, 5, 0, Math.PI * 1.6);
      ctx.stroke();
    } else if (id === 'squid') {
      // Undulating tentacle cluster trailing back
      ctx.fillStyle = pal.primary;
      for (let i = 0; i < 3; i++) {
        const offset = i * 4;
        const tw = Math.sin((frameIndex + i) * 1.4) * 3;
        this.p(ctx, bx - 12 - i * 4, by + 16 + offset + tw, 10, 4, pal.primary);
        this.p(ctx, bx - 10 - i * 4, by + 18 + offset + tw, 3, 2, pal.secondary); // sucker
      }
    } else if (id === 'husky') {
      // Magnificent bushy curved snow-dog tail
      ctx.fillStyle = pal.primary;
      ctx.beginPath();
      ctx.moveTo(bx - 6, by + 22);
      ctx.quadraticCurveTo(bx - 20, by + 18, bx - 22, by + 4 + wag);
      ctx.quadraticCurveTo(bx - 14, by - 4 + wag, bx - 8, by + 6);
      ctx.fill();

      // Fluffy white tail tip
      ctx.fillStyle = pal.secondary;
      ctx.beginPath();
      ctx.arc(bx - 16, by + 2 + wag, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'dragon') {
      // Long lizard tail with dorsal spikes + small wing on back
      ctx.fillStyle = pal.primary;
      ctx.beginPath();
      ctx.moveTo(bx - 6, by + 18);
      ctx.quadraticCurveTo(bx - 20, by + 14 + wag, bx - 28, by + 6 + wag);
      ctx.quadraticCurveTo(bx - 16, by + 24 + wag, bx - 2, by + 26);
      ctx.fill();

      // Dragon dorsal spikes
      this.p(ctx, bx - 16, by + 10 + wag, 4, 4, pal.hairOrHead);
      this.p(ctx, bx - 24, by + 4 + wag, 4, 4, pal.hairOrHead);

      // Back dragon wing
      this.p(ctx, bx - 12, by + 4, 10, 8, pal.hairOrHead);
      this.p(ctx, bx - 16, by + 2, 6, 6, pal.secondary);
    } else if (id === 'hippo') {
      // Tiny cute stubby hippo tail
      this.p(ctx, bx - 10, by + 20 + wag * 0.4, 5, 5, pal.hairOrHead);
    }
  }

  drawFighterBody(ctx, id, pal, bx, by) {
    if (id === 'hippo' || id === 'pig') {
      // Heavyweight wide body
      this.p(ctx, bx - 6, by + 4, 24, 24, pal.primary);
      this.p(ctx, bx - 1, by + 6, 16, 20, pal.secondary); // Round belly
      this.p(ctx, bx - 8, by + 20, 28, 7, pal.cloth);      // Heavyweight trunks
      this.p(ctx, bx - 8, by + 18, 28, 4, pal.belt);       // Championship belt
    } else if (id === 'palmtree') {
      // Textured woody trunk with horizontal bark segments
      this.p(ctx, bx - 4, by + 4, 18, 24, pal.primary);
      this.p(ctx, bx - 4, by + 8, 18, 2, pal.secondary);
      this.p(ctx, bx - 4, by + 14, 18, 2, pal.secondary);
      this.p(ctx, bx - 4, by + 20, 18, 2, pal.secondary);
      // Tropical leaf sash
      this.p(ctx, bx - 6, by + 20, 22, 5, pal.cloth);
      this.p(ctx, bx + 2, by + 24, 6, 6, pal.belt);
    } else if (id === 'husky') {
      // Husky athletic torso with white chest fur and blue jacket
      this.p(ctx, bx - 4, by + 6, 20, 22, pal.primary);
      this.p(ctx, bx + 2, by + 8, 12, 16, pal.secondary); // White chest fur
      this.p(ctx, bx - 6, by + 6, 7, 22, pal.cloth);      // Blue jacket left
      this.p(ctx, bx + 11, by + 6, 7, 22, pal.cloth);     // Blue jacket right
      this.p(ctx, bx - 7, by + 20, 26, 5, pal.belt);
    } else if (id === 'squid') {
      // Cephalopod ninja vest with neon trim
      this.p(ctx, bx - 4, by + 6, 20, 22, pal.primary);
      this.p(ctx, bx + 1, by + 8, 12, 16, pal.secondary);
      this.p(ctx, bx - 6, by + 6, 8, 22, pal.cloth);
      this.p(ctx, bx + 10, by + 6, 8, 22, pal.cloth);
      this.p(ctx, bx - 7, by + 20, 26, 5, pal.belt);
      this.p(ctx, bx - 7, by + 22, 26, 2, pal.specialColor); // neon glow line
    } else {
      // Standard martial brawler body (Phoenix, Lion, Dragon)
      this.p(ctx, bx - 4, by + 6, 20, 22, pal.primary);
      this.p(ctx, bx + 2, by + 8, 12, 18, pal.secondary);
      this.p(ctx, bx - 6, by + 6, 8, 22, pal.cloth);
      this.p(ctx, bx + 10, by + 6, 8, 22, pal.cloth);
      this.p(ctx, bx - 7, by + 20, 26, 5, pal.belt);
      this.p(ctx, bx + 2, by + 25, 4, 8, pal.belt);
      this.p(ctx, bx + 7, by + 25, 4, 6, pal.belt);
    }
  }

  drawFighterHead(ctx, id, pal, headX, headY, frameIndex = 0) {
    if (id === 'phoenix') {
      // 1. PHOENIX: Sharp curved beak, flame crest plumage, fiery eye
      this.p(ctx, headX - 4, headY, 20, 20, pal.primary);
      this.p(ctx, headX + 4, headY + 6, 12, 12, pal.secondary);

      // Flame Crest Feathers sweeping back
      this.p(ctx, headX - 10, headY - 8, 8, 10, pal.hairOrHead);
      this.p(ctx, headX - 4, headY - 12, 8, 12, pal.hairOrHead);
      this.p(ctx, headX + 4, headY - 14, 8, 14, pal.hairOrHead);
      this.p(ctx, headX + 10, headY - 10, 6, 10, pal.secondary);

      // Sharp curved golden beak
      ctx.fillStyle = pal.claw;
      ctx.beginPath();
      ctx.moveTo(headX + 12, headY + 8);
      ctx.lineTo(headX + 22, headY + 12);
      ctx.lineTo(headX + 12, headY + 16);
      ctx.fill();
      this.p(ctx, headX + 12, headY + 12, 8, 1, '#2d3436'); // mouth line

      // Glowing flame eye
      this.p(ctx, headX + 6, headY + 5, 5, 4, '#ffffff');
      this.p(ctx, headX + 8, headY + 6, 2, 2, pal.specialColor);

      // Flame Headband
      this.p(ctx, headX - 5, headY + 2, 21, 3, pal.headband);
      const wave = Math.sin((frameIndex || 0) * 1.8) * 3;
      this.p(ctx, headX - 12, headY + 3 + wave, 8, 3, pal.hairOrHead);
    } else if (id === 'lion') {
      // 2. LION: Majestic full mane framing head, lion snout, whiskers, ears
      // Full bushy mane circle behind head
      this.p(ctx, headX - 12, headY - 8, 36, 36, pal.hairOrHead);
      this.p(ctx, headX - 14, headY - 4, 38, 28, pal.hairOrHead);

      // Main head & golden snout
      this.p(ctx, headX - 4, headY + 2, 22, 20, pal.primary);
      this.p(ctx, headX + 4, headY + 8, 16, 14, pal.secondary); // Lion muzzle

      // Rounded Lion Ears
      this.p(ctx, headX - 6, headY - 6, 7, 7, pal.primary);
      this.p(ctx, headX - 4, headY - 4, 4, 4, pal.secondary);
      this.p(ctx, headX + 14, headY - 6, 7, 7, pal.primary);
      this.p(ctx, headX + 15, headY - 4, 4, 4, pal.secondary);

      // Black feline nose & whiskers
      this.p(ctx, headX + 16, headY + 10, 4, 3, '#2d3436');
      this.p(ctx, headX + 14, headY + 15, 2, 2, '#2d3436');
      this.p(ctx, headX + 18, headY + 15, 2, 2, '#2d3436');

      // Emerald feline eyes
      this.p(ctx, headX + 5, headY + 5, 6, 5, '#ffffff');
      this.p(ctx, headX + 8, headY + 6, 3, 3, pal.eye);
      this.p(ctx, headX + 9, headY + 6, 1, 3, '#000000'); // slit pupil

      // Warrior headband
      this.p(ctx, headX - 5, headY + 2, 24, 3, pal.headband);
    } else if (id === 'palmtree') {
      // 3. PALM TREE: Tropical fanned palm fronds canopy, coconuts, trunk face
      // Wood trunk head
      this.p(ctx, headX - 2, headY + 2, 18, 22, pal.primary);
      this.p(ctx, headX - 2, headY + 8, 18, 2, pal.secondary);
      this.p(ctx, headX - 2, headY + 16, 18, 2, pal.secondary);

      // Tropical fanned palm fronds (Arching canopy on top)
      ctx.fillStyle = pal.hairOrHead;
      // Center frond
      ctx.beginPath();
      ctx.moveTo(headX + 6, headY + 2);
      ctx.lineTo(headX + 4, headY - 18);
      ctx.lineTo(headX + 12, headY - 14);
      ctx.fill();
      // Left arching fronds
      ctx.beginPath();
      ctx.moveTo(headX + 2, headY + 2);
      ctx.lineTo(headX - 16, headY - 12);
      ctx.lineTo(headX - 8, headY + 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(headX + 2, headY + 2);
      ctx.lineTo(headX - 22, headY - 2);
      ctx.lineTo(headX - 8, headY + 6);
      ctx.fill();
      // Right arching fronds
      ctx.beginPath();
      ctx.moveTo(headX + 10, headY + 2);
      ctx.lineTo(headX + 26, headY - 10);
      ctx.lineTo(headX + 18, headY + 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(headX + 10, headY + 2);
      ctx.lineTo(headX + 30, headY - 2);
      ctx.lineTo(headX + 18, headY + 6);
      ctx.fill();

      // Coconuts hanging under fronds
      this.p(ctx, headX - 4, headY + 3, 6, 6, '#5d4037');
      this.p(ctx, headX + 14, headY + 3, 6, 6, '#5d4037');

      // Goofy/charismatic eyes & toothy grin
      this.p(ctx, headX + 4, headY + 8, 5, 5, '#ffffff');
      this.p(ctx, headX + 7, headY + 9, 2, 3, '#000000');
      this.p(ctx, headX + 11, headY + 8, 5, 5, '#ffffff');
      this.p(ctx, headX + 13, headY + 9, 2, 3, '#000000');
      // Grinning mouth
      this.p(ctx, headX + 6, headY + 16, 10, 4, '#2d3436');
      this.p(ctx, headX + 8, headY + 16, 3, 2, '#ffffff'); // tooth
    } else if (id === 'pig') {
      // 4. PIG: Round pink head, prominent snout with nostrils, tusks, floppy ears
      this.p(ctx, headX - 4, headY, 22, 22, pal.primary);

      // Floppy triangular pig ears
      this.p(ctx, headX - 8, headY - 4, 7, 7, pal.hairOrHead);
      this.p(ctx, headX - 6, headY - 2, 4, 4, pal.secondary);
      this.p(ctx, headX + 16, headY - 4, 7, 7, pal.hairOrHead);
      this.p(ctx, headX + 17, headY - 2, 4, 4, pal.secondary);

      // Prominent oval snout with 2 dark nostrils
      this.p(ctx, headX + 6, headY + 6, 14, 12, pal.secondary);
      this.p(ctx, headX + 10, headY + 10, 2, 4, '#2d3436'); // left nostril
      this.p(ctx, headX + 15, headY + 10, 2, 4, '#2d3436'); // right nostril

      // Upturned ivory tusks
      this.p(ctx, headX + 4, headY + 14, 3, 5, pal.claw);
      this.p(ctx, headX + 18, headY + 14, 3, 5, pal.claw);

      // Determined piggy eyes
      this.p(ctx, headX + 4, headY + 3, 5, 4, '#ffffff');
      this.p(ctx, headX + 6, headY + 4, 2, 3, '#2d3436');

      // White hachimaki headband
      this.p(ctx, headX - 5, headY + 1, 23, 3, pal.headband);
      const wave = Math.sin((frameIndex || 0) * 1.8) * 3;
      this.p(ctx, headX - 10, headY + 2 + wave, 6, 3, pal.headband);
    } else if (id === 'squid') {
      // 5. SQUID: Pointed mantle, lateral fins, golden horizontal slit eye, tentacles
      // Pointed squid mantle head
      ctx.fillStyle = pal.primary;
      ctx.beginPath();
      ctx.moveTo(headX + 8, headY - 14); // tip of mantle
      ctx.lineTo(headX - 6, headY + 18);
      ctx.lineTo(headX + 22, headY + 18);
      ctx.closePath();
      ctx.fill();

      // Lateral steering fins
      this.p(ctx, headX - 10, headY - 6, 7, 8, pal.hairOrHead);
      this.p(ctx, headX + 18, headY - 6, 7, 8, pal.hairOrHead);

      // Cephalopod golden eyes with horizontal slit pupil
      this.p(ctx, headX + 4, headY + 6, 8, 6, '#ffffff');
      this.p(ctx, headX + 6, headY + 7, 5, 4, pal.eye);
      this.p(ctx, headX + 6, headY + 8, 5, 2, '#000000'); // horizontal slit

      // Cyan ninja visor / headband
      this.p(ctx, headX - 5, headY + 4, 24, 3, pal.headband);

      // Mini cheek tentacles
      this.p(ctx, headX - 2, headY + 18, 3, 6, pal.secondary);
      this.p(ctx, headX + 14, headY + 18, 3, 6, pal.secondary);
    } else if (id === 'husky') {
      // 6. HUSKY: Sled dog mask, tall pointed ears, white muzzle, ice-blue eyes
      // Outer dark grey head
      this.p(ctx, headX - 4, headY, 22, 22, pal.hairOrHead);

      // Tall pointed dog ears with pink inner ear
      this.p(ctx, headX - 4, headY - 12, 7, 12, pal.hairOrHead);
      this.p(ctx, headX - 2, headY - 9, 3, 7, '#fab1a0');
      this.p(ctx, headX + 12, headY - 12, 7, 12, pal.hairOrHead);
      this.p(ctx, headX + 14, headY - 9, 3, 7, '#fab1a0');

      // White facial mask & muzzle
      this.p(ctx, headX + 2, headY + 2, 6, 12, pal.secondary); // forehead blaze
      this.p(ctx, headX + 4, headY + 8, 16, 14, pal.secondary); // white muzzle

      // Black triangular nose & happy smile
      this.p(ctx, headX + 16, headY + 10, 4, 3, '#000000');
      this.p(ctx, headX + 14, headY + 16, 4, 3, '#ff7675'); // tiny tongue!

      // Piercing icy-blue eyes
      this.p(ctx, headX + 4, headY + 5, 6, 5, '#ffffff');
      this.p(ctx, headX + 7, headY + 6, 3, 3, pal.eye);
      this.p(ctx, headX + 8, headY + 6, 1, 3, '#000000');

      // Blue headband
      this.p(ctx, headX - 5, headY + 2, 23, 3, pal.headband);
    } else if (id === 'dragon') {
      // 7. DRAGON: Reptilian jade snout, horns, golden slit eye, fangs
      this.p(ctx, headX - 4, headY, 22, 22, pal.primary);
      this.p(ctx, headX + 4, headY + 6, 16, 14, pal.secondary);

      // Swept back horns & dorsal spikes
      this.p(ctx, headX - 8, headY - 12, 7, 14, pal.hairOrHead);
      this.p(ctx, headX + 4, headY - 14, 7, 16, pal.hairOrHead);
      this.p(ctx, headX + 14, headY - 8, 6, 10, pal.hairOrHead);

      // White fangs
      this.p(ctx, headX + 14, headY + 16, 3, 4, pal.claw);
      this.p(ctx, headX + 18, headY + 16, 3, 3, pal.claw);

      // Golden dragon eye with slit
      this.p(ctx, headX + 6, headY + 4, 6, 5, '#ffffff');
      this.p(ctx, headX + 9, headY + 5, 3, 3, pal.eye);
      this.p(ctx, headX + 10, headY + 5, 1, 3, '#000000');

      // Crimson warrior headband
      this.p(ctx, headX - 5, headY + 1, 23, 4, pal.headband);
    } else if (id === 'hippo') {
      // 8. HIPPO: Massive wide muzzle, round nostrils on top, tiny ears, heavy jaw
      this.p(ctx, headX - 6, headY, 26, 22, pal.primary);

      // Massive wide snout extending forward
      this.p(ctx, headX + 4, headY + 4, 18, 18, pal.secondary);

      // Nostrils right on top of muzzle
      this.p(ctx, headX + 14, headY + 3, 3, 3, '#2d3436');
      this.p(ctx, headX + 19, headY + 3, 3, 3, '#2d3436');

      // Tiny cute rounded hippo ears on top
      this.p(ctx, headX - 4, headY - 5, 5, 5, pal.hairOrHead);
      this.p(ctx, headX + 8, headY - 5, 5, 5, pal.hairOrHead);

      // Hippo tusk nubs on lower jaw
      this.p(ctx, headX + 8, headY + 18, 3, 3, pal.claw);
      this.p(ctx, headX + 16, headY + 18, 3, 3, pal.claw);

      // Deep set eyes
      this.p(ctx, headX + 4, headY + 5, 5, 4, '#ffffff');
      this.p(ctx, headX + 6, headY + 6, 2, 2, '#2d3436');

      // Golden championship headband
      this.p(ctx, headX - 7, headY + 1, 26, 3, pal.headband);
    }
  }

  drawLegs(ctx, bx, by, pal, animName, frameIndex) {
    const legY = by + 26;
    if (animName === 'walk') {
      const step = (frameIndex % 4);
      if (step === 0) {
        this.p(ctx, bx - 6, legY, 8, 16, pal.cloth);
        this.p(ctx, bx - 8, legY + 14, 10, 5, pal.primary);
        this.p(ctx, bx + 10, legY, 8, 14, pal.cloth);
        this.p(ctx, bx + 12, legY + 12, 10, 5, pal.primary);
      } else if (step === 1) {
        this.p(ctx, bx - 2, legY, 8, 15, pal.cloth);
        this.p(ctx, bx - 4, legY + 13, 10, 5, pal.primary);
        this.p(ctx, bx + 6, legY, 8, 15, pal.cloth);
        this.p(ctx, bx + 6, legY + 13, 10, 5, pal.primary);
      } else if (step === 2) {
        this.p(ctx, bx + 6, legY, 8, 16, pal.cloth);
        this.p(ctx, bx + 8, legY + 14, 10, 5, pal.primary);
        this.p(ctx, bx - 4, legY, 8, 14, pal.cloth);
        this.p(ctx, bx - 6, legY + 12, 10, 5, pal.primary);
      } else {
        this.p(ctx, bx - 3, legY, 8, 15, pal.cloth);
        this.p(ctx, bx - 5, legY + 13, 10, 5, pal.primary);
        this.p(ctx, bx + 5, legY, 8, 15, pal.cloth);
        this.p(ctx, bx + 5, legY + 13, 10, 5, pal.primary);
      }
    } else if (animName === 'heavy_kick' || animName === 'crouch_kick') {
      if (frameIndex >= 1 && frameIndex <= 2) {
        this.p(ctx, bx - 5, legY, 8, 16, pal.cloth);
        this.p(ctx, bx - 7, legY + 14, 10, 5, pal.primary);
        const kickY = animName === 'crouch_kick' ? legY + 8 : legY - 6;
        this.p(ctx, bx + 8, kickY, 26, 8, pal.cloth);
        this.p(ctx, bx + 30, kickY - 1, 12, 10, pal.primary);
        this.p(ctx, bx + 40, kickY + 1, 4, 6, pal.claw);
      } else {
        this.p(ctx, bx - 5, legY, 8, 16, pal.cloth);
        this.p(ctx, bx + 8, legY, 8, 16, pal.cloth);
      }
    } else if (animName === 'light_kick') {
      if (frameIndex === 1) {
        this.p(ctx, bx - 5, legY, 8, 16, pal.cloth);
        this.p(ctx, bx + 6, legY - 2, 20, 7, pal.cloth);
        this.p(ctx, bx + 22, legY - 3, 10, 9, pal.primary);
      } else {
        this.p(ctx, bx - 5, legY, 8, 16, pal.cloth);
        this.p(ctx, bx + 8, legY, 8, 16, pal.cloth);
      }
    } else {
      this.p(ctx, bx - 6, legY, 9, 16, pal.cloth);
      this.p(ctx, bx - 8, legY + 14, 12, 5, pal.primary);
      this.p(ctx, bx + 9, legY, 9, 16, pal.cloth);
      this.p(ctx, bx + 9, legY + 14, 12, 5, pal.primary);
    }
  }

  drawArms(ctx, bx, by, pal, animName, frameIndex, id) {
    const armY = by + 8;

    if (animName === 'light_punch') {
      if (frameIndex === 1) {
        this.p(ctx, bx + 6, armY, 26, 7, pal.cloth);
        this.p(ctx, bx + 28, armY - 1, 11, 9, pal.primary);
        this.p(ctx, bx + 37, armY + 1, 4, 5, pal.claw);
        this.p(ctx, bx - 6, armY + 2, 8, 12, pal.cloth);
      } else {
        this.drawNormalGuard(ctx, bx, armY, pal);
      }
    } else if (animName === 'heavy_punch') {
      if (frameIndex === 1) {
        this.p(ctx, bx - 14, armY + 2, 14, 10, pal.cloth);
        this.p(ctx, bx - 18, armY + 2, 9, 9, pal.primary);
      } else if (frameIndex === 2) {
        this.p(ctx, bx + 6, armY, 34, 10, pal.cloth);
        this.p(ctx, bx + 36, armY - 2, 14, 13, pal.primary);
        this.p(ctx, bx + 47, armY, 5, 8, pal.claw);
        this.p(ctx, bx + 18, armY - 3, 20, 2, '#ffffff');
      } else {
        this.drawNormalGuard(ctx, bx, armY, pal);
      }
    } else if (animName === 'hadouken') {
      if (frameIndex === 0 || frameIndex === 1) {
        this.p(ctx, bx - 12, armY + 8, 14, 10, pal.cloth);
        this.p(ctx, bx - 14, armY + 6, 12, 12, pal.primary);
        this.p(ctx, bx - 16, armY + 4, 6, 6, pal.specialColor);
        this.p(ctx, bx - 12, armY + 14, 5, 5, '#ffffff');
      } else {
        this.p(ctx, bx + 6, armY + 4, 28, 12, pal.cloth);
        this.p(ctx, bx + 30, armY + 2, 14, 16, pal.primary);
        this.p(ctx, bx + 42, armY + 4, 6, 12, pal.specialColor);
      }
    } else if (animName === 'shoryuken') {
      if (frameIndex === 1 || frameIndex === 2) {
        this.p(ctx, bx + 12, armY + 2, 8, 8, pal.cloth);
        this.p(ctx, bx + 18, armY - 24, 10, 32, pal.cloth);
        this.p(ctx, bx + 17, armY - 36, 13, 14, pal.primary);
        this.p(ctx, bx + 20, armY - 40, 7, 6, pal.claw);
        this.p(ctx, bx + 15, armY - 38, 17, 4, pal.specialColor);
        this.p(ctx, bx + 16, armY - 26, 4, 18, pal.specialColor);
        this.p(ctx, bx + 27, armY - 18, 4, 16, pal.specialColor);
      } else {
        this.drawNormalGuard(ctx, bx, armY, pal);
      }
    } else if (animName === 'block_high') {
      this.p(ctx, bx + 4, armY - 6, 10, 20, pal.cloth);
      this.p(ctx, bx + 10, armY - 4, 8, 18, pal.primary);
      this.p(ctx, bx + 12, armY - 8, 6, 12, pal.secondary);
    } else if (animName === 'block_low') {
      this.p(ctx, bx + 6, armY + 2, 12, 16, pal.cloth);
      this.p(ctx, bx + 12, armY + 4, 8, 14, pal.primary);
    } else {
      this.drawNormalGuard(ctx, bx, armY, pal);
    }
  }

  drawNormalGuard(ctx, bx, armY, pal) {
    this.p(ctx, bx + 4, armY, 14, 9, pal.cloth);
    this.p(ctx, bx + 15, armY - 4, 9, 10, pal.primary);
    this.p(ctx, bx + 22, armY - 2, 4, 6, pal.claw);
    this.p(ctx, bx - 8, armY + 2, 10, 8, pal.cloth);
    this.p(ctx, bx - 12, armY - 2, 8, 9, pal.secondary);
  }

  registerAnimations(id) {
    const anims = this.scene.anims;
    const addAnim = (key, prefix, count, frameRate = 10, repeat = 0) => {
      const fullKey = `${id}_${key}`;
      if (anims.exists(fullKey)) anims.remove(fullKey);

      const frames = [];
      for (let i = 0; i < count; i++) {
        frames.push({ key: `${id}_${prefix}_${i}` });
      }
      anims.create({
        key: fullKey,
        frames: frames,
        frameRate: frameRate,
        repeat: repeat
      });
    };

    addAnim('idle', 'idle', 4, 8, -1);
    addAnim('walk_fwd', 'walk', 4, 10, -1);
    addAnim('walk_back', 'walk', 4, 8, -1);
    addAnim('crouch', 'crouch', 2, 8, -1);
    addAnim('jump_up', 'jump', 3, 6, 0);

    addAnim('light_punch', 'light_punch', 3, 15, 0);
    addAnim('heavy_punch', 'heavy_punch', 4, 12, 0);
    addAnim('light_kick', 'light_kick', 3, 14, 0);
    addAnim('heavy_kick', 'heavy_kick', 4, 11, 0);

    addAnim('crouch_punch', 'crouch_punch', 3, 14, 0);
    addAnim('crouch_kick', 'crouch_kick', 3, 12, 0);

    addAnim('jump_punch', 'jump_punch', 2, 10, 0);
    addAnim('jump_kick', 'jump_kick', 2, 10, 0);

    addAnim('special_hadouken', 'hadouken', 4, 12, 0);
    addAnim('special_shoryuken', 'shoryuken', 4, 12, 0);

    addAnim('hurt_high', 'hurt_high', 2, 12, 0);
    addAnim('hurt_low', 'hurt_low', 2, 12, 0);
    addAnim('block_high', 'block_high', 1, 10, 0);
    addAnim('block_low', 'block_low', 1, 10, 0);

    addAnim('knockdown', 'knockdown', 4, 8, 0);
    addAnim('getup', 'getup', 3, 8, 0);
    addAnim('victory', 'victory', 4, 6, -1);
    addAnim('defeat', 'defeat', 1, 6, -1);
  }

  generateProjectiles() {
    Object.values(CHARACTERS).forEach(char => {
      const id = char.id;
      const colorA = char.palette.specialColor;
      const colorB = char.palette.primary;

      for (let f = 0; f < 4; f++) {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 36;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const cx = 26;
        const cy = 18;
        const wobble = Math.sin(f * Math.PI / 2) * 3;

        if (id === 'palmtree') {
          // Spinning Coconut projectile
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(f * (Math.PI / 2));
          // Brown coconut shell
          ctx.fillStyle = '#5d4037';
          ctx.beginPath();
          ctx.arc(0, 0, 11, 0, Math.PI * 2);
          ctx.fill();
          // Coconut 3 face dots
          ctx.fillStyle = '#3e2723';
          ctx.fillRect(-3, -4, 2, 2);
          ctx.fillRect(2, -4, 2, 2);
          ctx.fillRect(0, 2, 2, 2);
          // Green flying leaf trails
          ctx.fillStyle = '#2ecc71';
          ctx.fillRect(-18, -2, 8, 4);
          ctx.restore();
        } else if (id === 'squid') {
          // Jet Black Ink Ball with cyan bio-bubbles
          ctx.fillStyle = '#1e1838';
          ctx.beginPath();
          ctx.arc(cx, cy, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = colorA;
          ctx.beginPath();
          ctx.arc(cx + 2, cy - 2, 4, 0, Math.PI * 2);
          ctx.arc(cx - 10, cy + wobble, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (id === 'husky') {
          // Spinning Frost / Crystalline Snowflake
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(f * 0.4);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          for (let a = 0; a < 6; a++) {
            const ang = (a * Math.PI) / 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(ang) * 12, Math.sin(ang) * 12);
            ctx.stroke();
          }
          ctx.fillStyle = colorA;
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (id === 'phoenix') {
          // Blazing fiery comet with trailing flame wisps
          const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 14);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, '#ffeaa7');
          grad.addColorStop(0.6, '#ff4757');
          grad.addColorStop(1, 'rgba(211, 48, 49, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, 14, 0, Math.PI * 2);
          ctx.fill();

          // Flame wing wisps trailing left
          ctx.fillStyle = '#ff7675';
          ctx.beginPath();
          ctx.moveTo(cx - 6, cy - 5);
          ctx.quadraticCurveTo(cx - 20, cy - 8 + wobble, cx - 24, cy - 4 + wobble);
          ctx.quadraticCurveTo(cx - 16, cy, cx - 6, cy);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(cx - 6, cy + 5);
          ctx.quadraticCurveTo(cx - 20, cy + 8 - wobble, cx - 24, cy + 4 - wobble);
          ctx.quadraticCurveTo(cx - 16, cy, cx - 6, cy);
          ctx.fill();

          // Inner white-hot core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx + 2, cy, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (id === 'lion') {
          // Sonic roar blast ring — golden shockwave
          ctx.strokeStyle = '#f1c40f';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx, cy, 10 + f * 1.5, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#ff4757';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.stroke();

          // Golden sparks
          ctx.fillStyle = '#f39c12';
          for (let s = 0; s < 6; s++) {
            const ang = (s * Math.PI / 3) + f * 0.5;
            const sr = 12 + wobble;
            ctx.fillRect(cx + Math.cos(ang) * sr - 1, cy + Math.sin(ang) * sr - 1, 3, 3);
          }

          // Center roar symbol
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (id === 'pig') {
          // Rolling mud boulder with debris
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(f * (Math.PI / 2));

          // Main brown/earth ball
          ctx.fillStyle = '#795548';
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();

          // Mud texture patches
          ctx.fillStyle = '#5d4037';
          ctx.fillRect(-6, -4, 5, 4);
          ctx.fillRect(2, 3, 4, 4);
          ctx.fillStyle = '#8d6e63';
          ctx.fillRect(-3, -8, 4, 3);
          ctx.fillRect(4, -2, 3, 3);

          // Debris chunks flying off
          ctx.fillStyle = '#e17055';
          ctx.fillRect(-16, -3 + wobble, 4, 4);
          ctx.fillRect(-14, 4 - wobble, 3, 3);
          ctx.restore();
        } else if (id === 'dragon') {
          // Dragon fire breath — swirling fireball with ember sparks
          const grad = ctx.createRadialGradient(cx, cy, 3, cx, cy, 15);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.25, '#feca57');
          grad.addColorStop(0.5, '#ff9f43');
          grad.addColorStop(0.8, '#ee5253');
          grad.addColorStop(1, 'rgba(238, 82, 83, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, 15, 0, Math.PI * 2);
          ctx.fill();

          // Ember sparks in orbit
          ctx.fillStyle = '#feca57';
          for (let s = 0; s < 4; s++) {
            const ang = (s * Math.PI / 2) + f * 0.8;
            const er = 10 + wobble;
            ctx.fillRect(cx + Math.cos(ang) * er - 1, cy + Math.sin(ang) * er - 1, 3, 3);
          }

          // Flame trail
          ctx.fillStyle = '#ff9f43';
          ctx.beginPath();
          ctx.moveTo(cx - 8, cy - 4);
          ctx.lineTo(cx - 22, cy + wobble);
          ctx.lineTo(cx - 8, cy + 4);
          ctx.fill();
          ctx.fillStyle = '#ee5253';
          ctx.beginPath();
          ctx.moveTo(cx - 14, cy - 2);
          ctx.lineTo(cx - 26, cy + wobble * 0.6);
          ctx.lineTo(cx - 14, cy + 2);
          ctx.fill();
        } else if (id === 'hippo') {
          // Massive water splash ball — blue/teal orb with droplet splashes
          const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 14);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, '#74b9ff');
          grad.addColorStop(0.6, '#3498db');
          grad.addColorStop(1, 'rgba(52, 152, 219, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, 14, 0, Math.PI * 2);
          ctx.fill();

          // Water droplet splashes
          ctx.fillStyle = '#74b9ff';
          ctx.beginPath();
          ctx.arc(cx - 10, cy - 6 + wobble, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx + 8, cy + 7 - wobble, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx - 14, cy + 2, 2, 0, Math.PI * 2);
          ctx.fill();

          // Inner white shimmer
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.arc(cx + 3, cy - 3, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        const key = `${id}_projectile_${f}`;
        if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
        this.scene.textures.addCanvas(key, canvas);
      }

      const frames = [0, 1, 2, 3].map(i => ({ key: `${id}_projectile_${i}` }));
      const animKey = `${id}_projectile_fly`;
      if (this.scene.anims.exists(animKey)) this.scene.anims.remove(animKey);
      this.scene.anims.create({ key: animKey, frames: frames, frameRate: 15, repeat: -1 });
    });
  }

  generateFX() {
    for (let f = 0; f < 4; f++) {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const cx = 32;
      const cy = 32;
      const radius = 10 + f * 7;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(f * 0.3);

      ctx.fillStyle = f % 2 === 0 ? '#fffa65' : '#ffaf40';
      const numPoints = 8;
      ctx.beginPath();
      for (let i = 0; i < numPoints * 2; i++) {
        const r = (i % 2 === 0) ? radius : radius * 0.4;
        const a = (i * Math.PI) / numPoints;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(2, 8 - f * 2), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      const key = `fx_hit_spark_${f}`;
      if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
      this.scene.textures.addCanvas(key, canvas);
    }

    const hitFrames = [0, 1, 2, 3].map(i => ({ key: `fx_hit_spark_${i}` }));
    if (this.scene.anims.exists('fx_hit_spark_anim')) this.scene.anims.remove('fx_hit_spark_anim');
    this.scene.anims.create({ key: 'fx_hit_spark_anim', frames: hitFrames, frameRate: 24, repeat: 0 });

    for (let f = 0; f < 3; f++) {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext('2d');
      const cx = 24;
      const cy = 24;
      const radius = 8 + f * 6;

      ctx.strokeStyle = '#00d2d3';
      ctx.lineWidth = 3 - f;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, -Math.PI * 0.6, Math.PI * 0.6);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.8, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();

      const key = `fx_block_spark_${f}`;
      if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
      this.scene.textures.addCanvas(key, canvas);
    }

    const blockFrames = [0, 1, 2].map(i => ({ key: `fx_block_spark_${i}` }));
    if (this.scene.anims.exists('fx_block_spark_anim')) this.scene.anims.remove('fx_block_spark_anim');
    this.scene.anims.create({ key: 'fx_block_spark_anim', frames: blockFrames, frameRate: 20, repeat: 0 });

    for (let f = 0; f < 3; f++) {
      const canvas = document.createElement('canvas');
      canvas.width = 36;
      canvas.height = 20;
      const ctx = canvas.getContext('2d');
      const cx = 18;
      const cy = 12;

      ctx.fillStyle = `rgba(223, 230, 233, ${0.8 - f * 0.25})`;
      ctx.beginPath();
      ctx.arc(cx - 6 - f * 3, cy, 4 + f * 2, 0, Math.PI * 2);
      ctx.arc(cx + 6 + f * 3, cy, 4 + f * 2, 0, Math.PI * 2);
      ctx.arc(cx, cy - 2, 5 + f, 0, Math.PI * 2);
      ctx.fill();

      const key = `fx_dust_${f}`;
      if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
      this.scene.textures.addCanvas(key, canvas);
    }

    const dustFrames = [0, 1, 2].map(i => ({ key: `fx_dust_${i}` }));
    if (this.scene.anims.exists('fx_dust_anim')) this.scene.anims.remove('fx_dust_anim');
    this.scene.anims.create({ key: 'fx_dust_anim', frames: dustFrames, frameRate: 15, repeat: 0 });
  }

  generateStage() {
    const W = 1500;
    const H = 540;

    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = W;
    skyCanvas.height = H;
    const sCtx = skyCanvas.getContext('2d');

    const skyGrad = sCtx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#0c0b1e');
    skyGrad.addColorStop(0.4, '#241734');
    skyGrad.addColorStop(0.7, '#6c2146');
    skyGrad.addColorStop(0.85, '#e15f41');
    skyGrad.addColorStop(1, '#f19066');
    sCtx.fillStyle = skyGrad;
    sCtx.fillRect(0, 0, W, H);

    sCtx.fillStyle = '#1e142b';
    for (let x = 0; x < W; x += 60) {
      const bH = 80 + Math.sin(x * 0.05) * 50 + (x % 70) * 1.5;
      sCtx.fillRect(x, 430 - bH, 54, bH);
      sCtx.fillStyle = (x % 3 === 0) ? '#f5cd79' : '#e15f41';
      for (let wy = 430 - bH + 10; wy < 420; wy += 14) {
        sCtx.fillRect(x + 10, wy, 4, 6);
        sCtx.fillRect(x + 22, wy, 4, 6);
        sCtx.fillRect(x + 36, wy, 4, 6);
      }
      sCtx.fillStyle = '#1e142b';
    }

    if (this.scene.textures.exists('stage_sky')) this.scene.textures.remove('stage_sky');
    this.scene.textures.addCanvas('stage_sky', skyCanvas);

    const midCanvas = document.createElement('canvas');
    midCanvas.width = W;
    midCanvas.height = H;
    const mCtx = midCanvas.getContext('2d');

    mCtx.fillStyle = '#130f1c';
    mCtx.fillRect(100, 280, 1300, 150);

    const drawRoof = (rx, ry, rw) => {
      mCtx.fillStyle = '#1b1429';
      mCtx.beginPath();
      mCtx.moveTo(rx, ry);
      mCtx.quadraticCurveTo(rx + rw * 0.5, ry - 25, rx + rw, ry);
      mCtx.lineTo(rx + rw - 15, ry + 16);
      mCtx.lineTo(rx + 15, ry + 16);
      mCtx.closePath();
      mCtx.fill();
    };

    drawRoof(150, 270, 350);
    drawRoof(550, 250, 400);
    drawRoof(1000, 270, 350);

    mCtx.font = 'bold 24px "Teko", sans-serif';
    mCtx.fillStyle = '#ff4757';
    mCtx.shadowColor = '#ff6b81';
    mCtx.shadowBlur = 15;
    mCtx.fillText('★ MASCOT FIGHTER CHAMPIONSHIP ★', 480, 320);

    mCtx.fillStyle = '#2ed573';
    mCtx.shadowColor = '#7bed9f';
    mCtx.fillText('READY TO CLASH', 220, 340);

    mCtx.fillStyle = '#00d2d3';
    mCtx.shadowColor = '#54a0ff';
    mCtx.fillText('NO FEAR • NO SURRENDER', 980, 340);
    mCtx.shadowBlur = 0;

    for (let lx = 200; lx < W - 200; lx += 110) {
      mCtx.fillStyle = '#e84118';
      mCtx.beginPath();
      mCtx.ellipse(lx, 290, 8, 14, 0, 0, Math.PI * 2);
      mCtx.fill();

      mCtx.fillStyle = '#fbc531';
      mCtx.beginPath();
      mCtx.ellipse(lx, 290, 4, 8, 0, 0, Math.PI * 2);
      mCtx.fill();
    }

    if (this.scene.textures.exists('stage_mid')) this.scene.textures.remove('stage_mid');
    this.scene.textures.addCanvas('stage_mid', midCanvas);

    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = W;
    floorCanvas.height = 100;
    const fCtx = floorCanvas.getContext('2d');

    fCtx.fillStyle = '#2c2d30';
    fCtx.fillRect(0, 0, W, 100);

    fCtx.strokeStyle = '#1e1f22';
    fCtx.lineWidth = 3;
    for (let y = 0; y < 100; y += 18) {
      fCtx.beginPath();
      fCtx.moveTo(0, y);
      fCtx.lineTo(W, y);
      fCtx.stroke();
    }

    for (let x = 0; x < W; x += 55) {
      fCtx.beginPath();
      fCtx.moveTo(x, 0);
      fCtx.lineTo(x + 20, 100);
      fCtx.stroke();
    }

    fCtx.fillStyle = '#ff4757';
    fCtx.fillRect(0, 0, W, 4);

    fCtx.fillStyle = 'rgba(255, 165, 2, 0.4)';
    fCtx.fillRect(W / 2 - 120, 10, 240, 6);
    fCtx.fillRect(W / 2 - 4, 10, 8, 80);

    if (this.scene.textures.exists('stage_floor')) this.scene.textures.remove('stage_floor');
    this.scene.textures.addCanvas('stage_floor', floorCanvas);
  }
}
