# NETCODE — design pin (v1)

Status: **pinned skeleton**. This document is the contract for the online-play
work (WebRTC DataChannel + small signaling server). The refactor described here
(fixed-tick pure simulation) must land **before** any networking code.

Decisions below are final unless marked `[tune]`. Change them only by editing
this doc first.

---

## 1. Approach

- **Lockstep simulation**, fixed **60 Hz** tick. Both peers run the exact same
  simulation and advance tick `T` only when both input frames for `T` are known.
- **Input delay: 2 ticks** (`[tune]` 2–4) — local inputs are sent for
  `tick + INPUT_DELAY_TICKS` so they arrive before they are needed.
- No host authority: both clients simulate everything; inputs are the only
  thing exchanged (plus periodic checksums).
- **Rollback is a possible v2**, but only after the sim is deterministic.
  Do not build rollback now.
- Rendering shows the latest simulated tick (no interpolation in v1).

Non-goals for v1: reconnection/migration, spectators, matchmaking (room codes
only), anti-cheat, cross-platform (browsers only).

---

## 2. Hard constants

Live in `src/sim/constants.js` (new). Single source of truth:

| Constant | Value | Notes |
|---|---|---|
| `TICK_RATE` | `60` | Hz |
| `TICK_MS` | `1000 / 60` | derived |
| `INPUT_DELAY_TICKS` | `2` | `[tune]` 2–4 |
| `PRESS_BUFFER_TICKS` | `3` | presses during hitstop stay valid this long |
| `MOTION_WINDOW_TICKS` | `24` | QCF/DP history window (was 400 ms) |
| `CHECKSUM_INTERVAL_TICKS` | `60` | send state hash every second of sim |
| `MAX_MESSAGE_BYTES` | `16384` | signaling + datachannel cap |
| `ROOM_CODE` | 4 chars, `A-Z` minus `O/I/0/1` | signaling room code |

Gameplay balance numbers stay in `src/config.js` (`GAME_CONFIG`).

---

## 3. Sim purity contract (the determinism rules)

`src/sim/**` is a **pure, deterministic, serializable** module:

- May import: other `src/sim/**` modules, `src/config.js`, `src/data/characters.js`.
- Must **never** import: `phaser`, `SoundManager`, anything touching
  `window`/`document`/`Date`.
- **Banned in sim code**: `Date.now`, `performance.now`, `Math.random`,
  `Math.pow`, `Math.sin/cos/tan/atan2`, `Math.sqrt`, `JSON.parse/stringify` in
  the hot path. (`+ - * /`, `Math.max/min`, `Math.floor/abs`, `parseInt` are
  IEEE-754-exact and safe.) Instead: precompute per-tick constants (e.g.
  friction decay for exactly one 60 Hz tick), use integer math where possible.
- All time is **ticks**, never milliseconds/wall-clock.
- All randomness via the sim RNG: `mulberry32`, whose 32-bit state is part of
  the snapshot (`state.rng`).
- Side effects (particles, sfx, camera shake, banners) are **never executed
  in sim** — the sim pushes typed events into `state.events[]`; the presentation
  layer drains them once per tick.
- Sim state is plain data (objects/arrays/numbers/strings/booleans). Snapshots
  are `structuredClone(state)`; hashing is FNV-1a-32 over a canonical JSON
  stringify (keys sorted). Used for tests + desync checks.

Contributor checklist for any new gameplay feature: *no clock, no random, no
Phaser, no side effects in `src/sim/` — if you need any of those, add it to the
presentation layer or the event queue.*

---

## 4. Target architecture

```
src/
├── config.js                  # balance constants (unchanged, sim-safe)
├── data/characters.js         # roster (sim-safe)
├── sim/                       # NEW — pure deterministic simulation (no Phaser)
│   ├── constants.js           # table in §2
│   ├── rng.js                 # mulberry32
│   ├── input.js               # input bitfield codec + edge/buffer logic (per tick)
│   ├── motion.js              # numpad history, QCF/DP detection in ticks
│   ├── fighter.js             # FighterState + stepFighter (from entities/Fighter.js)
│   ├── projectile.js          # ProjectileState + step (from entities/Projectile.js)
│   ├── combat.js              # hit resolution, pushboxes, hitstop (from CombatSystem.js)
│   ├── match.js               # MatchState: phases, rounds, timer, KO flow — all in ticks
│   └── serialize.js           # snapshot/restore + canonical stringify + hashState
├── input/                     # local device → bitfields
│   └── LocalInputSource.js    # from systems/InputManager.js (keeps window listeners + destroy())
├── ai/
│   └── AISource.js            # from systems/AIController.js, emits bitfields, uses sim RNG
├── net/                       # NEW — online play
│   ├── protocol.js            # versioned message schemas (§6)
│   ├── NetLoop.js             # fixed-tick lockstep driver (§7)
│   ├── Peer.js                # RTCPeerConnection + DataChannel wrapper
│   └── SignalingClient.js     # WebSocket client to server/ (§8)
├── view/                      # Phaser presentation of sim state
│   └── FighterView.js         # sprite + shadow + animation mapping (from Fighter.js view parts)
├── scenes/
│   ├── BattleScene.js         # becomes: create view, feed inputs, step sim, drain events
│   └── ...                    # BootScene, CharacterSelectScene (+ online room UI)
├── ui/                        # HUD, DebugOverlay, VirtualControls (unchanged)
└── main.js                    # wiring; adds online menu entry
server/                        # NEW — standalone signaling server (own package.json, `ws` only)
tests/                         # node --test: determinism, snapshot, codec, protocol
```

