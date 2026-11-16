import { soundManager } from '../audio/SoundManager.js';
import { GAME_CONFIG } from '../config.js';

export class Projectile {
  constructor(scene, owner, x, y, direction) {
    this.scene = scene;
    this.owner = owner;
    this.x = x;
    this.y = y;
    this.direction = direction; // 1 or -1
    this.speed = 460;
    this.damage = 16;
    this.isDead = false;

    // Sprite — use character-specific projectile animation
    const animKey = `${owner.charId}_projectile_fly`;
    const initTex = `${owner.charId}_projectile_0`;
    this.sprite = scene.add.sprite(x, y, initTex);
    this.sprite.setScale(1.8 * direction, 1.8);
    this.sprite.play(animKey);

    // Hitbox dimensions
    this.width = 36;
    this.height = 24;
  }

  update(dt) {
    if (this.isDead) return;

    const delta = dt / 1000;
    this.x += this.direction * this.speed * delta;
    this.sprite.setPosition(this.x, this.y);

    // Out of arena bounds
    if (this.x < 20 || this.x > GAME_CONFIG.STAGE_WIDTH - 20) {
      this.destroy();
    }
  }

  getHitbox() {
    if (this.isDead) return null;
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      w: this.width,
      h: this.height,
      damage: this.damage,
      hitstop: GAME_CONFIG.HITSTOP.LIGHT,
      hitstun: 260,
      blockstun: 180,
      knockbackX: 180,
      knockbackY: 0,
      attackType: 'mid',
      isKnockdown: false,
      attacker: this.owner,
      isProjectile: true
    };
  }

  onHit(blocked) {
    this.destroy();
  }

  clash() {
    // Both projectiles neutralized!
    soundManager.playBlock();
    this.scene.particleManager.spawnHitSpark(this.x, this.y);
    this.destroy();
  }

  destroy() {
    if (this.isDead) return;
    this.isDead = true;
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
