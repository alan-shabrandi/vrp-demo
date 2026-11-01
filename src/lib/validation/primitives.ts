import { VALID_OBJECTIVES, VALID_ROLES } from "../constants";
import type { Objective, PointRole } from "../types";
import { ValidationError } from "./error";

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function asNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ValidationError(`${field} must be a finite number`);
  }
  return value;
}

export function asIntInRange(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number {
  const n = asNumber(value, field);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new ValidationError(
      `${field} must be an integer between ${min} and ${max}`,
    );
  }
  return n;
}

export function isValidRole(value: string): value is PointRole {
  return (VALID_ROLES as readonly string[]).includes(value);
}

export function isValidObjective(value: string): value is Objective {
  return (VALID_OBJECTIVES as readonly string[]).includes(value);
}