### Sim state shape (v1)

```ts
MatchState {
  version: 1,
  tick: number,
  rng: number,                    // mulberry32 state
  phase: 'intro' | 'fighting' | 'roundOver' | 'matchOver',
  phaseEndTick: number,           // when current phase ends (tick-based, replaces delayedCall)
  round: number,
  wins: [number, number],
  timerTicks: number,             // round timer in ticks (was seconds)
  hitstopTicks: number,
  fighters: [FighterState, FighterState],
  projectiles: [ProjectileState],
  events: [SimEvent],             // drained by presentation each tick
}

FighterState {
  charId, x, y, vx, vy, facing, isGrounded, isCrouching,
  state: 'IDLE'|..., health, maxHealth, superMeter, wins,
  hitstunTicks, blockstunTicks, invincibilityTicks, stateTicks,
  comboCounter, currentAttack: {...} | null, activeHitbox: {...} | null,
  canCancelIntoSpecial, lungeVx,
  dirHistory: number[],           // last MOTION_WINDOW_TICKS numpad codes
  pressTick: { LP: tick, ... },   // last tick each button was pressed (buffer)
}
```

`SimEvent` examples: `{t:'hit', x, y, dmg, combo, heavy}`, `{t:'block', x, y}`,
`{t:'ko', loser}`, `{t:'roundStart', n}`, `{t:'fireball', x, y, dir, color}`,
`{t:'super', x, y, color}`, `{t:'banner', ...}`, `{t:'dust', x, y}`.

---

## 5. Input model (critical change)

Today inputs are sampled **per rendered frame** with wall-clock edge detection —
two clients at 60 Hz vs 144 Hz would produce different input streams. New model:

- `LocalInputSource` samples the keyboard/virtual pad **once per tick** into an
  11-bit integer (`bits`), sent immediately for tick `tick + INPUT_DELAY_TICKS`:

  | bit | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
  |---|---|---|---|---|---|---|---|---|---|---|---|
  | meaning | up | down | left | right | LP | HP | LK | HK | fireball | uppercut | super |

- **Edges are computed inside the sim**, per tick: `just(b) = bits(t) has b && bits(t-1) doesn't`.
- **Press buffer** for hitstop: sim records `pressTick[b]` when a button edge
  arrives; the press stays valid for `PRESS_BUFFER_TICKS` ticks.
- **Motions (QCF/DP) are computed inside the sim** from `dirHistory` (numpad
  code derived from held left/right/down + facing), window `MOTION_WINDOW_TICKS`.
  Sequences: QCF = `2,3,6`, DP = `6,2,3` (subsequence match, as today).
- Remote player = `RemoteInputSource`: a map `tick → bits` filled from the
  DataChannel. `AISource` produces bitfields locally (seeded RNG) so CPU mode
  keeps working through the same interface.

---

## 6. Protocol (pinned)

All messages are JSON objects with a `v` (protocol version, `1`) and `t` (type).
Max size `MAX_MESSAGE_BYTES`; anything larger is dropped + connection closed.

### 6a. Client ↔ client, over one ordered reliable DataChannel (label `"game"`)

```jsonc
// host → guest, once the channel opens. seed decides RNG; chars are roster ids.
{"v":1,"t":"hello","seed":305419896,"chars":["dragon","phoenix"],"mode":"online"}
// every tick, sent immediately for tick+INPUT_DELAY_TICKS:
{"v":1,"t":"input","tick":120,"bits":415}
// every CHECKSUM_INTERVAL_TICKS after stepping tick T:
{"v":1,"t":"checksum","tick":120,"hash":3992911293}
// RTT measurement, ~2/s:
{"v":1,"t":"ping","c":1712345678901}   →   {"v":1,"t":"pong","c":1712345678901}
{"v":1,"t":"rematch"}                    // both must send it
{"v":1,"t":"leave"}                      // then close
```

### 6b. Client ↔ signaling server (WebSocket, see §8)

