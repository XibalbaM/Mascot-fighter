export class ParticleManager {
  constructor(scene) {
    this.scene = scene;
  }

  spawnHitSpark(x, y) {
    const spark = this.scene.add.sprite(x, y, 'fx_hit_spark_0');
    spark.setScale(1.6);
    spark.setDepth(15);
    spark.play('fx_hit_spark_anim');
    spark.once('animationcomplete', () => {
      spark.destroy();
    });
  }

  spawnBlockSpark(x, y) {
    const spark = this.scene.add.sprite(x, y, 'fx_block_spark_0');
    spark.setScale(1.5);
    spark.setDepth(15);
    spark.play('fx_block_spark_anim');
    spark.once('animationcomplete', () => {
      spark.destroy();
    });
  }

  spawnDust(x, y) {
    const dust = this.scene.add.sprite(x, y - 6, 'fx_dust_0');
    dust.setScale(1.5);
    dust.setDepth(5);
    dust.play('fx_dust_anim');
    dust.once('animationcomplete', () => {
      dust.destroy();
    });
  }

  spawnSuperAura(x, y, tintColor = 0xff4757) {
    // Rings expanding from fighter on super activation
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 70, () => {
        const ring = this.scene.add.circle(x, y - 40, 20, tintColor, 0.7);
        ring.setStrokeStyle(4, 0xffffff);
        ring.setDepth(12);

        this.scene.tweens.add({
          targets: ring,
          scaleX: 4.5,
          scaleY: 4.5,
          alpha: 0,
          duration: 350,
          ease: 'Cubic.easeOut',
          onComplete: () => ring.destroy()
        });
      });
    }
  }

  spawnFireballLaunch(x, y, direction, tintColor = 0xffa502) {
    const ring = this.scene.add.circle(x, y, 8, tintColor, 0.8);
    ring.setStrokeStyle(3, 0xffffff);
    ring.setDepth(12);
    this.scene.tweens.add({
      targets: ring,
      x: x + direction * 14,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 250,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });
  }
}
