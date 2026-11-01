/**
 * Genetic operators for permutation chromosomes. Each is pure — no
 * global state, no mutation of inputs — and exported individually so
 * it can be tested in isolation.
 */

import { randomIndex, type Rng } from "./rng";
import type { RouteSolution } from "./types";

/**
 * Order Crossover (OX).
 *
 * Copies a contiguous slice of `p1` into the child at the same
 * positions, then fills the rest from `p2` in order, skipping genes
 * already present. Always yields a valid permutation of the same set —
 * no repair step needed. This is why OX is used over single-point
 * crossover, which duplicates and drops genes on permutations.
 */
export function orderCrossover(p1: string[], p2: string[], rng: Rng): string[] {
  const n = p1.length;
  if (n < 2) return [...p1];

  const a = Math.floor(rng() * n);
  const b = Math.floor(rng() * n);
  const [start, end] = a < b ? [a, b] : [b, a];

  const child: (string | null)[] = new Array(n).fill(null);
  const used = new Set<string>();

  for (let i = start; i <= end; i++) {
    child[i] = p1[i];
    used.add(p1[i]);
  }

  let j = 0;
  for (let i = 0; i < n; i++) {
    if (child[i] !== null) continue;
    while (used.has(p2[j])) j++;
    child[i] = p2[j++];
  }

  return child as string[];
}

/**
 * Swap mutation. Picks two distinct positions and swaps them.
 * Chromosomes shorter than 2 are returned unchanged.
 */
export function swapMutation(chrom: string[], rng: Rng): string[] {
  const out = [...chrom];
  if (out.length < 2) return out;
  const i = randomIndex(out.length, rng);
  let j = randomIndex(out.length, rng);
  while (j === i) j = randomIndex(out.length, rng);
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

/**
 * k-way tournament selection. Samples `k` individuals uniformly (with
 * replacement) and returns the one with the lowest `fitness`. Higher
 * `k` means stronger selective pressure.
 */
export function tournamentSelect(
  population: RouteSolution[],
  k: number,
  rng: Rng,
): RouteSolution {
  let best = population[randomIndex(population.length, rng)];
  for (let i = 1; i < k; i++) {
    const candidate = population[randomIndex(population.length, rng)];
    if (candidate.fitness < best.fitness) best = candidate;
  }
  return best;
}
