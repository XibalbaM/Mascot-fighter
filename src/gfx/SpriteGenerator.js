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
    if (char.id === 'palmtree') {
      this.drawPalmitoHead(ctx, char.palette, 0, 0, 0);
    } else if (char.id === 'squid') {
      this.drawPoulpiHead(ctx, char.palette, 0, 0, 0);
    } else {
      this.drawFighterHead(ctx, char.id, char.palette, 0, 0, 0);
    }
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
      'dash_fwd_0', 'dash_fwd_1', 'dash_fwd_2',
      'dash_back_0', 'dash_back_1', 'dash_back_2',
      'light_punch_0', 'light_punch_1', 'light_punch_2',
      'heavy_punch_0', 'heavy_punch_1', 'heavy_punch_2', 'heavy_punch_3',
      'light_kick_0', 'light_kick_1', 'light_kick_2',
      'heavy_kick_0', 'heavy_kick_1', 'heavy_kick_2', 'heavy_kick_3',
      'crouch_punch_0', 'crouch_punch_1', 'crouch_punch_2',
      'crouch_kick_0', 'crouch_kick_1', 'crouch_kick_2',
      'jump_punch_0', 'jump_punch_1',
      'jump_kick_0', 'jump_kick_1',
      'throw_0', 'throw_1', 'throw_2',
      'hadouken_0', 'hadouken_1', 'hadouken_2', 'hadouken_3',
      'shoryuken_0', 'shoryuken_1', 'shoryuken_2', 'shoryuken_3',
      'taunt_0', 'taunt_1', 'taunt_2', 'taunt_3',
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

    // Palmito & Poulpi have their own dedicated model + animation rigs.
    if (id === 'palmtree') { this.drawPalmitoFrame(ctx, pal, animName, frameIndex); return; }
    if (id === 'squid') { this.drawPoulpiFrame(ctx, pal, animName, frameIndex); return; }

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
      by -= (frameIndex === 1 ? 16 : 8);
    } else if (animName === 'jump_punch') {
      by -= 14;
      bx += (frameIndex === 1 ? 4 : 0);
    } else if (animName === 'jump_kick') {
      by -= 12;
      bx += (frameIndex === 1 ? 6 : 0);
      angle = frameIndex === 1 ? 0.15 : 0;
    } else if (animName === 'crouch_punch' || animName === 'crouch_kick') {
      by += 16;
      scaleY = 0.72;
    } else if (animName === 'shoryuken') {
      if (frameIndex === 0) { by += 10; scaleY = 0.8; }
      else if (frameIndex === 1) { by -= 18; }
      else if (frameIndex === 2) { by -= 28; }
      else if (frameIndex === 3) { by -= 12; }
    } else if (animName === 'dash_fwd') {
      bx += frameIndex * 6;
      by -= 2;
      angle = 0.1;
    } else if (animName === 'dash_back') {
      bx -= frameIndex * 5;
      by -= 2;
      angle = -0.1;
    } else if (animName === 'throw') {
      if (frameIndex === 0) { bx += 6; }
      else if (frameIndex === 1) { bx += 12; by -= 4; }
      else if (frameIndex === 2) { bx += 8; by += 2; angle = 0.15; }
    } else if (animName === 'taunt') {
      const bounce = Math.sin(frameIndex * Math.PI / 2) * 3;
      by -= bounce + 2;
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
    this.drawLegs(ctx, bx, by, pal, animName, frameIndex, id);

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
    } else if (id === 'pig') {
      // Cute spiral curly tail @
      ctx.strokeStyle = pal.primary;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(bx - 12, by + 18, 5, 0, Math.PI * 1.6);
      ctx.stroke();
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
    } else if (id === 'husky') {
      // Husky athletic torso with white chest fur and blue jacket
      this.p(ctx, bx - 4, by + 6, 20, 22, pal.primary);
      this.p(ctx, bx + 2, by + 8, 12, 16, pal.secondary); // White chest fur
      this.p(ctx, bx - 6, by + 6, 7, 22, pal.cloth);      // Blue jacket left
      this.p(ctx, bx + 11, by + 6, 7, 22, pal.cloth);     // Blue jacket right
      this.p(ctx, bx - 7, by + 20, 26, 5, pal.belt);
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

  drawLegs(ctx, bx, by, pal, animName, frameIndex, id) {
    const legY = by + 26;
    const isHeavy = (id === 'hippo' || id === 'pig');
    const legW = isHeavy ? 10 : 8;
    const legH = isHeavy ? 18 : 16;
    const footW = isHeavy ? 14 : 10;
    const footH = isHeavy ? 6 : 5;

    if (animName === 'walk') {
      const step = (frameIndex % 4);
      if (step === 0) {
        this.p(ctx, bx - 6, legY, legW, legH, pal.cloth);
        this.p(ctx, bx - 8, legY + legH - 2, footW, footH, pal.primary);
        this.p(ctx, bx + 10, legY, legW, legH - 2, pal.cloth);
        this.p(ctx, bx + 12, legY + legH - 4, footW, footH, pal.primary);
      } else if (step === 1) {
        this.p(ctx, bx - 2, legY, legW, legH - 1, pal.cloth);
        this.p(ctx, bx - 4, legY + legH - 3, footW, footH, pal.primary);
        this.p(ctx, bx + 6, legY, legW, legH - 1, pal.cloth);
        this.p(ctx, bx + 6, legY + legH - 3, footW, footH, pal.primary);
      } else if (step === 2) {
        this.p(ctx, bx + 6, legY, legW, legH, pal.cloth);
        this.p(ctx, bx + 8, legY + legH - 2, footW, footH, pal.primary);
        this.p(ctx, bx - 4, legY, legW, legH - 2, pal.cloth);
        this.p(ctx, bx - 6, legY + legH - 4, footW, footH, pal.primary);
      } else {
        this.p(ctx, bx - 3, legY, legW, legH - 1, pal.cloth);
        this.p(ctx, bx - 5, legY + legH - 3, footW, footH, pal.primary);
        this.p(ctx, bx + 5, legY, legW, legH - 1, pal.cloth);
        this.p(ctx, bx + 5, legY + legH - 3, footW, footH, pal.primary);
      }
    } else if (animName === 'heavy_kick' || animName === 'crouch_kick') {
      if (frameIndex >= 1 && frameIndex <= 2) {
        this.p(ctx, bx - 5, legY, legW, legH, pal.cloth);
        this.p(ctx, bx - 7, legY + legH - 2, footW, footH, pal.primary);
        const kickY = animName === 'crouch_kick' ? legY + 8 : legY - 6;
        this.p(ctx, bx + 8, kickY, 26, 8, pal.cloth);
        this.p(ctx, bx + 30, kickY - 1, 12, 10, pal.primary);
        this.p(ctx, bx + 40, kickY + 1, 4, 6, pal.claw);
      } else {
        this.p(ctx, bx - 5, legY, legW, legH, pal.cloth);
        this.p(ctx, bx + 8, legY, legW, legH, pal.cloth);
      }
    } else if (animName === 'light_kick') {
      if (frameIndex === 1) {
        this.p(ctx, bx - 5, legY, legW, legH, pal.cloth);
        this.p(ctx, bx + 6, legY - 2, 20, 7, pal.cloth);
        this.p(ctx, bx + 22, legY - 3, 10, 9, pal.primary);
      } else {
        this.p(ctx, bx - 5, legY, legW, legH, pal.cloth);
        this.p(ctx, bx + 8, legY, legW, legH, pal.cloth);
      }
    } else if (animName === 'jump_kick') {
      // Aerial kick — legs extended
      if (frameIndex === 1) {
        this.p(ctx, bx - 4, legY - 4, legW, legH - 4, pal.cloth);
        this.p(ctx, bx + 6, legY - 8, 24, 7, pal.cloth);
        this.p(ctx, bx + 26, legY - 9, 10, 9, pal.primary);
        this.p(ctx, bx + 34, legY - 7, 4, 6, pal.claw);
      } else {
        this.p(ctx, bx - 4, legY - 2, legW, legH - 2, pal.cloth);
        this.p(ctx, bx + 8, legY - 4, legW, legH - 4, pal.cloth);
      }
    } else if (animName === 'jump_punch') {
      // Aerial — legs tucked up
      this.p(ctx, bx - 4, legY + 2, legW, legH - 6, pal.cloth);
      this.p(ctx, bx + 6, legY + 2, legW, legH - 6, pal.cloth);
    } else if (animName === 'dash_fwd') {
      // Running dash — wide stride
      this.p(ctx, bx - 8, legY, legW, legH, pal.cloth);
      this.p(ctx, bx - 10, legY + legH - 2, footW, footH, pal.primary);
      this.p(ctx, bx + 12, legY - 4, legW, legH - 2, pal.cloth);
      this.p(ctx, bx + 14, legY + legH - 6, footW, footH, pal.primary);
    } else if (animName === 'dash_back') {
      // Hop backward
      this.p(ctx, bx + 4, legY - 2, legW, legH - 2, pal.cloth);
      this.p(ctx, bx - 6, legY, legW, legH - 2, pal.cloth);
    } else {
      // Default standing pose
      this.p(ctx, bx - 6, legY, legW + 1, legH, pal.cloth);
      this.p(ctx, bx - 8, legY + legH - 2, footW + 2, footH, pal.primary);
      this.p(ctx, bx + 9, legY, legW + 1, legH, pal.cloth);
      this.p(ctx, bx + 9, legY + legH - 2, footW + 2, footH, pal.primary);

      // Husky — extra paw detail
      if (id === 'husky') {
        this.p(ctx, bx - 7, legY + legH - 1, footW + 1, 2, pal.secondary);
        this.p(ctx, bx + 10, legY + legH - 1, footW + 1, 2, pal.secondary);
      }
    }
  }

  drawArms(ctx, bx, by, pal, animName, frameIndex, id) {
    const armY = by + 8;

    if (animName === 'light_punch') {
      if (frameIndex === 1) {
        // Active hit frame — character-specific punch extension
        if (id === 'phoenix') {
          // Wing blade slash
          this.p(ctx, bx + 6, armY, 24, 7, pal.secondary);
          this.p(ctx, bx + 26, armY - 3, 14, 12, pal.hairOrHead);
          this.p(ctx, bx + 38, armY, 4, 5, pal.specialColor);
        } else {
          this.p(ctx, bx + 6, armY, 26, 7, pal.cloth);
          this.p(ctx, bx + 28, armY - 1, 11, 9, pal.primary);
          this.p(ctx, bx + 37, armY + 1, 4, 5, pal.claw);
        }
        this.p(ctx, bx - 6, armY + 2, 8, 12, pal.cloth);
      } else {
        this.drawNormalGuard(ctx, bx, armY, pal, id);
      }
    } else if (animName === 'heavy_punch') {
      if (frameIndex === 1) {
        // Wind-up frame
        if (id === 'lion') {
          this.p(ctx, bx - 16, armY, 16, 12, pal.primary);
          this.p(ctx, bx - 20, armY + 2, 8, 8, pal.claw);
        } else {
          this.p(ctx, bx - 14, armY + 2, 14, 10, pal.cloth);
          this.p(ctx, bx - 18, armY + 2, 9, 9, pal.primary);
        }
      } else if (frameIndex === 2) {
        // Full extension — character-specific heavy
        if (id === 'lion') {
          // Massive claw swipe with golden trail
          this.p(ctx, bx + 6, armY - 2, 36, 12, pal.primary);
          this.p(ctx, bx + 38, armY - 4, 16, 16, pal.primary);
          this.p(ctx, bx + 50, armY - 2, 6, 10, pal.claw);
          // Claw slash marks
          this.p(ctx, bx + 20, armY - 6, 2, 18, pal.specialColor);
          this.p(ctx, bx + 26, armY - 5, 2, 16, pal.specialColor);
          this.p(ctx, bx + 32, armY - 4, 2, 14, pal.specialColor);
        } else if (id === 'pig') {
          // Charging headbutt / tusk ram
          this.p(ctx, bx + 6, armY, 30, 10, pal.cloth);
          this.p(ctx, bx + 32, armY - 3, 16, 14, pal.primary);
          this.p(ctx, bx + 44, armY - 1, 6, 8, pal.claw);
          this.p(ctx, bx + 18, armY - 4, 16, 2, '#ffffff');
        } else if (id === 'hippo') {
          // Hammer fist slam
          this.p(ctx, bx + 4, armY - 4, 12, 20, pal.cloth);
          this.p(ctx, bx + 14, armY + 10, 20, 12, pal.primary);
          this.p(ctx, bx + 30, armY + 12, 10, 10, pal.claw);
          this.p(ctx, bx + 10, armY + 20, 24, 3, pal.specialColor);
        } else if (id === 'dragon') {
          // Dragon claw with fire trail
          this.p(ctx, bx + 6, armY, 34, 10, pal.cloth);
          this.p(ctx, bx + 36, armY - 2, 14, 13, pal.primary);
          this.p(ctx, bx + 47, armY, 6, 8, pal.claw);
          // Fire trail
          this.p(ctx, bx + 16, armY - 4, 24, 3, pal.specialColor);
          this.p(ctx, bx + 20, armY + 10, 20, 2, pal.hairOrHead);
        } else if (id === 'husky') {
          // Frost paw uppercut swipe
          this.p(ctx, bx + 6, armY - 2, 30, 10, pal.cloth);
          this.p(ctx, bx + 32, armY - 4, 14, 14, pal.secondary);
          this.p(ctx, bx + 43, armY - 2, 5, 8, pal.claw);
          // Frost sparkles
          this.p(ctx, bx + 24, armY - 7, 3, 3, pal.specialColor);
          this.p(ctx, bx + 36, armY - 8, 3, 3, '#ffffff');
        } else {
          this.p(ctx, bx + 6, armY, 34, 10, pal.cloth);
          this.p(ctx, bx + 36, armY - 2, 14, 13, pal.primary);
          this.p(ctx, bx + 47, armY, 5, 8, pal.claw);
          this.p(ctx, bx + 18, armY - 3, 20, 2, '#ffffff');
        }
      } else {
        this.drawNormalGuard(ctx, bx, armY, pal, id);
      }
    } else if (animName === 'crouch_punch') {
      if (frameIndex === 1) {
        this.p(ctx, bx + 6, armY + 6, 24, 7, pal.cloth);
        this.p(ctx, bx + 26, armY + 4, 11, 10, pal.primary);
        this.p(ctx, bx + 35, armY + 6, 4, 5, pal.claw);
      } else {
        this.drawNormalGuard(ctx, bx, armY, pal, id);
      }
    } else if (animName === 'hadouken') {
      if (frameIndex === 0 || frameIndex === 1) {
        // Charge-up — hands pulled back
        this.p(ctx, bx - 12, armY + 8, 14, 10, pal.cloth);
        this.p(ctx, bx - 14, armY + 6, 12, 12, pal.primary);
        // Energy gathering glow
        this.p(ctx, bx - 16, armY + 2, 8, 8, pal.specialColor);
        this.p(ctx, bx - 12, armY + 14, 5, 5, '#ffffff');
        this.p(ctx, bx - 18, armY + 8, 4, 4, '#ffffff');
      } else {
        // Release — thrust forward
        this.p(ctx, bx + 6, armY + 4, 28, 12, pal.cloth);
        this.p(ctx, bx + 30, armY + 2, 14, 16, pal.primary);
        this.p(ctx, bx + 42, armY + 4, 8, 12, pal.specialColor);
        this.p(ctx, bx + 48, armY + 6, 4, 8, '#ffffff');
      }
    } else if (animName === 'shoryuken') {
      if (frameIndex === 1 || frameIndex === 2) {
        // Rising uppercut — character-specific
        this.p(ctx, bx + 12, armY + 2, 8, 8, pal.cloth);
        this.p(ctx, bx + 18, armY - 24, 10, 32, pal.cloth);
        this.p(ctx, bx + 17, armY - 36, 13, 14, pal.primary);
        this.p(ctx, bx + 20, armY - 40, 7, 6, pal.claw);
        // Energy trail
        this.p(ctx, bx + 15, armY - 38, 17, 4, pal.specialColor);
        this.p(ctx, bx + 16, armY - 26, 4, 18, pal.specialColor);
        this.p(ctx, bx + 27, armY - 18, 4, 16, pal.specialColor);
        // Extra sparkle
        if (id === 'phoenix') {
          this.p(ctx, bx + 12, armY - 42, 6, 4, pal.hairOrHead);
          this.p(ctx, bx + 26, armY - 32, 4, 4, pal.hairOrHead);
        } else if (id === 'dragon') {
          this.p(ctx, bx + 10, armY - 44, 8, 6, pal.hairOrHead);
          this.p(ctx, bx + 28, armY - 30, 5, 5, pal.specialColor);
        } else if (id === 'husky') {
          this.p(ctx, bx + 12, armY - 44, 6, 4, '#ffffff');
          this.p(ctx, bx + 28, armY - 36, 4, 4, pal.specialColor);
        }
      } else {
        this.drawNormalGuard(ctx, bx, armY, pal, id);
      }
    } else if (animName === 'throw') {
      if (frameIndex === 0) {
        // Grab reach
        this.p(ctx, bx + 6, armY - 2, 20, 10, pal.cloth);
        this.p(ctx, bx + 22, armY - 4, 12, 14, pal.primary);
        this.p(ctx, bx + 32, armY - 2, 4, 10, pal.claw);
      } else if (frameIndex === 1) {
        // Clinch
        this.p(ctx, bx + 8, armY - 6, 24, 14, pal.cloth);
        this.p(ctx, bx + 28, armY - 8, 10, 16, pal.primary);
      } else {
        // Toss release
        this.p(ctx, bx + 4, armY, 18, 8, pal.cloth);
        this.p(ctx, bx + 18, armY - 2, 10, 10, pal.primary);
        this.p(ctx, bx + 10, armY - 6, 16, 3, pal.specialColor);
      }
    } else if (animName === 'dash_fwd') {
      // Leaning forward with arms trailing
      this.p(ctx, bx - 4, armY + 4, 14, 8, pal.cloth);
      this.p(ctx, bx - 10, armY + 2, 10, 10, pal.primary);
      this.p(ctx, bx + 10, armY + 2, 10, 8, pal.cloth);
      this.p(ctx, bx + 16, armY, 8, 10, pal.primary);
    } else if (animName === 'dash_back') {
      // Leaning backward with arms forward
      this.p(ctx, bx + 6, armY, 14, 8, pal.cloth);
      this.p(ctx, bx + 16, armY - 2, 8, 10, pal.primary);
      this.p(ctx, bx - 2, armY + 4, 10, 8, pal.cloth);
    } else if (animName === 'taunt') {
      // Character-specific taunt poses
      if (id === 'lion') {
        // Flexing / roaring
        this.p(ctx, bx + 8, armY - 14, 10, 20, pal.cloth);
        this.p(ctx, bx + 14, armY - 18, 10, 12, pal.primary);
        this.p(ctx, bx - 8, armY - 14, 10, 20, pal.cloth);
        this.p(ctx, bx - 14, armY - 18, 10, 12, pal.primary);
      } else if (id === 'husky') {
        // Happy panting / tail wag arms up
        this.p(ctx, bx + 6, armY - 10, 10, 18, pal.cloth);
        this.p(ctx, bx + 12, armY - 14, 8, 10, pal.secondary);
        this.p(ctx, bx - 8, armY - 8, 10, 16, pal.cloth);
        this.p(ctx, bx - 12, armY - 10, 8, 10, pal.secondary);
      } else if (id === 'phoenix') {
        // Wings spread wide
        this.p(ctx, bx + 8, armY - 8, 24, 6, pal.hairOrHead);
        this.p(ctx, bx + 28, armY - 12, 10, 10, pal.secondary);
        this.p(ctx, bx - 10, armY - 6, 20, 6, pal.hairOrHead);
        this.p(ctx, bx - 24, armY - 10, 10, 10, pal.secondary);
      } else {
        // Generic beckoning pose
        this.p(ctx, bx + 8, armY - 4, 16, 8, pal.cloth);
        this.p(ctx, bx + 20, armY - 8, 10, 10, pal.primary);
        this.p(ctx, bx + 28, armY - 6, 4, 6, pal.claw);
        this.p(ctx, bx - 8, armY + 4, 10, 8, pal.cloth);
      }
    } else if (animName === 'block_high') {
      this.p(ctx, bx + 4, armY - 6, 10, 20, pal.cloth);
      this.p(ctx, bx + 10, armY - 4, 8, 18, pal.primary);
      this.p(ctx, bx + 12, armY - 8, 6, 12, pal.secondary);
    } else if (animName === 'block_low') {
      this.p(ctx, bx + 6, armY + 2, 12, 16, pal.cloth);
      this.p(ctx, bx + 12, armY + 4, 8, 14, pal.primary);
    } else if (animName === 'victory') {
      // Pumping fist celebration
      const pump = Math.sin(frameIndex * Math.PI / 2) * 6;
      this.p(ctx, bx + 6, armY - 18 - pump, 10, 24 + pump, pal.cloth);
      this.p(ctx, bx + 8, armY - 24 - pump, 10, 10, pal.primary);
      this.p(ctx, bx + 10, armY - 28 - pump, 6, 6, pal.claw);
      this.p(ctx, bx - 8, armY + 2, 10, 8, pal.cloth);
    } else {
      this.drawNormalGuard(ctx, bx, armY, pal, id);
    }
  }

  drawNormalGuard(ctx, bx, armY, pal, id) {
    if (id === 'hippo' || id === 'pig') {
      // Heavyweight guard — thicker arms
      this.p(ctx, bx + 2, armY - 2, 16, 12, pal.cloth);
      this.p(ctx, bx + 14, armY - 6, 12, 12, pal.primary);
      this.p(ctx, bx + 24, armY - 4, 5, 8, pal.claw);
      this.p(ctx, bx - 10, armY, 12, 10, pal.cloth);
      this.p(ctx, bx - 14, armY - 2, 10, 10, pal.secondary);
    } else {
      this.p(ctx, bx + 4, armY, 14, 9, pal.cloth);
      this.p(ctx, bx + 15, armY - 4, 9, 10, pal.primary);
      this.p(ctx, bx + 22, armY - 2, 4, 6, pal.claw);
      this.p(ctx, bx - 8, armY + 2, 10, 8, pal.cloth);
      this.p(ctx, bx - 12, armY - 2, 8, 9, pal.secondary);
    }
  }

  // =====================================================================
  // PALMITO (palmtree) — dedicated model & animation rig (complete redo)
  // The palm is rooted at (bx, groundY); the whole rig pivots there so
  // jumps, crouches and knockdowns rotate/squash naturally.
  // =====================================================================

  drawPalmitoFrame(ctx, pal, animName, f) {
    const groundY = this.frameHeight - 6; // 154
    const bx = this.frameWidth / 2 - 6;    // 114

    let angle = 0;   // whole-body rotation (radians)
    let scaleY = 1;  // vertical squash (crouch)
    let lift = 0;    // jump / hop height (px)
    let lean = 0;    // crown lean (px) — trunk curve
    let armMode = 'guard';
    let rootMode = 'stand';
    let orb = null;  // hadouken coconut: {x, y, r} in local frame coords
    let fan = false; // fronds spread wide (taunt / victory)

    switch (animName) {
      case 'idle':
        lift = Math.sin(f * Math.PI / 2) * 2;
        lean = Math.sin(f * Math.PI / 2) * 2;
        break;
      case 'walk': {
        lift = Math.abs(Math.sin(f * Math.PI / 2)) * 2;
        lean = 4 + (f % 2 === 0 ? 2 : -2);
        rootMode = 'walk';
        break;
      }
      case 'crouch':
        scaleY = 0.68; lean = 6;
        break;
      case 'block_low':
        scaleY = 0.68; lean = 6; armMode = 'blockLow';
        break;
      case 'jump':
        lift = [8, 20, 10][Math.min(f, 2)];
        lean = 3; rootMode = 'tuck';
        break;
      case 'dash_fwd':
        lift = 3; lean = 12 + f * 2; angle = 0.12; rootMode = 'trail'; armMode = 'dash';
        break;
      case 'dash_back':
        lift = 3; lean = -10 - f * 2; angle = -0.12; rootMode = 'trail'; armMode = 'dashBack';
        break;
      case 'light_punch':
        if (f === 1) armMode = 'punch';
        break;
      case 'heavy_punch':
        if (f === 1) armMode = 'windup';
        else if (f === 2) armMode = 'heavy';
        else if (f === 3) armMode = 'recover';
        break;
      case 'light_kick':
        if (f === 1) rootMode = 'kickLight';
        break;
      case 'heavy_kick':
        if (f >= 1 && f <= 2) rootMode = 'kickHeavy';
        break;
      case 'crouch_punch':
        scaleY = 0.68; lean = 6;
        if (f === 1) armMode = 'punchLow';
        break;
      case 'crouch_kick':
        scaleY = 0.68; lean = 6;
        if (f === 1) rootMode = 'kickCrouch';
        break;
      case 'jump_punch':
        lift = 16; lean = 4; rootMode = 'tuck';
        if (f === 1) armMode = 'punchAir';
        break;
      case 'jump_kick':
        lift = 14; lean = 4; angle = 0.12;
        if (f === 1) rootMode = 'kickAir';
        break;
      case 'throw':
        if (f === 0) armMode = 'grab';
        else if (f === 1) armMode = 'clinch';
        else { armMode = 'heave'; lean = 8; angle = 0.12; }
        break;
      case 'hadouken':
        if (f <= 1) { armMode = 'charge'; orb = { x: bx - 14, y: groundY - 46, r: 6 + f * 3 }; }
        else { armMode = 'thrust'; orb = { x: bx + 50, y: groundY - 48, r: 10 }; }
        break;
      case 'shoryuken':
        if (f === 0) { scaleY = 0.75; lean = 8; }
        else if (f === 1) { lift = 22; armMode = 'uppercut'; }
        else if (f === 2) { lift = 34; armMode = 'uppercut'; }
        else { lift = 14; armMode = 'uppercutRecover'; }
        break;
      case 'taunt':
        lift = Math.sin(f * Math.PI / 2) * 4 + 2;
        lean = Math.sin(f * Math.PI / 2) * 5;
        armMode = 'taunt'; fan = true;
        break;
      case 'hurt_high':
        lean = -6 - f * 3; angle = -0.18; lift = 2;
        break;
      case 'hurt_low':
        scaleY = 0.82; lean = -4 - f * 2; angle = 0.2;
        break;
      case 'block_high':
        armMode = 'blockHigh';
        break;
      case 'knockdown':
        if (f === 0) { angle = -0.7; lift = 18; lean = -8; }
        else if (f === 1) { angle = -1.25; lift = 8; lean = -10; }
        else { angle = -1.57; lean = -12; rootMode = 'sprawl'; }
        break;
      case 'defeat':
        angle = -1.57; lean = -12; rootMode = 'sprawl';
        break;
      case 'getup':
        if (f === 0) { angle = -0.9; scaleY = 0.85; lean = -8; }
        else if (f === 1) { angle = -0.35; scaleY = 0.92; lean = -4; }
        break;
      case 'victory':
        lift = Math.abs(Math.sin(f * Math.PI / 2)) * 6 + 2;
        armMode = 'victory'; fan = true;
        break;
    }

    ctx.save();
    ctx.translate(bx, groundY - lift);
    ctx.rotate(angle);
    ctx.scale(1, scaleY);
    ctx.translate(-bx, -groundY);

    // 1. root feet planted on the ground line
    this.drawPalmitoRoots(ctx, pal, bx, groundY, rootMode, f);
    // 2. segmented trunk — returns crown + arm attach points
    const geo = this.drawPalmitoTrunk(ctx, pal, bx, groundY, lean);
    // 3. vine belt + floral skirt at the trunk base
    this.drawPalmitoSkirt(ctx, pal, bx, groundY, f);
    // 4. face on the upper trunk
    this.drawPalmitoFace(ctx, pal, geo, f);
    // 5. fanned frond crown + coconuts
    this.drawPalmitoCrown(ctx, pal, geo.crownX, geo.crownY, f, fan, 1);
    // 6. vine arms (whips, blocks, hadouken...)
    this.drawPalmitoArms(ctx, pal, geo, armMode, f);
    // 7. hadouken coconut orb
    if (orb) this.drawPalmitoOrb(ctx, pal, orb, armMode === 'thrust');

    ctx.restore();
  }

  drawPalmitoTrunk(ctx, pal, bx, groundY, lean) {
    const baseY = groundY - 20; // 134 — skirt / roots zone below
    const segs = 5;
    const segH = 10;
    let armX = bx, armY = 0, crownX = bx, crownY = 0;
    for (let i = 0; i < segs; i++) {
      const t = (i + 1) / segs;
      const off = lean * t * t; // eased trunk curve
      const y = baseY - (i + 1) * segH;
      this.p(ctx, bx + off - 8, y, 16, segH + 1, pal.primary);
      this.p(ctx, bx + off - 8, y, 16, 2, pal.secondary);      // bark ring
      this.p(ctx, bx + off - 8, y + segH - 3, 3, 2, '#5d4037'); // wood knot
      if (i === 2) { armX = bx + off; armY = y + segH / 2; }
      if (i === segs - 1) { crownX = bx + off; crownY = y; }
    }
    return { crownX, crownY, armX, armY, faceX: bx + lean * 0.64, faceY: baseY - 4 * segH };
  }

  drawPalmitoRoots(ctx, pal, bx, groundY, mode, f) {
    const baseY = groundY - 20;
    let feet;
    switch (mode) {
      case 'walk': {
        const step = f % 4;
        const l0 = (step === 0 || step === 2) ? 6 : 0;
        const l1 = (step === 1 || step === 3) ? 5 : 0;
        feet = [
          { x: bx - 14, y: groundY - l0 },
          { x: bx, y: groundY - l1 },
          { x: bx + 14, y: groundY - (l0 ? 0 : 5) }
        ];
        break;
      }
      case 'tuck':
        feet = [ { x: bx - 12, y: groundY - 10 }, { x: bx + 2, y: groundY - 12 }, { x: bx + 14, y: groundY - 8 } ];
        break;
      case 'trail':
        feet = [ { x: bx - 16, y: groundY - 4 }, { x: bx - 4, y: groundY }, { x: bx + 10, y: groundY - 2 } ];
        break;
      case 'sprawl':
        feet = [ { x: bx - 22, y: groundY }, { x: bx - 6, y: groundY }, { x: bx + 10, y: groundY } ];
        break;
      case 'kickLight':
        feet = [ { x: bx - 14, y: groundY }, { x: bx + 2, y: groundY }, { x: bx + 40, y: groundY - 2, kick: true } ];
        break;
      case 'kickHeavy':
        feet = [ { x: bx - 16, y: groundY }, { x: bx - 2, y: groundY }, { x: bx + 52, y: groundY - 14, kick: true } ];
        break;
      case 'kickCrouch':
        feet = [ { x: bx - 12, y: groundY }, { x: bx + 2, y: groundY }, { x: bx + 36, y: groundY - 2, kick: true } ];
        break;
      case 'kickAir':
        feet = [ { x: bx - 10, y: groundY - 8 }, { x: bx + 2, y: groundY - 10 }, { x: bx + 44, y: groundY - 18, kick: true } ];
        break;
      default:
        feet = [ { x: bx - 14, y: groundY }, { x: bx, y: groundY }, { x: bx + 14, y: groundY } ];
    }
    ctx.strokeStyle = pal.claw;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (const ft of feet) {
      ctx.beginPath();
      ctx.moveTo(bx, baseY + 4);
      ctx.quadraticCurveTo((bx + ft.x) / 2, (baseY + ft.y) / 2 + 6, ft.x, ft.y);
      ctx.stroke();
      // root foot pad (leaf-tipped when it is a kick)
      this.p(ctx, ft.x - 5, ft.y - 3, 11, 4, ft.kick ? pal.hairOrHead : pal.claw);
      if (ft.kick) this.p(ctx, ft.x - 2, ft.y - 5, 6, 3, pal.claw);
    }
    ctx.lineCap = 'butt';
  }

  drawPalmitoSkirt(ctx, pal, bx, groundY, f) {
    const baseY = groundY - 20;
    // vine rope belt
    this.p(ctx, bx - 10, baseY - 3, 20, 5, pal.belt);
    this.p(ctx, bx + 8, baseY + 1, 6, 5, pal.belt); // dangling vine tip
    // floral island shorts
    this.p(ctx, bx - 13, baseY + 2, 26, 12, pal.cloth);
    this.p(ctx, bx - 13, baseY + 2, 26, 3, pal.specialColor); // leafy trim
    const wob = Math.sin(f * 1.6);
    this.p(ctx, bx - 8, baseY + 7 + wob, 4, 4, '#ff6b81');
    this.p(ctx, bx + 2, baseY + 6 - wob, 4, 4, '#ff6b81');
    this.p(ctx, bx - 2, baseY + 10, 4, 3, '#ffffff');
  }

  drawPalmitoFace(ctx, pal, geo, f) {
    const fx = geo.faceX, fy = geo.faceY;
    const sway = Math.sin(f * 1.8) * 1.5;
    // leafy headband wrapped around the trunk
    this.p(ctx, fx - 9, fy - 2, 20, 3, pal.headband);
    this.p(ctx, fx - 14, fy - 1 + sway, 6, 3, pal.headband);
    // goofy eyes
    this.p(ctx, fx - 2, fy + 4, 6, 6, '#ffffff');
    this.p(ctx, fx + 7, fy + 4, 6, 6, '#ffffff');
    this.p(ctx, fx + 0, fy + 6, 2, 3, '#000000');
    this.p(ctx, fx + 9, fy + 6, 2, 3, '#000000');
    // toothy grin
    this.p(ctx, fx + 0, fy + 12, 12, 4, '#2d3436');
    this.p(ctx, fx + 2, fy + 12, 3, 2, '#ffffff');
    this.p(ctx, fx + 8, fy + 12, 3, 2, '#ffffff');
  }

  drawPalmitoCrown(ctx, pal, cx0, cy0, f, fan, size = 1) {
    const angles = [-1.25, -0.9, -0.5, -0.15, 0.2, 0.55, 0.95, 1.3];
    const lens = [46, 54, 60, 64, 64, 58, 52, 44];
    angles.forEach((da, i) => {
      const a = -Math.PI / 2 + da + (fan ? (i - 3.5) * 0.07 : 0);
      const len = lens[i] * size;
      const sw = Math.sin(f * 1.6 + i * 0.9) * (fan ? 6 : 3) * size;
      const tipX = cx0 + Math.cos(a) * len + sw;
      const tipY = cy0 + Math.sin(a) * len * 0.85 + len * 0.12; // droop
      const mx = cx0 + Math.cos(a) * len * 0.55;
      const my = cy0 + Math.sin(a) * len * 0.5;
      const w = 7 * size;
      const nx = Math.cos(a + Math.PI / 2) * w;
      const ny = Math.sin(a + Math.PI / 2) * w;
      ctx.fillStyle = i % 3 === 2 ? pal.headband : (i % 2 === 0 ? pal.hairOrHead : pal.specialColor);
      ctx.beginPath();
      ctx.moveTo(cx0 - nx * 0.4, cy0 - ny * 0.4);
      ctx.quadraticCurveTo(mx, my, tipX, tipY);
      ctx.quadraticCurveTo((cx0 + tipX) / 2 + nx, (cy0 + tipY) / 2 + ny * 0.6, cx0 + nx * 0.4, cy0 + ny * 0.4);
      ctx.closePath();
      ctx.fill();
      // midrib
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx0, cy0);
      ctx.quadraticCurveTo(mx, my, tipX, tipY);
      ctx.stroke();
    });
    // coconut cluster at the heart of the crown
    this.p(ctx, cx0 - 9 * size, cy0 + 2 * size, 7 * size, 7 * size, pal.claw);
    this.p(ctx, cx0 + 1 * size, cy0 + 5 * size, 7 * size, 7 * size, pal.claw);
    this.p(ctx, cx0 + 8 * size, cy0 + 1 * size, 6 * size, 6 * size, '#4e342e');
    this.p(ctx, cx0 - 7 * size, cy0 + 4 * size, 2, 2, '#3e2723');
    this.p(ctx, cx0 + 3 * size, cy0 + 7 * size, 2, 2, '#3e2723');
  }

  drawPalmitoArms(ctx, pal, geo, mode, f) {
    const ax = geo.armX, ay = geo.armY;
    const sway = Math.sin(f * 1.8) * 3;
    const vine = (hx, hy, fistR = 6) => {
      ctx.strokeStyle = pal.primary;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(ax + (hx - ax) * 0.4, ay + 10, hx, hy);
      ctx.stroke();
      ctx.lineCap = 'butt';
      // leafy fist with woody knuckles
      this.p(ctx, hx - fistR, hy - fistR * 0.7, fistR * 2, fistR * 1.4, pal.hairOrHead);
      this.p(ctx, hx - fistR * 0.4, hy - fistR * 0.1, fistR * 0.9, fistR * 0.5, pal.claw);
    };
    switch (mode) {
      case 'punch':
        this.p(ctx, ax + 30, ay - 6, 16, 2, '#ffffff'); // speed line
        vine(ax + 52, ay - 2, 7);
        vine(ax - 12, ay + 10, 4);
        break;
      case 'windup':
        vine(ax - 16, ay + 4, 6);
        vine(ax - 10, ay + 12, 4);
        break;
      case 'heavy':
        this.p(ctx, ax + 20, ay - 10, 26, 2, pal.specialColor);
        this.p(ctx, ax + 26, ay + 6, 20, 2, pal.specialColor);
        this.p(ctx, ax + 34, ay - 2, 16, 2, '#ffffff');
        vine(ax + 58, ay - 6, 9);
        vine(ax - 12, ay + 10, 4);
        break;
      case 'recover':
        vine(ax + 30, ay, 6);
        vine(ax - 12, ay + 10, 4);
        break;
      case 'punchLow':
        vine(ax + 42, ay + 8, 6);
        vine(ax - 12, ay + 12, 4);
        break;
      case 'punchAir':
        vine(ax + 48, ay - 14, 7);
        vine(ax - 10, ay + 8, 4);
        break;
      case 'grab':
        vine(ax + 24, ay - 6, 6);
        vine(ax - 12, ay + 10, 4);
        break;
      case 'clinch':
        vine(ax + 26, ay - 2, 6);
        vine(ax + 22, ay + 8, 6);
        break;
      case 'heave':
        vine(ax + 18, ay - 18, 7);
        vine(ax + 24, ay - 4, 5);
        break;
      case 'dash':
        vine(ax - 14, ay + 6, 5);
        vine(ax + 10, ay + 12, 4);
        break;
      case 'dashBack':
        vine(ax + 16, ay - 2, 5);
        vine(ax - 10, ay + 10, 4);
        break;
      case 'blockHigh':
        vine(ax + 14, ay - 14, 6);
        vine(ax + 10, ay - 4, 5);
        this.p(ctx, ax + 12, ay - 16, 10, 3, pal.specialColor);
        break;
      case 'blockLow':
        vine(ax + 16, ay + 8, 6);
        vine(ax + 10, ay + 2, 5);
        this.p(ctx, ax + 12, ay + 6, 10, 3, pal.specialColor);
        break;
      case 'charge':
        vine(ax - 12, ay + 2, 5);
        vine(ax - 8, ay + 10, 5);
        break;
      case 'thrust':
        vine(ax + 36, ay - 2, 6);
        vine(ax + 32, ay + 8, 5);
        break;
      case 'uppercut':
        this.p(ctx, ax + 2, ay - 30, 10, 3, pal.specialColor);
        this.p(ctx, ax + 4, ay - 20, 6, 12, pal.specialColor);
        vine(ax + 8, ay - 44, 8);
        vine(ax - 12, ay + 10, 4);
        break;
      case 'uppercutRecover':
        vine(ax + 6, ay - 22, 6);
        vine(ax - 12, ay + 10, 4);
        break;
      case 'taunt':
        vine(ax + 18, ay - 20 + sway, 5);
        vine(ax - 16, ay - 18 - sway, 5);
        break;
      case 'victory': {
        const pump = Math.sin(f * Math.PI / 2) * 4;
        vine(ax + 10, ay - 30 - pump, 7);
        vine(ax - 16, ay - 6, 5);
        break;
      }
      default: // guard
        vine(ax + 16, ay - 8, 5);
        vine(ax - 12, ay + 8, 4);
    }
  }

  drawPalmitoOrb(ctx, pal, orb, trail) {
    if (trail) {
      this.p(ctx, orb.x - 36, orb.y - 3, 26, 3, pal.specialColor);
      this.p(ctx, orb.x - 28, orb.y + 3, 18, 3, pal.hairOrHead);
      this.p(ctx, orb.x - 18, orb.y - 6, 10, 3, pal.specialColor);
    }
    // glowing coconut core
    this.p(ctx, orb.x - orb.r, orb.y - orb.r, orb.r * 2, orb.r * 2, pal.claw);
    this.p(ctx, orb.x - orb.r + 2, orb.y - orb.r + 2, orb.r * 2 - 4, orb.r * 2 - 4, pal.specialColor);
    this.p(ctx, orb.x - Math.max(2, orb.r - 4), orb.y - Math.max(2, orb.r - 4),
           Math.max(3, orb.r * 2 - 8), Math.max(3, orb.r * 2 - 8), '#ffffff');
  }

  drawPalmitoHead(ctx, pal, hx, hy, f = 0) {
    // trunk face
    this.p(ctx, hx - 2, hy + 2, 20, 24, pal.primary);
    this.p(ctx, hx - 2, hy + 8, 20, 2, pal.secondary);
    this.p(ctx, hx - 2, hy + 16, 20, 2, pal.secondary);
    // compact frond crown
    this.drawPalmitoCrown(ctx, pal, hx + 8, hy + 4, f, false, 0.4);
    // coconuts peeking out
    this.p(ctx, hx + 0, hy + 2, 5, 5, pal.claw);
    this.p(ctx, hx + 15, hy + 3, 5, 5, pal.claw);
    // face
    this.p(ctx, hx + 4, hy + 8, 5, 5, '#ffffff');
    this.p(ctx, hx + 12, hy + 8, 5, 5, '#ffffff');
    this.p(ctx, hx + 6, hy + 10, 2, 3, '#000000');
    this.p(ctx, hx + 14, hy + 10, 2, 3, '#000000');
    this.p(ctx, hx + 6, hy + 17, 9, 4, '#2d3436');
    this.p(ctx, hx + 8, hy + 17, 3, 2, '#ffffff');
    // leafy headband
    this.p(ctx, hx - 3, hy + 4, 22, 3, pal.headband);
  }

  // =====================================================================
  // POULPI (squid) — dedicated model & animation rig (complete redo)
  // The squid hovers on 4 tentacle legs; 4 more tentacles are its arms.
  // The body pivots at (bx, groundY); legs are drawn in absolute space
  // from the transformed attach points so they always reach the ground.
  // =====================================================================

  drawPoulpiFrame(ctx, pal, animName, f) {
    const groundY = this.frameHeight - 6; // 154
    const bx = this.frameWidth / 2 - 6;    // 114

    let angle = 0, scaleY = 1, lift = 0, hover = 0;
    let armMode = 'guard', legMode = 'stand', orb = null, inkFx = false, jetFx = false;
    const sway = Math.sin(f * 1.5) * 3;

    switch (animName) {
      case 'idle':
        hover = Math.sin(f * Math.PI / 2) * 2;
        break;
      case 'walk':
        hover = Math.abs(Math.sin(f * Math.PI / 2)) * 2;
        angle = (f % 2 === 0 ? 0.06 : -0.06);
        legMode = 'scurry';
        break;
      case 'crouch':
        scaleY = 0.66; legMode = 'bunch';
        break;
      case 'block_low':
        scaleY = 0.66; legMode = 'bunch'; armMode = 'blockLow';
        break;
      case 'jump':
        lift = [8, 20, 10][Math.min(f, 2)]; legMode = 'jet';
        break;
      case 'dash_fwd':
        lift = 3; angle = 0.15; legMode = 'stream'; armMode = 'dash';
        break;
      case 'dash_back':
        lift = 3; angle = -0.15; legMode = 'stream'; armMode = 'dashBack';
        break;
      case 'light_punch':
        if (f === 1) armMode = 'whip';
        break;
      case 'heavy_punch':
        if (f === 1) armMode = 'coil';
        else if (f === 2) { armMode = 'double'; inkFx = true; }
        break;
      case 'light_kick':
        if (f === 1) legMode = 'sweepLow';
        break;
      case 'heavy_kick':
        if (f >= 1 && f <= 2) { legMode = 'sweepHigh'; inkFx = true; }
        break;
      case 'crouch_punch':
        scaleY = 0.66;
        if (f === 1) armMode = 'whipLow';
        break;
      case 'crouch_kick':
        scaleY = 0.66; legMode = 'bunch';
        if (f === 1) legMode = 'sweepLow';
        break;
      case 'jump_punch':
        lift = 16; legMode = 'jet';
        if (f === 1) armMode = 'whipAir';
        break;
      case 'jump_kick':
        lift = 14; angle = 0.12;
        if (f === 1) legMode = 'kickAir';
        break;
      case 'throw':
        if (f === 0) armMode = 'grab';
        else if (f === 1) armMode = 'clinch';
        else { armMode = 'heave'; angle = 0.12; }
        break;
      case 'hadouken':
        if (f <= 1) { armMode = 'charge'; orb = { x: bx - 14, y: groundY - 50, r: 5 + f * 3 }; }
        else { armMode = 'thrust'; orb = { x: bx + 50, y: groundY - 50, r: 11 }; }
        break;
      case 'shoryuken':
        legMode = 'jet';
        if (f === 0) scaleY = 0.75;
        else if (f === 1) { lift = 22; armMode = 'uppercut'; }
        else if (f === 2) { lift = 36; armMode = 'uppercut'; jetFx = true; }
        else { lift = 14; armMode = 'uppercutRecover'; }
        break;
      case 'taunt':
        hover = Math.sin(f * Math.PI / 2) * 3 + 2;
        armMode = 'taunt';
        break;
      case 'hurt_high':
        angle = -0.2; lift = 3;
        break;
      case 'hurt_low':
        scaleY = 0.8; angle = 0.22;
        break;
      case 'block_high':
        armMode = 'blockHigh';
        break;
      case 'knockdown':
        if (f === 0) { angle = -0.7; lift = 16; }
        else if (f === 1) { angle = -1.25; lift = 6; }
        else { angle = -1.57; legMode = 'sprawl'; }
        break;
      case 'defeat':
        angle = -1.57; legMode = 'sprawl';
        break;
      case 'getup':
        if (f === 0) { angle = -0.9; scaleY = 0.85; }
        else if (f === 1) { angle = -0.35; scaleY = 0.92; }
        break;
      case 'victory':
        lift = Math.abs(Math.sin(f * Math.PI / 2)) * 6 + 2;
        armMode = 'victory';
        break;
    }

    const bodyLift = lift + hover;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    // local frame coords -> absolute (screen) coords
    const fwd = (x, y) => ({
      x: bx + (x - bx) * cos - (y - groundY) * scaleY * sin,
      y: groundY - bodyLift + (x - bx) * sin + (y - groundY) * scaleY * cos
    });

    const attach = this.poulpiAttach(bx, groundY);

    // 1. tentacle legs (absolute space: body attach -> ground)
    this.drawPoulpiLegs(ctx, pal, attach.legs, legMode, f, sway, fwd, bx, groundY, jetFx);

    // 2. body + arms under the pose transform
    ctx.save();
    ctx.translate(bx, groundY - bodyLift);
    ctx.rotate(angle);
    ctx.scale(1, scaleY);
    ctx.translate(-bx, -groundY);
    this.drawPoulpiBody(ctx, pal, bx, groundY, f, sway);
    this.drawPoulpiArms(ctx, pal, attach.arms, bx, groundY, armMode, f, sway);
    ctx.restore();

    // 3. hadouken ink orb (absolute space) + ink splash fx
    if (orb) {
      const o = fwd(orb.x, orb.y);
      this.drawPoulpiOrb(ctx, pal, o, armMode === 'thrust');
    }
    if (inkFx) {
      const p1 = fwd(bx + 46, groundY - 52);
      const p2 = fwd(bx + 56, groundY - 44);
      const p3 = fwd(bx + 40, groundY - 40);
      this.p(ctx, p1.x - 4, p1.y - 4, 8, 8, '#14102b');
      this.p(ctx, p2.x - 3, p2.y - 3, 6, 6, pal.specialColor);
      this.p(ctx, p3.x - 2, p3.y - 2, 5, 5, '#14102b');
    }
  }

  poulpiAttach(bx, groundY) {
    const botY = groundY - 38;
    return {
      arms: [
        { x: bx - 10, y: botY - 8 }, { x: bx - 4, y: botY - 4 },
        { x: bx + 4, y: botY - 4 }, { x: bx + 10, y: botY - 8 }
      ],
      legs: [
        { x: bx - 12, y: botY - 2 }, { x: bx - 5, y: botY + 1 },
        { x: bx + 5, y: botY + 1 }, { x: bx + 12, y: botY - 2 }
      ]
    };
  }

  drawTentacle(ctx, pal, x0, y0, x1, y1, sway, w = 4.5, suckers = true) {
    const mx = (x0 + x1) / 2 + sway;
    const my = (y0 + y1) / 2 + 2;
    ctx.strokeStyle = pal.primary;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(mx, my, x1, y1);
    ctx.stroke();
    ctx.lineCap = 'butt';
    if (suckers) {
      // sucker pad mid-tentacle
      const t = 0.55;
      const sx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1;
      const sy = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1;
      this.p(ctx, sx - 2, sy - 2, 4, 4, pal.secondary);
    }
  }

  drawPoulpiLegs(ctx, pal, legs, mode, f, sway, fwd, bx, groundY, jetFx) {
    let feet;      // absolute coords, unless dangle (then local coords)
    let dangle = false;
    switch (mode) {
      case 'scurry': {
        const step = f % 4;
        const l02 = (step === 0 || step === 2) ? 7 : 0;
        const l13 = (step === 1 || step === 3) ? 6 : 0;
        feet = [
          { x: bx - 16, y: groundY - l02 }, { x: bx - 6, y: groundY - l13 },
          { x: bx + 6, y: groundY - l02 }, { x: bx + 16, y: groundY - l13 }
        ];
        break;
      }
      case 'bunch':
        feet = [ { x: bx - 9, y: groundY }, { x: bx - 3, y: groundY }, { x: bx + 3, y: groundY }, { x: bx + 9, y: groundY } ];
        break;
      case 'sweepLow':
        feet = [ { x: bx - 14, y: groundY }, { x: bx + 46, y: groundY, kick: true }, { x: bx + 2, y: groundY - 6 }, { x: bx + 8, y: groundY - 4 } ];
        break;
      case 'sweepHigh':
        feet = [ { x: bx - 16, y: groundY }, { x: bx + 54, y: groundY - 18, kick: true }, { x: bx - 2, y: groundY }, { x: bx + 8, y: groundY - 6 } ];
        break;
      case 'kickAir':
        feet = [ { x: bx - 10, y: groundY - 4 }, { x: bx + 48, y: groundY - 26, kick: true }, { x: bx + 2, y: groundY - 8 }, { x: bx + 10, y: groundY - 10 } ];
        break;
      case 'sprawl':
        feet = [ { x: bx - 26, y: groundY }, { x: bx - 8, y: groundY }, { x: bx + 8, y: groundY }, { x: bx + 26, y: groundY } ];
        break;
      case 'jet':
      case 'stream':
        dangle = true;
        feet = [ { x: bx - 10, y: groundY - 24 }, { x: bx - 2, y: groundY - 18 }, { x: bx + 6, y: groundY - 22 }, { x: bx + 14, y: groundY - 26 } ];
        break;
      default:
        feet = [ { x: bx - 16, y: groundY }, { x: bx - 6, y: groundY }, { x: bx + 6, y: groundY }, { x: bx + 16, y: groundY } ];
    }
    legs.forEach((leg, i) => {
      const start = fwd(leg.x, leg.y);
      const foot = dangle ? fwd(feet[i].x, feet[i].y) : feet[i];
      const sw = Math.sin(f * 1.5 + i * 1.3) * (dangle ? 5 : 3);
      this.drawTentacle(ctx, pal, start.x, start.y, foot.x, foot.y, sw, feet[i].kick ? 6 : 4.5, !feet[i].kick);
      if (feet[i].kick) this.p(ctx, foot.x - 4, foot.y - 4, 9, 8, pal.secondary); // striking sucker pad
      if (jetFx) this.p(ctx, foot.x - 2, foot.y + 2, 5, 4, pal.specialColor);      // jet glow
    });
  }

  drawPoulpiBody(ctx, pal, bx, groundY, f, sway) {
    const tipY = groundY - 96;
    const botY = groundY - 38;
    // lateral steering fins
    ctx.fillStyle = pal.hairOrHead;
    ctx.beginPath();
    ctx.moveTo(bx - 12, tipY + 12);
    ctx.lineTo(bx - 27, tipY + 26 + sway * 0.4);
    ctx.lineTo(bx - 10, tipY + 36);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx + 12, tipY + 12);
    ctx.lineTo(bx + 27, tipY + 26 - sway * 0.4);
    ctx.lineTo(bx + 10, tipY + 36);
    ctx.closePath();
    ctx.fill();
    // mantle (teardrop head-body)
    ctx.fillStyle = pal.primary;
    ctx.beginPath();
    ctx.moveTo(bx, tipY);
    ctx.quadraticCurveTo(bx - 24, tipY + 26, bx - 17, botY - 6);
    ctx.quadraticCurveTo(bx, botY + 8, bx + 17, botY - 6);
    ctx.quadraticCurveTo(bx + 24, tipY + 26, bx, tipY);
    ctx.closePath();
    ctx.fill();
    // belly sheen
    ctx.fillStyle = pal.secondary;
    ctx.beginPath();
    ctx.moveTo(bx - 10, botY - 22);
    ctx.quadraticCurveTo(bx, botY - 12, bx + 10, botY - 22);
    ctx.quadraticCurveTo(bx, botY + 4, bx - 10, botY - 22);
    ctx.closePath();
    ctx.fill();
    // gloss highlight
    this.p(ctx, bx - 12, tipY + 14, 5, 16, 'rgba(255, 255, 255, 0.25)');
    // stealth ninja vest + neon belt
    this.p(ctx, bx - 16, botY - 10, 32, 12, pal.cloth);
    this.p(ctx, bx - 16, botY - 10, 32, 3, pal.belt);
    this.p(ctx, bx - 16, botY + 1, 32, 2, pal.specialColor);
    // cyan headband + fluttering tails
    this.p(ctx, bx - 17, tipY + 22, 34, 5, pal.headband);
    const tw = Math.sin(f * 1.8) * 3;
    this.p(ctx, bx - 27, tipY + 23 + tw, 11, 3, pal.headband);
    this.p(ctx, bx - 25, tipY + 28 - tw, 9, 3, pal.headband);
    // big golden slit eyes
    const ey = tipY + 34;
    this.p(ctx, bx - 11, ey, 9, 8, '#ffffff');
    this.p(ctx, bx + 2, ey, 9, 8, '#ffffff');
    this.p(ctx, bx - 9, ey + 2, 5, 4, pal.eye);
    this.p(ctx, bx + 4, ey + 2, 5, 4, pal.eye);
    this.p(ctx, bx - 9, ey + 3, 5, 2, '#000000'); // horizontal slit
    this.p(ctx, bx + 4, ey + 3, 5, 2, '#000000');
    // determined brows
    this.p(ctx, bx - 12, ey - 3, 10, 2, '#2d3436');
    this.p(ctx, bx + 2, ey - 3, 10, 2, '#2d3436');
    // beak
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.moveTo(bx - 3, botY - 18);
    ctx.lineTo(bx + 3, botY - 18);
    ctx.lineTo(bx, botY - 11);
    ctx.closePath();
    ctx.fill();
  }

  drawPoulpiArms(ctx, pal, arms, bx, groundY, mode, f, sway) {
    const botY = groundY - 38;
    let tips;
    switch (mode) {
      case 'whip':
        tips = [ { x: bx - 8, y: botY }, { x: bx + 58, y: botY - 16, strike: true }, { x: bx + 16, y: botY - 10 }, { x: bx + 8, y: botY + 4 } ];
        break;
      case 'coil':
        tips = [ { x: bx - 16, y: botY - 2 }, { x: bx - 18, y: botY + 6 }, { x: bx + 10, y: botY - 6 }, { x: bx + 4, y: botY + 6 } ];
        break;
      case 'double':
        tips = [ { x: bx + 52, y: botY - 24, strike: true }, { x: bx + 56, y: botY - 8, strike: true }, { x: bx - 10, y: botY }, { x: bx + 10, y: botY + 6 } ];
        break;
      case 'whipLow':
        tips = [ { x: bx - 8, y: botY + 4 }, { x: bx + 46, y: botY + 4, strike: true }, { x: bx + 12, y: botY }, { x: bx + 6, y: botY + 8 } ];
        break;
      case 'whipAir':
        tips = [ { x: bx - 8, y: botY }, { x: bx + 50, y: botY - 22, strike: true }, { x: bx + 12, y: botY - 8 }, { x: bx + 6, y: botY + 4 } ];
        break;
      case 'grab':
        tips = [ { x: bx + 26, y: botY - 12 }, { x: bx + 28, y: botY - 2, strike: true }, { x: bx - 8, y: botY + 2 }, { x: bx + 8, y: botY + 8 } ];
        break;
      case 'clinch':
        tips = [ { x: bx + 30, y: botY - 14 }, { x: bx + 32, y: botY }, { x: bx - 6, y: botY + 4 }, { x: bx + 10, y: botY + 8 } ];
        break;
      case 'heave':
        tips = [ { x: bx + 20, y: botY - 28 }, { x: bx + 26, y: botY - 12 }, { x: bx - 8, y: botY + 2 }, { x: bx + 8, y: botY + 8 } ];
        break;
      case 'dash':
        tips = [ { x: bx - 18, y: botY - 6 }, { x: bx - 12, y: botY + 4 }, { x: bx - 20, y: botY + 8 }, { x: bx - 6, y: botY + 10 } ];
        break;
      case 'dashBack':
        tips = [ { x: bx + 16, y: botY - 8 }, { x: bx + 18, y: botY + 2 }, { x: bx - 8, y: botY + 4 }, { x: bx + 6, y: botY + 8 } ];
        break;
      case 'blockHigh':
        tips = [ { x: bx + 16, y: botY - 26 }, { x: bx + 20, y: botY - 16 }, { x: bx + 12, y: botY - 8 }, { x: bx + 8, y: botY + 2 } ];
        break;
      case 'blockLow':
        tips = [ { x: bx + 18, y: botY + 2 }, { x: bx + 14, y: botY + 8 }, { x: bx + 8, y: botY + 4 }, { x: bx - 6, y: botY + 8 } ];
        break;
      case 'charge':
        tips = [ { x: bx - 12, y: botY - 6 }, { x: bx - 8, y: botY + 2 }, { x: bx + 6, y: botY + 2 }, { x: bx + 2, y: botY + 8 } ];
        break;
      case 'thrust':
        tips = [ { x: bx + 34, y: botY - 10 }, { x: bx + 32, y: botY + 2 }, { x: bx + 36, y: botY - 4 }, { x: bx - 8, y: botY + 4 } ];
        break;
      case 'uppercut':
        tips = [ { x: bx + 6, y: botY - 54, strike: true }, { x: bx - 12, y: botY }, { x: bx + 12, y: botY + 4 }, { x: bx - 6, y: botY + 8 } ];
        break;
      case 'uppercutRecover':
        tips = [ { x: bx + 4, y: botY - 30 }, { x: bx - 12, y: botY }, { x: bx + 10, y: botY + 6 }, { x: bx - 6, y: botY + 8 } ];
        break;
      case 'taunt':
        tips = [ { x: bx - 20, y: botY - 30 + sway }, { x: bx - 6, y: botY - 38 - sway }, { x: bx + 8, y: botY - 36 + sway }, { x: bx + 22, y: botY - 28 - sway } ];
        break;
      case 'victory': {
        const pump = Math.sin(f * Math.PI / 2) * 4;
        tips = [ { x: bx - 14, y: botY - 34 - pump }, { x: bx + 2, y: botY - 42 - pump }, { x: bx + 16, y: botY - 26 - pump }, { x: bx - 4, y: botY + 6 } ];
        break;
      }
      default: // guard
        tips = [ { x: bx - 8, y: botY }, { x: bx + 18, y: botY - 14 }, { x: bx + 24, y: botY - 4 }, { x: bx + 10, y: botY + 6 } ];
    }
    arms.forEach((arm, i) => {
      const t = tips[i];
      const sw = Math.sin(f * 1.5 + i) * 3;
      this.drawTentacle(ctx, pal, arm.x, arm.y, t.x, t.y, sw, t.strike ? 5.5 : 4.5, true);
      if (t.strike) this.p(ctx, t.x - 4, t.y - 4, 9, 9, pal.secondary); // striking sucker tip
    });
    // block shield glow
    if (mode === 'blockHigh') this.p(ctx, bx + 12, botY - 28, 14, 4, pal.specialColor);
    if (mode === 'blockLow') this.p(ctx, bx + 10, botY, 16, 4, pal.specialColor);
    // uppercut jet trail
    if (mode === 'uppercut') {
      this.p(ctx, bx + 2, botY - 44, 8, 3, pal.specialColor);
      this.p(ctx, bx + 4, botY - 32, 5, 14, pal.specialColor);
    }
  }

  drawPoulpiOrb(ctx, pal, orb, trail) {
    if (trail) {
      this.p(ctx, orb.x - 34, orb.y - 4, 14, 4, '#14102b');
      this.p(ctx, orb.x - 26, orb.y + 4, 9, 3, pal.specialColor);
    }
    // dripping ink orb
    this.p(ctx, orb.x - orb.r, orb.y - orb.r, orb.r * 2, orb.r * 2, '#14102b');
    this.p(ctx, orb.x - orb.r + 3, orb.y - orb.r + 2, orb.r * 2 - 6, orb.r * 2 - 6, pal.primary);
    this.p(ctx, orb.x - 2, orb.y + orb.r - 2, 4, 5, '#14102b'); // drip
    // bioluminescent core
    this.p(ctx, orb.x - 3, orb.y - 3, 6, 6, pal.specialColor);
    this.p(ctx, orb.x - 1, orb.y - 1, 3, 3, '#ffffff');
  }

  drawPoulpiHead(ctx, pal, hx, hy, f = 0) {
    const bx = hx + 8;
    const tipY = hy - 12;
    const botY = hy + 16;
    const sway = Math.sin(f * 1.5) * 1.5;
    // lateral fins
    ctx.fillStyle = pal.hairOrHead;
    ctx.beginPath();
    ctx.moveTo(bx - 10, tipY + 10);
    ctx.lineTo(bx - 22, tipY + 20 + sway);
    ctx.lineTo(bx - 8, tipY + 27);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx + 10, tipY + 10);
    ctx.lineTo(bx + 22, tipY + 20 - sway);
    ctx.lineTo(bx + 8, tipY + 27);
    ctx.closePath();
    ctx.fill();
    // mantle
    ctx.fillStyle = pal.primary;
    ctx.beginPath();
    ctx.moveTo(bx, tipY);
    ctx.quadraticCurveTo(bx - 20, tipY + 20, bx - 14, botY - 4);
    ctx.quadraticCurveTo(bx, botY + 6, bx + 14, botY - 4);
    ctx.quadraticCurveTo(bx + 20, tipY + 20, bx, tipY);
    ctx.closePath();
    ctx.fill();
    // cyan headband + tail
    this.p(ctx, bx - 15, tipY + 17, 30, 4, pal.headband);
    this.p(ctx, bx - 23, tipY + 18 + sway, 9, 3, pal.headband);
    // golden slit eyes
    const ey = tipY + 26;
    this.p(ctx, bx - 9, ey, 8, 7, '#ffffff');
    this.p(ctx, bx + 2, ey, 8, 7, '#ffffff');
    this.p(ctx, bx - 7, ey + 2, 4, 3, pal.eye);
    this.p(ctx, bx + 4, ey + 2, 4, 3, pal.eye);
    this.p(ctx, bx - 7, ey + 3, 4, 2, '#000000');
    this.p(ctx, bx + 4, ey + 3, 4, 2, '#000000');
    // beak
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.moveTo(bx - 3, botY - 10);
    ctx.lineTo(bx + 3, botY - 10);
    ctx.lineTo(bx, botY - 4);
    ctx.closePath();
    ctx.fill();
    // mini tentacles
    this.p(ctx, bx - 6, botY + 4, 4, 6, pal.primary);
    this.p(ctx, bx + 3, botY + 4, 4, 6, pal.primary);
    this.p(ctx, bx - 5, botY + 9, 2, 2, pal.secondary);
    this.p(ctx, bx + 4, botY + 9, 2, 2, pal.secondary);
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
    addAnim('dash_fwd', 'dash_fwd', 3, 16, 0);
    addAnim('dash_back', 'dash_back', 3, 16, 0);

    addAnim('light_punch', 'light_punch', 3, 15, 0);
    addAnim('heavy_punch', 'heavy_punch', 4, 12, 0);
    addAnim('light_kick', 'light_kick', 3, 14, 0);
    addAnim('heavy_kick', 'heavy_kick', 4, 11, 0);

    addAnim('crouch_punch', 'crouch_punch', 3, 14, 0);
    addAnim('crouch_kick', 'crouch_kick', 3, 12, 0);

    addAnim('jump_punch', 'jump_punch', 2, 10, 0);
    addAnim('jump_kick', 'jump_kick', 2, 10, 0);

    addAnim('throw', 'throw', 3, 10, 0);
    addAnim('special_hadouken', 'hadouken', 4, 12, 0);
    addAnim('special_shoryuken', 'shoryuken', 4, 12, 0);
    addAnim('taunt', 'taunt', 4, 6, 0);

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
          // Coconut buzzsaw — spinning coconut ringed with leaf blades
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(f * (Math.PI / 4));
          ctx.fillStyle = colorA;
          for (let b = 0; b < 3; b++) {
            const a = (b * Math.PI * 2) / 3;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7);
            ctx.lineTo(Math.cos(a + 0.55) * 17, Math.sin(a + 0.55) * 17);
            ctx.lineTo(Math.cos(a - 0.55) * 17, Math.sin(a - 0.55) * 17);
            ctx.closePath();
            ctx.fill();
          }
          // coconut shell with face dots
          ctx.fillStyle = '#5d4037';
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#3e2723';
          ctx.fillRect(-3, -4, 2, 2);
          ctx.fillRect(2, -4, 2, 2);
          ctx.fillRect(-1, 2, 2, 2);
          ctx.restore();
          // leafy speed lines
          ctx.fillStyle = colorA;
          ctx.fillRect(1, cy - 5, 8, 2);
          ctx.fillRect(0, cy + 3, 10, 2);
        } else if (id === 'squid') {
          // Ink bolt — dripping black ink with a bioluminescent cyan core
          ctx.fillStyle = '#14102b';
          ctx.beginPath();
          ctx.arc(cx, cy, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = colorB;
          ctx.beginPath();
          ctx.arc(cx - 2, cy - 3, 8, 0, Math.PI * 2);
          ctx.fill();
          // drips
          ctx.fillStyle = '#14102b';
          ctx.fillRect(cx - 6, cy + 9, 3, 4 + (f % 2) * 2);
          ctx.fillRect(cx + 3, cy + 10, 3, 3 + (f % 2) * 3);
          // cyan core
          ctx.fillStyle = colorA;
          ctx.beginPath();
          ctx.arc(cx + 1, cy + wobble * 0.5, 5 + (f % 2), 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(cx - 1, cy - 2, 3, 3);
          // trailing bubbles
          ctx.fillStyle = colorA;
          ctx.beginPath();
          ctx.arc(cx - 16, cy - 4 + wobble, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx - 22, cy + 3 - wobble, 2, 0, Math.PI * 2);
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