// Determinism tests for the fixed-tick sim (docs/NETCODE.md §9.1 / §10).
// Run with: npm test   (node --test tests/)
//
// The sim-path classes (Fighter, CombatSystem, Projectile, InputManager,
// AIController) are driven headless with a mocked Phaser scene, exactly like
// BattleScene.simTick() does, and we assert the properties lockstep netcode
// depends on: same seed + same inputs => identical state, snapshot/restore
// fidelity, and no wall-clock / unseeded-random / Math.pow in the sim path.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

globalThis.window = { addEventListener() {}, removeEventListener() {} };

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const { TICK_MS, TICK_RATE, MOTION_WINDOW_TICKS } = await import(`${SRC}/sim/constants.js`);
const { createRNG } = await import(`${SRC}/sim/rng.js`);
const { Fighter } = await import(`${SRC}/entities/Fighter.js`);
const { CombatSystem } = await import(`${SRC}/systems/CombatSystem.js`);
const { InputManager } = await import(`${SRC}/systems/InputManager.js`);
const { AIController } = await import(`${SRC}/systems/AIController.js`);
const { Projectile } = await import(`${SRC}/entities/Projectile.js`);
const { GAME_CONFIG } = await import(`${SRC}/config.js`);

// ---------------------------------------------------------------- harness --

function mkStub() {
  const s = { anims: { currentAnim: null, stop() {}, pause() {}, resume() {} }, x: 0, y: 0 };
  for (const m of ['setScale', 'setOrigin', 'play', 'setAlpha', 'setPosition', 'destroy', 'setDepth', 'once', 'setTexture'])
    s[m] = () => s;
  return s;
}

function makeHarness(seed) {
  const projectiles = [];
  const scene = {
    add: { sprite: () => mkStub(), ellipse: () => mkStub() },
    cameras: { main: { flash() {}, shake() {} } },
    particleManager: { spawnDust() {}, spawnHitSpark() {}, spawnBlockSpark() {}, spawnSuperAura() {}, spawnFireballLaunch() {} },
    ui: { showDamageText() {}, showBanner() {} },
    pendingKOs: [],
    spawnProjectile(owner, x, y, dir) { projectiles.push(new Projectile(scene, owner, x, y, dir)); },
    triggerKO(loser) { scene.pendingKOs.push(loser); },
  };
  const combat = new CombatSystem(scene);
  scene.combatSystem = combat;
  const im = new InputManager(scene);
  const ai = new AIController(createRNG(seed));
  const p1 = new Fighter(scene, GAME_CONFIG.STAGE_WIDTH / 2 - 160, GAME_CONFIG.GROUND_Y, 'dragon', 1, true);
  const p2 = new Fighter(scene, GAME_CONFIG.STAGE_WIDTH / 2 + 160, GAME_CONFIG.GROUND_Y, 'phoenix', -1, false);
  p1.setOpponent(p2);
  p2.setOpponent(p1);
  return { scene, combat, im, ai, p1, p2, projectiles, tick: 0, sawAttack: false, sawProjectile: false };
}

// Scripted P1 keyboard input, applied once per tick before im.update().
function applyP1Script(h, t) {
  const key = (code, down) => {
    if (down && !h.im.keyState[code]) h.im._onKeyDown({ code, repeat: false, preventDefault() {} });
    if (!down && h.im.keyState[code]) h.im._onKeyUp({ code });
  };
  const tap = (code, at) => { if (t === at) key(code, true); if (t === at + 1) key(code, false); };

  key('KeyD', t < 120);                       // walk forward
  tap('KeyJ', 30);                            // light punch
  tap('KeyU', 60);                            // heavy punch
  tap('KeyO', 90);                            // raw fireball button
  key('KeyS', t >= 150 && t < 156);           // QCF: down...
  key('KeyD', t >= 153 && t < 165);           // ...down-forward...
  tap('KeyJ', 162);                           // ...+ punch -> motion fireball
  tap('KeyW', 200);                           // jump
  tap('KeyK', 205);                           // air kick
  key('KeyA', t >= 260 && t < 320);           // walk back (guard)
  tap('KeyL', 340);                           // uppercut
  tap('Space', 400);                          // super
}

