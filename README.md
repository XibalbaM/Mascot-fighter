# 🥊 Mascot Fighter - 2D Street Fighter-Style Engine in Phaser

A responsive 2D Street Fighter-style arcade fighting game built for the browser using **Phaser 4** and **Vite**.

---

## 🎮 Features

- **Classic Fighting Game Mechanics**:
  - **Auto-Facing**: Grounded fighters automatically face each other.
  - **High / Mid / Low Guards**: 
    - Hold **Back** to block High & Mid strikes.
    - Hold **Down-Back** to block Low strikes & sweeps.
    - Overheads (jump attacks) beat crouch guards; Low sweeps beat standing guards.
    - Chip damage & blockstun on successful guard with deflect sparks.
  - **Hitstop (Impact Freeze)**: Micro-freeze frames on hits and blocks for punchy contact impact.
  - **Combos & Canceling**: Normal attacks can be canceled into Special Moves (Hadouken / Shoryuken) or Super Moves upon connecting!
  - **Juggle & Knockdown**: Heavy sweeps and Dragon Uppercuts knock down the opponent, with ground bounces, prone state, and invincible wakeups.
  - **Projectiles & Clashes**: Hadouken energy spheres travel across the screen and clash/neutralize when meeting opposing fireballs.
  - **Super Meter / EX Gauge**: Meter builds by attacking and guarding. Reaching 100% unleashes a cinematic screen-flash Super Move!
  - **Hitbox & Hurtbox Visualizer**: Press `H` to toggle live collision wireframes (Green = Hurtboxes, Red = Hitboxes, Yellow = Pushboxes).

- **Character Selector & Fighter Stats**:
  - Full arcade character selection scene before battle with real-time animated previews.
  - Interactive stat gauges and radar values for each fighter:
    - **HP**: Fighter's maximum health pool.
    - **DEFENSE**: Damage mitigation and block effectiveness.
    - **OFFENSE**: Attack damage output and combo damage scaling.
    - **SPEED**: Movement speed and footsies walk pace.
    - **ATTACK SPEED**: Frame startup speed and recovery snappiness.
  - Easily extensible roster configured in `src/data/characters.js`.
  - Press <kbd>ESC</kbd> during battle to return to the Character Selection screen.

- **Fighters (Initial Roster)**:
  1. **Rex (The Crimson Brawler)**: Heavyweight dragon martial artist (HP: 110, Def: 78, Off: 84, Spd: 62, Atk Spd: 68).
  2. **Sparky (The Azure Thunder)**: Agile cyber-fox brawler (HP: 90, Def: 58, Off: 74, Spd: 94, Atk Spd: 92).

- **Game Modes**:
  - **Player 1 vs CPU**: Intelligent AI that spaces, pokes, jumps, blocks, anti-airs, and unleashes super attacks.
  - **2 Players Local**: Play head-to-head on the same keyboard.
  - **Training Dummy**: Practice combos with configurable dummy (Stand, Crouch, Auto-Block).

- **Retro Arcade Presentation**:
  - Parallax scrolling twilight cityscape & pagoda arena.
  - Street Fighter-style HUD with trailing yellow damage recovery bars, 99s timer, round win gems, and combo counter.
  - Announcer banners: *ROUND 1*, *FIGHT!*, *K.O.!*, *PERFECT!*, *CHAMPION!*.
  - Procedural 16-bit Web Audio synthesizer (punches, kicks, energy whooshes, metallic blocks, and booming KO impact).
  - CRT arcade scanline filter overlay (toggleable).
  - Virtual On-Screen Arcade Pad for touch and mobile testing.

---

## 🕹️ Controls

### Player 1 (Rex)
| Action | Key |
|---|---|
| **Move / Block** | <kbd>A</kbd> / <kbd>D</kbd> (Hold away from opponent to Guard) |
| **Jump** | <kbd>W</kbd> |
| **Crouch** | <kbd>S</kbd> (Hold <kbd>S</kbd> + Back for Low Guard) |
| **Light Punch** | <kbd>J</kbd> |
| **Heavy Punch** | <kbd>U</kbd> |
| **Light Kick** | <kbd>K</kbd> |
| **Heavy Kick / Sweep** | <kbd>I</kbd> |
| **Special: Fireball (Hadouken)** | <kbd>O</kbd> *(or motion: `↓ ↘ → + Punch`)* |
| **Special: Uppercut (Shoryuken)** | <kbd>L</kbd> *(or motion: `→ ↓ ↘ + Punch`)* |
| **SUPER MOVE (100% EX)** | <kbd>Space</kbd> |

### Player 2 / Local PVP (Sparky)
| Action | Key / Numpad | Secondary Key |
|---|---|---|
| **Move / Block** | <kbd>←</kbd> / <kbd>→</kbd> | — |
| **Jump** | <kbd>↑</kbd> | — |
| **Crouch** | <kbd>↓</kbd> | — |
| **Light Punch** | <kbd>Num 1</kbd> | <kbd>B</kbd> |
| **Heavy Punch** | <kbd>Num 4</kbd> | <kbd>G</kbd> |
| **Light Kick** | <kbd>Num 2</kbd> | <kbd>N</kbd> |
| **Heavy Kick / Sweep** | <kbd>Num 5</kbd> | <kbd>H</kbd> |
| **Special: Spark Ball** | <kbd>Num 6</kbd> | <kbd>Y</kbd> |
| **Special: Somersault Kick** | <kbd>Num 3</kbd> | <kbd>T</kbd> |
| **SUPER MOVE** | <kbd>Enter</kbd> | — |

### Global Shortcuts
- <kbd>H</kbd> : Toggle Hitbox / Hurtbox Debug Viewer
- <kbd>R</kbd> : Instant Match Reset

---

## 🚀 Running Locally

```bash
# Install dependencies
pnpm install

# Start the Vite development server
pnpm dev

# Or build and preview production bundle
pnpm build
pnpm preview
```

---

## 🏗️ Project Architecture

```
Mascot-fighter/
├── index.html                   # Arcade cabinet shell, control layout, CRT overlay
├── package.json                 # Dependencies (phaser, vite)
├── vite.config.js               # Vite configuration
└── src/
    ├── main.js                  # Phaser.Game initialization
    ├── config.js                # Game balance, frame data, speeds, and key bindings
    ├── audio/
    │   └── SoundManager.js      # Procedural 16-bit Web Audio sound synthesizer
    ├── gfx/
    │   └── SpriteGenerator.js   # Procedural canvas sprite generation for fighters & stage
    ├── entities/
    │   ├── Fighter.js           # Finite state machine, physics, hitboxes, hurtboxes, combos
    │   ├── Projectile.js        # Energy projectiles and clash resolution
    │   └── ParticleManager.js   # Hit sparks, block shields, dust puffs, super aura
    ├── systems/
    │   ├── CombatSystem.js      # Pushbox separation, attack collision, hitstop freeze
    │   ├── InputManager.js      # Edge triggers, virtual pad, motion buffer (QCF, DP)
    │   ├── AIController.js      # Footsies, anti-air, spacing, and reaction guard
    │   └── CameraController.js  # Midpoint tracking, smooth lerping, dynamic zoom
    ├── ui/
    │   ├── HUD.js               # Street Fighter-style health bars, EX meter, timer, banners
    │   ├── DebugOverlay.js      # Hitbox / hurtbox visualizer with frame telemetry
    │   └── VirtualControls.js   # Virtual on-screen arcade buttons for touch/mouse
    └── scenes/
        ├── BootScene.js         # Texture generation and game startup
        └── BattleScene.js       # Match coordination and round loop
```
