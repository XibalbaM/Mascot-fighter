import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';

export class CameraController {
  constructor(scene) {
    this.scene = scene;
    this.cam = scene.cameras.main;
    this.stageWidth = GAME_CONFIG.STAGE_WIDTH;
    this.screenWidth = GAME_CONFIG.WIDTH;
    this.screenHeight = GAME_CONFIG.HEIGHT;

    // Set camera bounds
    this.cam.setBounds(0, 0, this.stageWidth, this.screenHeight);
  }

  update(p1, p2) {
    // Calculate midpoint between fighters
    const midX = (p1.x + p2.x) / 2;
    const distX = Math.abs(p1.x - p2.x);

    // Keep camera focused smoothly on midpoint
    const targetScrollX = midX - this.screenWidth / 2;
    const clampedScrollX = Phaser.Math.Clamp(targetScrollX, 0, this.stageWidth - this.screenWidth);

    // Smooth lerp
    this.cam.scrollX = Phaser.Math.Linear(this.cam.scrollX, clampedScrollX, 0.12);

    // Dynamic zoom based on fighter separation
    let targetZoom = 1.0;
    if (distX > 580) {
      targetZoom = Math.max(0.85, 1.0 - ((distX - 580) / 1200));
    }
    this.cam.zoom = Phaser.Math.Linear(this.cam.zoom, targetZoom, 0.08);
  }
}
