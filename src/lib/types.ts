/**
 * Shared type definitions.
 *
 * Types only — no runtime values, no imports. Runtime constants live in
 * `lib/constants.ts`; validation lives in `lib/validation.ts`.
 */

export type PointRole = "start" | "stop" | "end";

export interface Point {
  id: string;
  lat: number;
  lng: number;
  role: PointRole;
  label?: string;
}

export type Objective = "distance" | "time";

export interface GAConfig {
  populationSize: number;
  generations: number;
  /** Probability of mutation per offspring (0..1). */
  mutationRate: number;
  elitismCount: number;
  tournamentSize: number;
  objective: Objective;
  /** Optional seed for reproducible runs (used in tests). */
  randomSeed?: number;
}

export interface FitnessHistoryPoint {
  generation: number;
  /** Best objective value found by the end of that generation. */
  best: number;
  /** Mean objective value of the population at the end of that generation. */
  average: number;
}

export interface RouteSolution {
  /** Full sequence of point IDs, starting with `start` and ending with `end`. */
  sequence: string[];
  /** Total distance in meters. */
  totalDistance: number;
  /** Estimated travel time in seconds (constant-speed approximation). */
  totalTime: number;
  /** Objective value used for ranking — totalDistance or totalTime. */
  fitness: number;
}

export interface GAResult extends RouteSolution {
  algorithm: "genetic";
  /** Per-generation convergence data; `best` is non-increasing (elitism guarantees it). */
  history: FitnessHistoryPoint[];
  /** Number of generations actually run (<= config.generations). */
  generationsRun: number;
}

export interface BaselineResult extends RouteSolution {
  algorithm: "nearest-neighbor";
}

export interface Preset {
  key: string;
  name: string;
  points: Point[];
}

export interface OptimizeRequest {
  points: Point[];
  config: GAConfig;
}

export interface OptimizeResponse {
  ga: GAResult;
  baseline: BaselineResult;
  /** (baseline.fitness - ga.fitness) / baseline.fitness, clamped to [0, 1]. */
  improvementPercent: number;
}
