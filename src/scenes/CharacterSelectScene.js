import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { CHARACTERS, CHARACTER_LIST } from '../data/characters.js';
import { soundManager } from '../audio/SoundManager.js';

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  init(data) {
    this.gameMode = data?.gameMode || 'CPU'; // 'CPU', 'PVP', 'TRAINING'
    this.p1Index = 0;
    this.p2Index = 1;
    this.p1Locked = false;
    this.p2Locked = (this.gameMode !== 'PVP');
  }

  create() {
    this.width = GAME_CONFIG.WIDTH;
    this.height = GAME_CONFIG.HEIGHT;

    // 1. Background Visuals
    this.createBackground();

    // 2. Header and Mode Badges
    this.createHeader();

    // 3. Fighter Cards & Stat Panels (Left: P1, Right: P2/CPU)
    this.createPlayerCard('p1', 190, 270);
    this.createPlayerCard('p2', this.width - 190, 270);

    // 4. Center Character Select Grid
    this.createRosterGrid();

    // 5. Start Battle Action Button
    this.createStartButton();

    // 6. Keyboard & Input Handling
    this.setupInputs();

    // Initial visual sync
    this.updatePreview('p1');
    this.updatePreview('p2');
    this.updateCursors();
  }

  createBackground() {
    const W = this.width;
    const H = this.height;

    // Dark cyber arcade background
    const bg = this.add.rectangle(0, 0, W, H, 0x0c0b1e).setOrigin(0);

    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x1e1838, 0.4);

    // Grid lines
    for (let x = 0; x < W; x += 40) {
      graphics.beginPath();
      graphics.moveTo(x, 0);
      graphics.lineTo(x, H);
      graphics.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      graphics.beginPath();
      graphics.moveTo(0, y);
      graphics.lineTo(W, y);
      graphics.stroke();
    }

    // Vignette overlay
    const vig = this.add.graphics();
    vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.6, 0.6, 0.9, 0.9);
    vig.fillRect(0, 0, W, H);
  }

  createHeader() {
    const W = this.width;

    // Title Banner
    this.add.text(W / 2, 28, 'SELECT YOUR FIGHTER', {
      fontFamily: '"Teko", sans-serif',
      fontSize: '44px',
      color: '#ffa502',
      fontStyle: 'bold'
    }).setOrigin(0.5).setStroke('#ff4757', 4).setShadow(0, 0, '#ff4757', 12);

    // Mode Selector Pills
    const modeContainer = this.add.container(W / 2, 68);
    const modes = [
      { key: 'CPU', label: 'P1 vs CPU' },
      { key: 'PVP', label: '2 PLAYERS LOCAL' },
      { key: 'TRAINING', label: 'TRAINING DUMMY' }
    ];

    this.modeButtons = [];
    let startX = -170;

    modes.forEach((m, idx) => {
      const btnBg = this.add.rectangle(startX + idx * 170, 0, 150, 24, 0x1e1f26).setOrigin(0.5);
      btnBg.setStrokeStyle(1.5, 0x57606f);
      btnBg.setInteractive({ useHandCursor: true });

      const btnTxt = this.add.text(startX + idx * 170, 0, m.label, {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: '#ced6e0'
      }).setOrigin(0.5);

      btnBg.on('pointerdown', () => {
        soundManager.unlock();
        soundManager.playSelectMove();
        this.gameMode = m.key;
        this.p2Locked = (this.gameMode !== 'PVP');
        this.updateModeUI();
      });

      this.modeButtons.push({ key: m.key, bg: btnBg, txt: btnTxt });
      modeContainer.add([btnBg, btnTxt]);
    });

    this.updateModeUI();
  }

  updateModeUI() {
    this.modeButtons.forEach(btn => {
      const active = (btn.key === this.gameMode);
      btn.bg.setFillStyle(active ? 0xff4757 : 0x1e1f26);
      btn.bg.setStrokeStyle(1.5, active ? 0xffa502 : 0x57606f);
      btn.txt.setColor(active ? '#ffffff' : '#ced6e0');
    });

    // Update P2 badge
    if (this.p2Badge) {
      this.p2Badge.setText(this.gameMode === 'PVP' ? 'PLAYER 2' : (this.gameMode === 'TRAINING' ? 'TRAINING DUMMY' : 'CPU OPPONENT'));
    }
  }

  createPlayerCard(playerKey, x, y) {
    const isP1 = (playerKey === 'p1');
    const container = this.add.container(x, y);

    // Card Background Panel
    const cardW = 320;
    const cardH = 380;
    const bg = this.add.rectangle(0, 0, cardW, cardH, 0x120f20, 0.9).setOrigin(0.5);
    bg.setStrokeStyle(2, isP1 ? 0xff4757 : 0x00d2d3, 0.8);
    container.add(bg);

    // Header Badge ("PLAYER 1" / "CPU OPPONENT")
    const badgeBg = this.add.rectangle(0, -cardH / 2 + 16, cardW - 16, 26, isP1 ? 0xff4757 : 0x00d2d3).setOrigin(0.5);
    const badgeTxt = this.add.text(0, -cardH / 2 + 16, isP1 ? 'PLAYER 1' : 'CPU OPPONENT', {
      fontFamily: '"Press Start 2P"',
      fontSize: '11px',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add([badgeBg, badgeTxt]);
    if (!isP1) this.p2Badge = badgeTxt;

    // Platform for sprite preview
    const platform = this.add.ellipse(0, -50, 110, 22, 0x000000, 0.7);
    platform.setStrokeStyle(1.5, isP1 ? 0xff4757 : 0x00d2d3, 0.6);
    container.add(platform);

    // Animated Sprite Preview (first roster character until updatePreview picks the real one)
    const sprite = this.add.sprite(0, -56, `${CHARACTER_LIST[0].id}_idle_0`);
    sprite.setScale(isP1 ? 2.4 : -2.4, 2.4);
    sprite.setOrigin(0.5, 0.88);
    container.add(sprite);

    // Character Name
    const nameTxt = this.add.text(0, -10, 'REX', {
      fontFamily: '"Teko", sans-serif',
      fontSize: '38px',
      fontStyle: 'bold',
      color: isP1 ? '#ff4757' : '#00d2d3'
    }).setOrigin(0.5).setStroke('#000', 3);
    container.add(nameTxt);

    // Character Subtitle / Archetype
    const titleTxt = this.add.text(0, 16, 'THE CRIMSON BRAWLER', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#ffa502'
    }).setOrigin(0.5);
    container.add(titleTxt);

    // Stats Section Background Box
    const statBoxY = 40;
    const statW = 280;
    const statsBg = this.add.rectangle(0, statBoxY + 54, statW, 116, 0x0a0815, 0.95).setOrigin(0.5);
    statsBg.setStrokeStyle(1, 0x3d3558);
    container.add(statsBg);

    // Stat Bars Definitions: HP, DEFENSE, OFFENSE, SPEED, ATTACK SPEED
    const statDefinitions = [
      { key: 'hp', label: 'HP', max: 130, color: 0x2ed573 },
      { key: 'defense', label: 'DEFENSE', max: 100, color: 0x1e90ff },
      { key: 'offense', label: 'OFFENSE', max: 100, color: 0xff4757 },
      { key: 'speed', label: 'SPEED', max: 100, color: 0xffa502 },
      { key: 'attackSpeed', label: 'ATK SPEED', max: 100, color: 0x00d2d3 }
    ];

    const statRows = {};
    statDefinitions.forEach((s, idx) => {
      const rowY = statBoxY + 12 + idx * 21;

      // Label
      const lbl = this.add.text(-statW / 2 + 12, rowY, s.label, {
        fontFamily: '"Press Start 2P"',
        fontSize: '7.5px',
        color: '#ced6e0'
      }).setOrigin(0, 0.5);

      // Bar Background
      const barX = 14;
      const barW = 120;
      const barH = 10;
      const barBg = this.add.rectangle(barX, rowY, barW, barH, 0x221d36).setOrigin(0, 0.5);
      barBg.setStrokeStyle(1, 0x4b4369);

      // Value Fill Bar
      const fillBar = this.add.rectangle(barX, rowY, 0, barH, s.color).setOrigin(0, 0.5);

      // Numeric Value Text
      const valTxt = this.add.text(barX + barW + 10, rowY, '0', {
        fontFamily: '"Press Start 2P"',
        fontSize: '7px',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      container.add([lbl, barBg, fillBar, valTxt]);
      statRows[s.key] = { fillBar, valTxt, max: s.max, barW };
    });

    // Special Moves / Description Tag
    const specialTxt = this.add.text(0, cardH / 2 - 20, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      color: '#a4b0be',
      align: 'center'
    }).setOrigin(0.5);
    container.add(specialTxt);

    if (isP1) {
      this.p1Card = { container, sprite, nameTxt, titleTxt, specialTxt, statRows };
    } else {
      this.p2Card = { container, sprite, nameTxt, titleTxt, specialTxt, statRows };
    }
  }

  createRosterGrid() {
    const W = this.width;
    const gridY = 405;
    const container = this.add.container(W / 2, gridY);

    // Background shelf
    const shelfBg = this.add.rectangle(0, 0, 240, 100, 0x120f24, 0.9).setOrigin(0.5);
    shelfBg.setStrokeStyle(2, 0x57606f);
    container.add(shelfBg);

    const title = this.add.text(0, -38, 'ROSTER SELECTION', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#ffa502'
    }).setOrigin(0.5);
    container.add(title);

    this.portraitSlots = [];

    // Active Characters Slots
    const totalSlots = 2; // Rex, Sparky (expandable as more characters are added)
    const slotSpacing = 82;
    const startX = -((totalSlots - 1) * slotSpacing) / 2;

    CHARACTER_LIST.forEach((char, idx) => {
      const slotX = startX + idx * slotSpacing;
      const slotY = 8;

      // Portrait Image
      const img = this.add.image(slotX, slotY, `portrait_${char.id}`).setOrigin(0.5);
      img.setDisplaySize(70, 70);
      img.setInteractive({ useHandCursor: true });

      img.on('pointerdown', () => {
        soundManager.unlock();
        if (!this.p1Locked) {
          this.p1Index = idx;
          soundManager.playSelectMove();
          this.updatePreview('p1');
          this.updateCursors();
        } else if (this.gameMode === 'PVP' && !this.p2Locked) {
          this.p2Index = idx;
          soundManager.playSelectMove();
          this.updatePreview('p2');
          this.updateCursors();
        } else {
          // If in CPU/Training mode, allow clicking to set opponent
          this.p2Index = idx;
          soundManager.playSelectMove();
          this.updatePreview('p2');
          this.updateCursors();
        }
      });

      container.add(img);
      this.portraitSlots.push({ idx, x: slotX, y: slotY, charId: char.id, img });
    });

    // P1 Selector Box (Red/Gold Frame)
    this.p1Cursor = this.add.rectangle(0, 0, 76, 76).setOrigin(0.5);
    this.p1Cursor.setStrokeStyle(3, 0xff4757);
    const p1Tag = this.add.text(-24, -42, 'P1', {
      fontFamily: '"Press Start 2P"',
      fontSize: '9px',
      color: '#ffffff',
      backgroundColor: '#ff4757',
      padding: { x: 4, y: 2 }
    });
    this.p1CursorContainer = this.add.container(0, 0, [this.p1Cursor, p1Tag]);
    container.add(this.p1CursorContainer);

    // P2 Selector Box (Blue/Cyan Frame)
    this.p2Cursor = this.add.rectangle(0, 0, 76, 76).setOrigin(0.5);
    this.p2Cursor.setStrokeStyle(3, 0x00d2d3);
    const p2Tag = this.add.text(10, -42, 'P2', {
      fontFamily: '"Press Start 2P"',
      fontSize: '9px',
      color: '#ffffff',
      backgroundColor: '#00d2d3',
      padding: { x: 4, y: 2 }
    });
    this.p2CursorContainer = this.add.container(0, 0, [this.p2Cursor, p2Tag]);
    container.add(this.p2CursorContainer);
  }

  createStartButton() {
    const W = this.width;
    const btnY = 500;

    this.startBtn = this.add.rectangle(W / 2, btnY, 280, 38, 0xff4757).setOrigin(0.5);
    this.startBtn.setStrokeStyle(2, 0xffa502);
    this.startBtn.setInteractive({ useHandCursor: true });

    this.startTxt = this.add.text(W / 2, btnY, '★ START BATTLE ★', {
      fontFamily: '"Teko", sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setStroke('#000', 3);

    // Pulsing effect
    this.tweens.add({
      targets: [this.startBtn, this.startTxt],
      scaleX: 1.05,
      scaleY: 1.05,
      yoyo: true,
      repeat: -1,
      duration: 700,
      ease: 'Sine.easeInOut'
    });

    this.startBtn.on('pointerdown', () => {
      this.confirmStart();
    });
  }

  updatePreview(playerKey) {
    const isP1 = (playerKey === 'p1');
    const idx = isP1 ? this.p1Index : this.p2Index;
    const char = CHARACTER_LIST[idx] || CHARACTER_LIST[0];
    const card = isP1 ? this.p1Card : this.p2Card;

    // Name & Title
    card.nameTxt.setText(char.name);
    card.nameTxt.setColor(char.avatarColor || (isP1 ? '#ff4757' : '#00d2d3'));
    card.titleTxt.setText(char.title);
    card.specialTxt.setText(char.specials.join(' • '));

    // Sprite Animation
    card.sprite.play(`${char.id}_idle`, true);

    // Animate Stat Bars (HP, Defense, Offense, Speed, Attack Speed)
    Object.keys(card.statRows).forEach(statKey => {
      const row = card.statRows[statKey];
      const val = char.stats[statKey] || 0;
      const targetWidth = row.barW * Math.min(1.0, (val / row.max));

      row.valTxt.setText(`${val}`);

      this.tweens.add({
        targets: row.fillBar,
        width: targetWidth,
        duration: 300,
        ease: 'Cubic.easeOut'
      });
    });
  }

  updateCursors() {
    const p1Slot = this.portraitSlots[this.p1Index];
    if (p1Slot) {
      this.p1CursorContainer.setPosition(p1Slot.x, p1Slot.y);
    }

    const p2Slot = this.portraitSlots[this.p2Index];
    if (p2Slot) {
      this.p2CursorContainer.setPosition(p2Slot.x, p2Slot.y);
    }
  }

  setupInputs() {
    this.input.keyboard.on('keydown', (e) => {
      soundManager.unlock();

      // P1 Navigation (A / D)
      if (e.code === 'KeyA') {
        this.p1Index = (this.p1Index - 1 + CHARACTER_LIST.length) % CHARACTER_LIST.length;
        soundManager.playSelectMove();
        this.updatePreview('p1');
        this.updateCursors();
      } else if (e.code === 'KeyD') {
        this.p1Index = (this.p1Index + 1) % CHARACTER_LIST.length;
        soundManager.playSelectMove();
        this.updatePreview('p1');
        this.updateCursors();
      }

      // P2 Navigation (Arrows Left / Right)
      if (e.code === 'ArrowLeft') {
        this.p2Index = (this.p2Index - 1 + CHARACTER_LIST.length) % CHARACTER_LIST.length;
        soundManager.playSelectMove();
        this.updatePreview('p2');
        this.updateCursors();
      } else if (e.code === 'ArrowRight') {
        this.p2Index = (this.p2Index + 1) % CHARACTER_LIST.length;
        soundManager.playSelectMove();
        this.updatePreview('p2');
        this.updateCursors();
      }

      // Confirm / Start Battle (Space / Enter / J / Num1)
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyJ') {
        this.confirmStart();
      }
    });
  }

  confirmStart() {
    soundManager.unlock();
    soundManager.playSelectConfirm();

    const p1Char = CHARACTER_LIST[this.p1Index].id;
    const p2Char = CHARACTER_LIST[this.p2Index].id;

    // Flash screen and transition to BattleScene
    this.cameras.main.flash(300, 255, 255, 255);

    this.time.delayedCall(350, () => {
      this.scene.start('BattleScene', {
        p1CharId: p1Char,
        p2CharId: p2Char,
        gameMode: this.gameMode
      });
    });
  }
}
