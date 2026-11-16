import { GAME_CONFIG } from '../config.js';

export class VirtualControls {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(150);
    this.container.setVisible(false);

    this.createControls();
  }

  toggle() {
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
  }

  createControls() {
    const H = GAME_CONFIG.HEIGHT;
    const vInput = this.scene.inputManager.virtualInput;

    // Helper to create responsive button
    const makeBtn = (x, y, w, h, label, color, onDown, onUp) => {
      const bg = this.scene.add.rectangle(x, y, w, h, color, 0.65).setOrigin(0.5);
      bg.setStrokeStyle(2, 0xffffff, 0.8);
      bg.setInteractive({ useHandCursor: true });

      const txt = this.scene.add.text(x, y, label, {
        fontFamily: '"Press Start 2P"',
        fontSize: '10px',
        color: '#ffffff'
      }).setOrigin(0.5);

      bg.on('pointerdown', () => {
        bg.setFillStyle(color, 0.95);
        onDown();
      });

      const release = () => {
        bg.setFillStyle(color, 0.65);
        onUp();
      };

      bg.on('pointerup', release);
      bg.on('pointerout', release);

      this.container.add([bg, txt]);
    };

    // D-Pad (Left side)
    const dpadX = 110;
    const dpadY = H - 90;
    const btnSize = 44;

    // Up (Jump)
    makeBtn(dpadX, dpadY - btnSize, btnSize, btnSize, '▲', 0x2f3542, () => vInput.up = true, () => vInput.up = false);
    // Down (Crouch)
    makeBtn(dpadX, dpadY + btnSize, btnSize, btnSize, '▼', 0x2f3542, () => vInput.down = true, () => vInput.down = false);
    // Left (Back)
    makeBtn(dpadX - btnSize, dpadY, btnSize, btnSize, '◀', 0x2f3542, () => vInput.left = true, () => vInput.left = false);
    // Right (Forward)
    makeBtn(dpadX + btnSize, dpadY, btnSize, btnSize, '▶', 0x2f3542, () => vInput.right = true, () => vInput.right = false);

    // Action Buttons (Right side - 6 Button Arcade Layout + Super)
    const actX = GAME_CONFIG.WIDTH - 190;
    const actY = H - 120;
    const bW = 46;
    const bH = 38;

    // Top Row: LP, HP, Fireball
    makeBtn(actX, actY, bW, bH, 'LP', 0x0984e3, () => vInput.lightPunch = true, () => vInput.lightPunch = false);
    makeBtn(actX + 54, actY, bW, bH, 'HP', 0x0984e3, () => vInput.heavyPunch = true, () => vInput.heavyPunch = false);
    makeBtn(actX + 108, actY, bW, bH, 'FB', 0xe17055, () => vInput.fireball = true, () => vInput.fireball = false);

    // Bottom Row: LK, HK, Uppercut
    makeBtn(actX, actY + 46, bW, bH, 'LK', 0x00b894, () => vInput.lightKick = true, () => vInput.lightKick = false);
    makeBtn(actX + 54, actY + 46, bW, bH, 'HK', 0x00b894, () => vInput.heavyKick = true, () => vInput.heavyKick = false);
    makeBtn(actX + 108, actY + 46, bW, bH, 'DP', 0xd63031, () => vInput.uppercut = true, () => vInput.uppercut = false);

    // Super Button (Center Bottom)
    makeBtn(actX + 54, actY + 92, 154, 30, '★ SUPER MOVE ★', 0xf1c40f, () => vInput.super = true, () => vInput.super = false);
  }
}
