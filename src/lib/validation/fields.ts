import {
  DEFAULT_GA_CONFIG,
  GA_CONFIG_BOUNDS,
  VALID_OBJECTIVES,
  VALID_ROLES,
} from "../constants";
import type { GAConfig, Point } from "../types";
import { ValidationError } from "./error";
import {
  asIntInRange,
  asNumber,
  isObject,
  isValidObjective,
  isValidRole,
} from "./primitives";

export function parsePoint(raw: unknown, index: number): Point {
  if (!isObject(raw)) {
    throw new ValidationError(`points[${index}] must be an object`);
  }

  const id = raw.id;
  if (typeof id !== "string" || id.length === 0) {
    throw new ValidationError(`points[${index}].id must be a non-empty string`);
  }

  const lat = asNumber(raw.lat, `points[${index}].lat`);
  if (lat < -90 || lat > 90) {
    throw new ValidationError(
      `points[${index}].lat must be between -90 and 90`,
    );
  }

  const lng = asNumber(raw.lng, `points[${index}].lng`);
  if (lng < -180 || lng > 180) {
    throw new ValidationError(
      `points[${index}].lng must be between -180 and 180`,
    );
  }

  const role = raw.role;
  if (typeof role !== "string" || !isValidRole(role)) {
    throw new ValidationError(
      `points[${index}].role must be one of ${VALID_ROLES.join(", ")}`,
    );
  }

  const label = typeof raw.label === "string" ? raw.label : undefined;

  return { id, lat, lng, role, label };
}

export function parseConfig(raw: unknown): GAConfig {
  if (raw === undefined) return DEFAULT_GA_CONFIG;
  if (!isObject(raw)) {
    throw new ValidationError("config must be an object");
  }

  const objective = raw.objective ?? DEFAULT_GA_CONFIG.objective;
  if (typeof objective !== "string" || !isValidObjective(objective)) {
    throw new ValidationError(
      `config.objective must be one of ${VALID_OBJECTIVES.join(", ")}`,
    );
  }

  const populationSize = asIntInRange(
    raw.populationSize ?? DEFAULT_GA_CONFIG.populationSize,
    "config.populationSize",
    GA_CONFIG_BOUNDS.populationSize.min,
    GA_CONFIG_BOUNDS.populationSize.max,
  );

  const generations = asIntInRange(
    raw.generations ?? DEFAULT_GA_CONFIG.generations,
    "config.generations",
    GA_CONFIG_BOUNDS.generations.min,
    GA_CONFIG_BOUNDS.generations.max,
  );

  const mutationRate = asNumber(
    raw.mutationRate ?? DEFAULT_GA_CONFIG.mutationRate,
    "config.mutationRate",
  );
  if (
    mutationRate < GA_CONFIG_BOUNDS.mutationRate.min ||
    mutationRate > GA_CONFIG_BOUNDS.mutationRate.max
  ) {
    throw new ValidationError(
      `config.mutationRate must be between ${GA_CONFIG_BOUNDS.mutationRate.min} and ${GA_CONFIG_BOUNDS.mutationRate.max}`,
    );
  }

  const elitismCount = asIntInRange(
    raw.elitismCount ?? DEFAULT_GA_CONFIG.elitismCount,
    "config.elitismCount",
    GA_CONFIG_BOUNDS.elitismCount.min,
    GA_CONFIG_BOUNDS.elitismCount.max,
  );
  if (elitismCount > populationSize) {
    throw new ValidationError(
      "config.elitismCount must be <= config.populationSize",
    );
  }

  const tournamentSize = asIntInRange(
    raw.tournamentSize ?? DEFAULT_GA_CONFIG.tournamentSize,
    "config.tournamentSize",
    GA_CONFIG_BOUNDS.tournamentSize.min,
    GA_CONFIG_BOUNDS.tournamentSize.max,
  );

  const randomSeed =
    raw.randomSeed === undefined
      ? undefined
      : asNumber(raw.randomSeed, "config.randomSeed");

  return {
    populationSize,
    generations,
    mutationRate,
    elitismCount,
    tournamentSize,
    objective,
    randomSeed,
  };
}
