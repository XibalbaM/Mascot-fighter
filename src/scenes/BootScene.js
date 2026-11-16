import Phaser from 'phaser';
import { SpriteGenerator } from '../gfx/SpriteGenerator.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const loadingText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'SYNTHESIZING ARCADE RETRO TEXTURES...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#ff4757'
    }).setOrigin(0.5);

    // Generate procedural pixel-art sprites and stage elements
    const generator = new SpriteGenerator(this);
    generator.generateAll();

    this.time.delayedCall(200, () => {
      this.scene.start('CharacterSelectScene');
    });
  }
}
