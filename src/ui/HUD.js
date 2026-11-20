import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';

export class HUD {
  constructor(scene) {
    this.scene = scene;
    this.width = GAME_CONFIG.WIDTH;
    this.height = GAME_CONFIG.HEIGHT;

    // HUD Container fixed to screen (scrollFactor 0)
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(100);

    // Health bar animation catch-up values
    this.p1LagHealth = scene.p1?.maxHealth || 100;
    this.p2LagHealth = scene.p2?.maxHealth || 100;

    this.createElements();
  }

  createElements() {
    const W = this.width;
    const p1 = this.scene.p1;
    const p2 = this.scene.p2;
    const p1Color = p1?.charConfig?.avatarColor || '#ff4757';
    const p2Color = p2?.charConfig?.avatarColor || '#00d2d3';

    // 1. TOP HEADER BAR
    // P1 Name
    this.p1Name = this.scene.add.text(35, 14, p1?.name || 'PLAYER 1', {
      fontFamily: '"Teko", sans-serif',
      fontSize: '28px',
      color: p1Color,
      fontStyle: 'bold'
    }).setStroke('#000', 4);
    this.container.add(this.p1Name);

    // P2 Name
    this.p2Name = this.scene.add.text(W - 35, 14, p2?.name || 'PLAYER 2', {
      fontFamily: '"Teko", sans-serif',
      fontSize: '28px',
      color: p2Color,
      fontStyle: 'bold'
    }).setOrigin(1, 0).setStroke('#000', 4);
    this.container.add(this.p2Name);

    // Health Bar Backgrounds (Dark frames)
    const barWidth = 360;
    const barHeight = 22;
    const barY = 44;

    // P1 Health Background & Borders
    this.p1BarBg = this.scene.add.rectangle(35, barY, barWidth, barHeight, 0x1e1f26).setOrigin(0, 0.5);
    this.p1BarBg.setStrokeStyle(3, 0xffffff);
    this.container.add(this.p1BarBg);

    // P1 Yellow Lag Bar (Catch-up)
    this.p1LagBar = this.scene.add.rectangle(35, barY, barWidth, barHeight, 0xf1c40f).setOrigin(0, 0.5);
    this.container.add(this.p1LagBar);

    // P1 Current Health Bar
    this.p1HealthBar = this.scene.add.rectangle(35, barY, barWidth, barHeight, 0x2ed573).setOrigin(0, 0.5);
    this.container.add(this.p1HealthBar);

    // P2 Health Background & Borders (Mirrored right-to-left)
    this.p2BarBg = this.scene.add.rectangle(W - 35, barY, barWidth, barHeight, 0x1e1f26).setOrigin(1, 0.5);
    this.p2BarBg.setStrokeStyle(3, 0xffffff);
    this.container.add(this.p2BarBg);

    // P2 Yellow Lag Bar
    this.p2LagBar = this.scene.add.rectangle(W - 35, barY, barWidth, barHeight, 0xf1c40f).setOrigin(1, 0.5);
    this.container.add(this.p2LagBar);

    // P2 Current Health Bar
    this.p2HealthBar = this.scene.add.rectangle(W - 35, barY, barWidth, barHeight, 0x2ed573).setOrigin(1, 0.5);
    this.container.add(this.p2HealthBar);

    // 2. ROUND WIN MARKERS (Golden Dots)
    this.p1RoundMarkers = [];
    for (let i = 0; i < GAME_CONFIG.ROUNDS_TO_WIN; i++) {
      const dot = this.scene.add.circle(40 + i * 18, 64, 5, 0x57606f);
      dot.setStrokeStyle(1.5, 0xffffff);
      this.container.add(dot);
      this.p1RoundMarkers.push(dot);
    }

    this.p2RoundMarkers = [];
    for (let i = 0; i < GAME_CONFIG.ROUNDS_TO_WIN; i++) {
      const dot = this.scene.add.circle(W - 40 - i * 18, 64, 5, 0x57606f);
      dot.setStrokeStyle(1.5, 0xffffff);
      this.container.add(dot);
      this.p2RoundMarkers.push(dot);
    }

    // 3. CENTER ARCADE TIMER
    this.timerBg = this.scene.add.rectangle(W / 2, 42, 64, 46, 0x130f1c, 0.9).setOrigin(0.5);
    this.timerBg.setStrokeStyle(3, 0xffa502);
    this.container.add(this.timerBg);

    this.timerText = this.scene.add.text(W / 2, 42, '99', {
      fontFamily: '"Teko", sans-serif',
      fontSize: '44px',
      color: '#ffa502',
      fontStyle: 'bold'
    }).setOrigin(0.5).setStroke('#000', 4);
    this.container.add(this.timerText);

    // 4. SUPER / EX METERS (Bottom corners)
    const superW = 280;
    const superH = 16;
    const superY = this.height - 24;

    // P1 Super
    this.p1SuperBg = this.scene.add.rectangle(35, superY, superW, superH, 0x1e1f26).setOrigin(0, 0.5);
    this.p1SuperBg.setStrokeStyle(2, 0x747d8c);
    this.container.add(this.p1SuperBg);

    this.p1SuperBar = this.scene.add.rectangle(35, superY, 0, superH, 0x3498db).setOrigin(0, 0.5);
    this.container.add(this.p1SuperBar);

    this.p1SuperLabel = this.scene.add.text(38, superY - 18, 'EX GAUGE', {
      fontFamily: '"Press Start 2P"',
      fontSize: '9px',
      color: '#3498db'
    });
    this.container.add(this.p1SuperLabel);

    // P2 Super
    this.p2SuperBg = this.scene.add.rectangle(W - 35, superY, superW, superH, 0x1e1f26).setOrigin(1, 0.5);
    this.p2SuperBg.setStrokeStyle(2, 0x747d8c);
    this.container.add(this.p2SuperBg);

    this.p2SuperBar = this.scene.add.rectangle(W - 35 - superW, superY, 0, superH, 0x3498db).setOrigin(0, 0.5);
    this.container.add(this.p2SuperBar);

    this.p2SuperLabel = this.scene.add.text(W - 38, superY - 18, 'EX GAUGE', {
      fontFamily: '"Press Start 2P"',
      fontSize: '9px',
      color: '#3498db'
    }).setOrigin(1, 0);
    this.container.add(this.p2SuperLabel);

    // 5. ANNOUNCER BANNER TEXT ("FIGHT!", "K.O.", "ROUND 1")
    this.banner = this.scene.add.text(W / 2, this.height * 0.38, '', {
      fontFamily: '"Teko", sans-serif',
      fontSize: '84px',
      fontStyle: 'bold',
      color: '#ff4757',
      align: 'center'
    }).setOrigin(0.5).setStroke('#ffffff', 6).setShadow(0, 0, '#000000', 8).setAlpha(0);
    this.container.add(this.banner);

    // Sub-banner ("PLAYER 1 WINS", "PERFECT")
    this.subBanner = this.scene.add.text(W / 2, this.height * 0.52, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '18px',
      color: '#ffa502'
    }).setOrigin(0.5).setStroke('#000', 4).setAlpha(0);
    this.container.add(this.subBanner);

