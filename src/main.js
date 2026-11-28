import Phaser from 'phaser';
import { GAME_CONFIG } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { soundManager } from './audio/SoundManager.js';

const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  backgroundColor: '#0a0914',
  input: {
    activePointers: 5, // multi-touch so the virtual arcade pad supports several simultaneous buttons
  },
  scene: [BootScene, CharacterSelectScene, BattleScene]
};

window.addEventListener('DOMContentLoaded', () => {
  const game = new Phaser.Game(phaserConfig);
  window.__MASCOT_FIGHTER_GAME__ = game;

  const unlockAudio = () => {
    soundManager.unlock();
    ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(evt => {
      window.removeEventListener(evt, unlockAudio);
    });
  };

  ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(evt => {
    window.addEventListener(evt, unlockAudio);
  });
});
