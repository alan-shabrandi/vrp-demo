import type { GAConfig, Objective, PointRole } from "./types";

export const EARTH_RADIUS_M = 6_371_000;

/** Approximate average travel speed, used only for the `time` objective. */
export const AVERAGE_SPEED_KMH = 40;

/** Derived: km/h → m/s. */
export const AVERAGE_SPEED_MS = (AVERAGE_SPEED_KMH * 1000) / 3600;

/** Minimum points required: start + end + at least one stop. */
export const MIN_POINTS = 3;

/** Safety cap so a single request stays cheap. */
export const MAX_POINTS = 25;

/** Must stay in sync with `PointRole`; `satisfies` catches drift. */
export const VALID_ROLES = [
  "start",
  "stop",
  "end",
] as const satisfies readonly PointRole[];

/** Mirrors `Objective`. */
export const VALID_OBJECTIVES = [
  "distance",
  "time",
] as const satisfies readonly Objective[];

export const DEFAULT_GA_CONFIG: GAConfig = {
  populationSize: 80,
  generations: 150,
  mutationRate: 0.15,
  elitismCount: 2,
  tournamentSize: 3,
  objective: "distance",
};

export const GA_CONFIG_BOUNDS = {
  populationSize: { min: 10, max: 300 },
  generations: { min: 10, max: 500 },
  mutationRate: { min: 0, max: 1 },
  elitismCount: { min: 1, max: 10 },
  tournamentSize: { min: 2, max: 10 },
} as const;

export type BoundedGAConfigKey = keyof typeof GA_CONFIG_BOUNDS;

export const GITHUB_REPO_URL = "https://github.com/alan-shabrandi/vrp-demo";