    // 6. COMBO COUNTERS
    this.p1ComboText = this.scene.add.text(50, 110, '', {
      fontFamily: '"Teko", sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ff4757'
    }).setStroke('#ffffff', 4).setAlpha(0);
    this.container.add(this.p1ComboText);

    this.p2ComboText = this.scene.add.text(W - 50, 110, '', {
      fontFamily: '"Teko", sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#00d2d3'
    }).setOrigin(1, 0).setStroke('#ffffff', 4).setAlpha(0);
    this.container.add(this.p2ComboText);
  }

  update(p1, p2, roundTime) {
    const barWidth = 360;

    // Update Timer
    const tVal = Math.max(0, Math.ceil(roundTime));
    this.timerText.setText(tVal < 10 ? `0${tVal}` : `${tVal}`);
    if (tVal <= 10) {
      this.timerText.setColor('#ff4757');
    } else {
      this.timerText.setColor('#ffa502');
    }

    // Health calculation
    const p1Ratio = Math.max(0, p1.health / p1.maxHealth);
    const p2Ratio = Math.max(0, p2.health / p2.maxHealth);

    this.p1HealthBar.width = barWidth * p1Ratio;
    this.p2HealthBar.width = barWidth * p2Ratio;

    // Health bar color shifts (Green -> Yellow -> Red)
    this.p1HealthBar.fillColor = (p1Ratio > 0.5) ? 0x2ed573 : (p1Ratio > 0.25) ? 0xffa502 : 0xff4757;
    this.p2HealthBar.fillColor = (p2Ratio > 0.5) ? 0x2ed573 : (p2Ratio > 0.25) ? 0xffa502 : 0xff4757;

    // Catch-up lag bar easing
    this.p1LagHealth = Phaser.Math.Linear(this.p1LagHealth, p1.health, 0.05);
    this.p2LagHealth = Phaser.Math.Linear(this.p2LagHealth, p2.health, 0.05);
    this.p1LagBar.width = barWidth * (this.p1LagHealth / p1.maxHealth);
    this.p2LagBar.width = barWidth * (this.p2LagHealth / p2.maxHealth);

    // Round Win Dots
    this.p1RoundMarkers.forEach((dot, idx) => {
      dot.setFillStyle(idx < p1.wins ? 0xffa502 : 0x57606f);
    });
    this.p2RoundMarkers.forEach((dot, idx) => {
      dot.setFillStyle(idx < p2.wins ? 0xffa502 : 0x57606f);
    });

    // Super / EX Meters
    const superW = 280;
    const p1SuperRatio = p1.superMeter / p1.maxSuper;
    const p2SuperRatio = p2.superMeter / p2.maxSuper;

    this.p1SuperBar.width = superW * p1SuperRatio;
    this.p2SuperBar.width = superW * p2SuperRatio;

    if (p1.superMeter >= 100) {
      this.p1SuperBar.fillColor = 0xf1c40f;
      this.p1SuperLabel.setText('★ MAX SUPER ★');
      this.p1SuperLabel.setColor('#f1c40f');
    } else {
      this.p1SuperBar.fillColor = 0x3498db;
      this.p1SuperLabel.setText(`EX: ${Math.floor(p1.superMeter)}%`);
      this.p1SuperLabel.setColor('#3498db');
    }

    if (p2.superMeter >= 100) {
      this.p2SuperBar.fillColor = 0xf1c40f;
      this.p2SuperLabel.setText('★ MAX SUPER ★');
      this.p2SuperLabel.setColor('#f1c40f');
    } else {
      this.p2SuperBar.fillColor = 0x3498db;
      this.p2SuperLabel.setText(`EX: ${Math.floor(p2.superMeter)}%`);
      this.p2SuperLabel.setColor('#3498db');
    }

    // Combo text updates
    if (p1.comboCounter >= 2) {
      this.p1ComboText.setText(`${p1.comboCounter} HITS!`);
      this.p1ComboText.setAlpha(1.0);
    } else {
      this.p1ComboText.setAlpha(Phaser.Math.Linear(this.p1ComboText.alpha, 0, 0.1));
    }

    if (p2.comboCounter >= 2) {
      this.p2ComboText.setText(`${p2.comboCounter} HITS!`);
      this.p2ComboText.setAlpha(1.0);
    } else {
      this.p2ComboText.setAlpha(Phaser.Math.Linear(this.p2ComboText.alpha, 0, 0.1));
    }
  }

  showBanner(text, subText = '', color = '#ff4757', duration = 1200) {
    this.banner.setText(text);
    this.banner.setColor(color);
    this.banner.setScale(0.3);
    this.banner.setAlpha(0);

    this.subBanner.setText(subText);
    this.subBanner.setAlpha(0);

    // Dramatic arcade pop-in tween
    this.scene.tweens.add({
      targets: this.banner,
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 1,
      duration: 250,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (subText) {
          this.subBanner.setAlpha(1);
        }

        this.scene.time.delayedCall(duration, () => {
          this.scene.tweens.add({
            targets: [this.banner, this.subBanner],
            alpha: 0,
            scaleY: 0.5,
            duration: 300,
            ease: 'Power2'
          });
        });
      }
    });
  }

  showDamageText(worldX, worldY, damage, combo) {
    // Floating damage numbers in world space
    const txt = this.scene.add.text(worldX, worldY, `-${damage}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: combo > 1 ? '16px' : '12px',
      color: combo > 1 ? '#ff4757' : '#ffffff'
    }).setOrigin(0.5).setStroke('#000', 3).setDepth(25);

    this.scene.tweens.add({
      targets: txt,
      y: worldY - 35,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 500,
      ease: 'Power1',
      onComplete: () => txt.destroy()
    });
  }
}
