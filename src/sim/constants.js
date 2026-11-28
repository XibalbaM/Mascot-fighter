// Hard constants for the deterministic lockstep simulation (docs/NETCODE.md §2).
// Single source of truth. This module is sim-safe: no Phaser, no DOM, no clock.
// Gameplay balance numbers stay in src/config.js (GAME_CONFIG).

export const TICK_RATE = 60;                    // Hz — the sim only ever advances in whole ticks
export const TICK_MS = 1000 / TICK_RATE;        // ms per sim tick (16.666...)
export const INPUT_DELAY_TICKS = 2;             // [tune] 2–4 — local inputs are sent for tick + this
export const PRESS_BUFFER_TICKS = 3;            // a buffered press stays valid this many ticks (hitstop)
export const MOTION_WINDOW_TICKS = 24;          // QCF/DP direction-history window (was 400 ms @60 Hz)
export const CHECKSUM_INTERVAL_TICKS = 60;      // send a state hash every second of sim
export const MAX_MESSAGE_BYTES = 16384;         // signaling + datachannel message cap
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no O/I/0/1 (ambiguous)
export const ROOM_CODE_LENGTH = 4;