```jsonc
// C→S
{"t":"create"}                          →  {"t":"created","code":"ABCD"}
{"t":"join","code":"ABCD"}              →  {"t":"joined","code":"ABCD","you":"p2","host":"p1"}
                                            (host also gets {"t":"peer-joined","peer":"p2"})
{"t":"relay","to":"p2","data":{...}}    →  forwarded to that peer as {"t":"relay","from":"p1","data":{...}}
{"t":"leave","code":"ABCD"}
// S→C errors: {"t":"error","msg":"no-room"|"room-full"|"bad-message"|...}
// S→C when the other peer disconnects: {"t":"peer-left"}
```

- Host = room creator; **host sends the WebRTC offer**, guest answers. ICE
  candidates relayed both ways.
- The server never sees game state — only SDP/ICE relay and room membership.

---

## 7. NetLoop (lockstep driver)

`src/net/NetLoop.js` owns the tick clock (accumulates real time, steps at
`TICK_MS`):

1. At real time for tick `T`: collect local `bits` for `T + INPUT_DELAY_TICKS`,
   send `input` message immediately.
2. Barrier: to step tick `T`, wait until both `inputs[T]` (local + remote) are
   present. If the remote one is late, **wait** (lockstep stutter); if nothing
   arrives for > 5 s → treat as disconnect.
3. `stepSim(state, p1Bits, p2Bits)` → new events; if `T % CHECKSUM_INTERVAL_TICKS == 0`,
   send `checksum` with `hashState(state)`.
4. On receiving a `checksum` for a tick we have: compare. **Mismatch = desync**
   → v1 policy: show "DESYNC" banner and both sides go back to menu. (No resync.)
5. On `peer-left` / channel close: pause, banner, back to character select.
6. `rematch`: when both sent it, reset sim with same seed/chars, `round = 1`.

Local modes (CPU/PVP/training) run the same `stepSim` with a `LocalInputSource`
for both players (P2 = local or AI) — no NetLoop involved.

---

## 8. Signaling server contract

Standalone in `server/` (own `package.json`, dependency: `ws` only — do not
ship Phaser there). Listens on `PORT` (env, default `8080`).

- Rooms: map `code → { peers: [ws, ws], createdAt }`. `create` → new code,
  joiner is `p1` (host). `join` → adds as `p2`, notifies host with `peer-joined`.
  Room full / unknown → `error`. Room TTL 10 min idle; empty room deleted.
- `relay` → forward `data` to the addressed peer only; validate `data` is a
  JSON object ≤ `MAX_MESSAGE_BYTES`, else `error` + close.
- On ws close: notify the other peer with `peer-left`, delete the room.
- No auth in v1 — the 4-char room code is the shared secret. No game-state
  knowledge, no persistence.
- Client connects to `import.meta.env.VITE_SIGNALING_URL || 'ws://localhost:8080'`
  (override via `?signaling=` query param for quick tests).

---

## 9. Migration plan (order of work)

1. **Determinism pass** on current code (no new files yet): tick-based timers,
   seeded RNG, remove `Math.pow` from sim path — makes local game tick-clean.
2. **Extract `src/sim/`**: move Fighter/Combat/Projectile/match-flow logic out
   of Phaser objects; introduce `events[]`; `BattleScene` drains events for FX.
3. **Input refactor**: per-tick bitfields, sim-side edges/buffer/motions;
   `LocalInputSource`/`AISource` behind an input-provider interface.
4. **Fixed-tick driver for local play**: accumulator in `BattleScene` (or a
   `LocalLoop`), 60 Hz `stepSim`.
5. **Tests** (`node --test`, `src/sim` imports cleanly in Node):
   determinism (same seed+inputs → same hash, twice), snapshot/restore equality,
   bitfield codec round-trip, motion detection in ticks, protocol validation.
6. **Hygiene**: commit fixes + WIP separately, eslint, dead assets, box
   constants, `characters.js` placeholders, README alignment.
7. **`src/net/`**: protocol.js, Peer.js, SignalingClient.js, NetLoop.js —
   develop against a loopback fake peer first (two NetLoops in one page).
8. **`server/`** per §8; then end-to-end 2-browser verification:
   checksums match for a full match, desync path, disconnect path, rematch,
   no listener leaks across scene restarts.

---

## 10. Verification gate before "online play" is done

- [ ] `pnpm build` + `pnpm test` green in CI.
- [ ] Determinism test: 10k ticks, two runs, same seed/inputs → identical hashes.
- [ ] Snapshot/restore mid-match → identical hashes afterwards.
- [ ] Two browsers, room code flow, full match with matching checksums every second.
- [ ] Kill one tab mid-match → other side gets banner + clean return to menu.
- [ ] Input delay measured at ~50 ms RTT stays playable at `INPUT_DELAY_TICKS = 2`.