// One 60 Hz sim step, mirroring BattleScene.simTick().
function step(h) {
  applyP1Script(h, h.tick);
  h.im.update(TICK_MS, h.p1, h.p2, 'CPU');
  h.ai.update(TICK_MS, h.p2, h.p1, 'CPU');
  const frozen = h.combat.update(TICK_MS, h.p1, h.p2, h.projectiles);
  if (!frozen) {
    h.p1.update(TICK_MS);
    h.p2.update(TICK_MS);
    for (let i = h.projectiles.length - 1; i >= 0; i--) {
      h.projectiles[i].update(TICK_MS);
      if (h.projectiles[i].isDead) h.projectiles.splice(i, 1);
    }
  }
  if (h.p1.currentAttack || h.p2.currentAttack) h.sawAttack = true;
  if (h.projectiles.length > 0) h.sawProjectile = true;
  h.scene.pendingKOs.length = 0;
  h.tick++;
}

// ------------------------------------------- canonical hash (FNV-1a-32) ----

function canon(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

function pick(h) {
  const hb = (b) => b ? { x: b.x, y: b.y, w: b.w, h: b.h, damage: b.damage, hitstop: b.hitstop, hitstun: b.hitstun, blockstun: b.blockstun, knockbackX: b.knockbackX, knockbackY: b.knockbackY, attackType: b.attackType, isKnockdown: b.isKnockdown, isSuper: !!b.isSuper } : null;
  const pf = (f) => ({
    x: f.x, y: f.y, vx: f.vx, vy: f.vy, facing: f.facing, state: f.state,
    health: f.health, superMeter: f.superMeter, wins: f.wins,
    isGrounded: f.isGrounded, isCrouching: f.isCrouching, isBlocking: f.isBlocking, isInvincible: f.isInvincible,
    hitstunTimer: f.hitstunTimer, blockstunTimer: f.blockstunTimer, invincibilityTimer: f.invincibilityTimer,
    stateTimer: f.stateTimer, comboCounter: f.comboCounter, lungeVx: f.lungeVx,
    currentAttack: f.currentAttack, activeHitbox: hb(f.activeHitbox), input: { ...f.input },
  });
  return {
    tick: h.tick, rng: h.ai.rng.state(), hitstop: h.combat.hitstopRemaining,
    imTick: h.im.tick, pressBuffer: { ...h.im.pressBuffer },
    p1hist: h.im.p1History.map(e => ({ ...e })), p2hist: h.im.p2History.map(e => ({ ...e })),
    p1: pf(h.p1), p2: pf(h.p2),
    projectiles: h.projectiles.map(p => ({ x: p.x, y: p.y, direction: p.direction, damage: p.damage, isDead: p.isDead })),
  };
}
const hashOf = (h) => fnv1a(canon(pick(h)));

function run(seed, ticks, snapshotAt = -1) {
  const h = makeHarness(seed);
  let snap = null;
  for (let t = 0; t < ticks; t++) {
    step(h);
    if (t + 1 === snapshotAt) snap = structuredClone(pick(h));
  }
  return { h, hash: hashOf(h), snap };
}

function restore(h, snap) {
  const rf = (f, s) => Object.assign(f, {
    x: s.x, y: s.y, vx: s.vx, vy: s.vy, facing: s.facing, state: s.state,
    health: s.health, superMeter: s.superMeter, wins: s.wins,
    isGrounded: s.isGrounded, isCrouching: s.isCrouching, isBlocking: s.isBlocking, isInvincible: s.isInvincible,
    hitstunTimer: s.hitstunTimer, blockstunTimer: s.blockstunTimer, invincibilityTimer: s.invincibilityTimer,
    stateTimer: s.stateTimer, comboCounter: s.comboCounter, lungeVx: s.lungeVx,
    currentAttack: s.currentAttack, activeHitbox: s.activeHitbox, input: { ...s.input },
  });
  rf(h.p1, snap.p1); rf(h.p2, snap.p2);
  h.tick = snap.tick; h.combat.hitstopRemaining = snap.hitstop; h.im.tick = snap.imTick;
  h.ai.rng.setState(snap.rng);
  h.im.pressBuffer = { ...snap.pressBuffer };
  h.im.p1History = snap.p1hist.map(e => ({ ...e }));
  h.im.p2History = snap.p2hist.map(e => ({ ...e }));
  h.projectiles.length = 0;
  for (const p of snap.projectiles) {
    const proj = new Projectile(h.scene, h.p1, p.x, p.y, p.direction);
    proj.damage = p.damage; proj.isDead = p.isDead;
    h.projectiles.push(proj);
  }
}

// ------------------------------------------------------------------ tests --

const SEED = 0xC0FFEE;
const TICKS = 10000; // 166 s of sim — matches the §10 verification gate scale

test('constants: fixed 60 Hz tick', () => {
  assert.equal(TICK_RATE, 60);
  assert.equal(TICK_MS, 1000 / 60);
});

test('determinism: same seed + inputs, two 10k-tick runs -> identical hash', () => {
  const A = run(SEED, TICKS);
  const B = run(SEED, TICKS);
  assert.equal(A.hash, B.hash);
  assert.ok(A.h.sawAttack, 'scripted inputs should produce attacks');
  assert.ok(A.h.sawProjectile, 'scripted inputs should spawn a fireball');
});

test('seed sensitivity: different seed -> different hash', () => {
  const A = run(SEED, TICKS);
  const E = run(SEED + 1, TICKS);
  assert.notEqual(E.hash, A.hash);
});

test('snapshot mid-run then continue -> identical final hash', () => {
  const A = run(SEED, TICKS);
  const C = run(SEED, TICKS, 5000);
  assert.ok(C.snap, 'snapshot taken');
  assert.equal(C.hash, A.hash);
});

test('restore(snapshot) mid-run then continue -> identical final hash', () => {
  const A = run(SEED, TICKS);
  const h = makeHarness(SEED);
  for (let t = 0; t < 5000; t++) step(h);
  restore(h, structuredClone(pick(h)));
  for (let t = 5000; t < TICKS; t++) step(h);
  assert.equal(hashOf(h), A.hash);
});

test('input history is tick-based and capped at MOTION_WINDOW_TICKS', () => {
  const h = makeHarness(SEED);
  for (let t = 0; t < 100; t++) step(h);
  for (const hist of [h.im.p1History, h.im.p2History]) {
    assert.ok(hist.every(e => Number.isInteger(e.tick)));
    assert.ok(hist.length <= MOTION_WINDOW_TICKS);
  }
});

test('mulberry32: same seed same sequence, state snapshot/restore continues it', () => {
  const r1 = createRNG(42), r2 = createRNG(42);
  assert.deepEqual([r1(), r1(), r1()], [r2(), r2(), r2()]);
  const r3 = createRNG(1); r3();
  const r4 = createRNG(0); r4.setState(r3.state());
  assert.equal(r3(), r4());
});

test('sim path is free of wall-clock / unseeded random / Math.pow', () => {
  // The files that make up the simulation path today (they move under
  // src/sim/ in the extraction step, where the same ban is enforced by contract).
  const simPathFiles = [
    'entities/Fighter.js',
    'entities/Projectile.js',
    'systems/CombatSystem.js',
    'systems/InputManager.js',
    'systems/AIController.js',
    'scenes/BattleScene.js',
    'sim/constants.js',
    'sim/rng.js',
  ];
  const banned = [/Date\.now\s*\(/, /performance\.now\s*\(/, /Math\.random\s*\(/, /Math\.pow\s*\(/, /setTimeout\s*\(/, /setInterval\s*\(/];
  for (const rel of simPathFiles) {
    const src = readFileSync(join(SRC, rel), 'utf8');
    // strip comments so prose mentions don't trip the scan
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    for (const re of banned) {
      assert.ok(!re.test(code), `${rel} contains banned call ${re}`);
    }
  }
});
