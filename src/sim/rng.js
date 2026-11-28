// mulberry32 — small seeded PRNG (docs/NETCODE.md §3).
// The whole state is one 32-bit integer, so it is serializable and can live
// inside the sim snapshot (state.rng). Math.imul is exact integer math, so the
// output sequence is identical on every IEEE-754 platform.
// Sim-safe: no Phaser, no DOM, no clock.

export function createRNG(seed) {
  let state = seed >>> 0;

  const rng = () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  rng.state = () => state;
  rng.setState = (s) => { state = s >>> 0; };
  return rng;
}
