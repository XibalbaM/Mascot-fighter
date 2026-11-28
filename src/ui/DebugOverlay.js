export class DebugOverlay {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(90);

    // Frame data debug text
    this.debugText = scene.add.text(14, 85, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#00ff00',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 6, y: 4 }
    }).setScrollFactor(0).setDepth(91).setVisible(false);
  }

  toggle() {
    this.visible = !this.visible;
    this.graphics.clear();
    this.debugText.setVisible(this.visible);
  }

  update(p1, p2, projectiles) {
    if (!this.visible) {
      this.graphics.clear();
      return;
    }

    this.graphics.clear();

    // Draw fighters boxes
    this.drawFighterBoxes(p1);
    this.drawFighterBoxes(p2);

    // Draw projectile hitboxes
    projectiles.forEach(p => {
      const hb = p.getHitbox();
      if (hb) {
        this.graphics.lineStyle(2, 0xff0000, 1.0);
        this.graphics.fillStyle(0xff0000, 0.35);
        this.graphics.fillRect(hb.x, hb.y, hb.w, hb.h);
        this.graphics.strokeRect(hb.x, hb.y, hb.w, hb.h);
      }
    });

    // Update text data
    const p1Hb = p1.getActiveHitbox();
    const distX = Math.round(Math.abs(p1.x - p2.x));
    this.debugText.setText(
      `[DEBUG HITBOX VIEW - PRESS P TO HIDE]\n` +
      `DIST: ${distX}px\n` +
      `P1 [${p1.state}] HP:${p1.health} EX:${Math.floor(p1.superMeter)}% ATK:${p1.currentAttack?.animKey || 'none'}\n` +
      `P2 [${p2.state}] HP:${p2.health} EX:${Math.floor(p2.superMeter)}% ATK:${p2.currentAttack?.animKey || 'none'}`
    );
  }

  drawFighterBoxes(fighter) {
    // 1. Pushbox (Yellow)
    const pb = fighter.getPushBox();
    this.graphics.lineStyle(2, 0xf1c40f, 0.9);
    this.graphics.strokeRect(pb.x, pb.y, pb.w, pb.h);

    // 2. Hurtboxes (Green)
    const hurtboxes = fighter.getHurtBoxes();
    this.graphics.lineStyle(1.5, 0x2ecc71, 0.9);
    this.graphics.fillStyle(0x2ecc71, 0.2);
    hurtboxes.forEach(hb => {
      this.graphics.fillRect(hb.x, hb.y, hb.w, hb.h);
      this.graphics.strokeRect(hb.x, hb.y, hb.w, hb.h);
    });

    // 3. Active Hitbox (Red)
    const hitbox = fighter.getActiveHitbox();
    if (hitbox) {
      this.graphics.lineStyle(2, 0xe74c3c, 1.0);
      this.graphics.fillStyle(0xe74c3c, 0.45);
      this.graphics.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
      this.graphics.strokeRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
    }

    // 4. Character Pivot Point (Cyan dot)
    this.graphics.fillStyle(0x00d2d3, 1.0);
    this.graphics.fillCircle(fighter.x, fighter.y, 4);
  }
}
