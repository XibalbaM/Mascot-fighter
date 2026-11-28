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

  update(p1, p2, dt = 16.667) {
    // Calculate midpoint between fighters
    const midX = (p1.x + p2.x) / 2;
    const distX = Math.abs(p1.x - p2.x);

    // Keep camera focused smoothly on midpoint.
    // The clamp accounts for zoom: at zoom < 1 the visible world width is
    // screenWidth / zoom, so clamping with the raw screen width would let the
    // camera show the void past the stage edge.
    const targetScrollX = midX - this.screenWidth / 2;
    const maxScrollX = Math.max(0, this.stageWidth - this.screenWidth / this.cam.zoom);
    const clampedScrollX = Phaser.Math.Clamp(targetScrollX, 0, maxScrollX);

    // Smooth lerp, dt-scaled so it behaves the same at any frame rate
    const k = 1 - Math.pow(1 - 0.12, dt / 16.667);
    this.cam.scrollX = Phaser.Math.Linear(this.cam.scrollX, clampedScrollX, k);

    // Dynamic zoom based on fighter separation
    let targetZoom = 1.0;
    if (distX > 580) {
      targetZoom = Math.max(0.85, 1.0 - ((distX - 580) / 1200));
    }
    const kz = 1 - Math.pow(1 - 0.08, dt / 16.667);
    this.cam.zoom = Phaser.Math.Linear(this.cam.zoom, targetZoom, kz);
  }
}
