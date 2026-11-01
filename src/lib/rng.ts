/**
 * Seeded PRNG. Same seed + same inputs → same outputs, which is what
 * makes the GA reproducible in tests.
 */

export type Rng = () => number;

/**
 * Mulberry32 — tiny and fast, adequate for stochastic search.
 * Without a seed, returns `Math.random` so production runs stay non-deterministic.
 */
export function createRng(seed?: number): Rng {
  if (seed === undefined) return Math.random;
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle. Returns a new array; does not mutate the input. */
export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Uniform integer in [0, length). Assumes `length > 0`. */
export function randomIndex(length: number, rng: Rng): number {
  return Math.floor(rng() * length);
}
