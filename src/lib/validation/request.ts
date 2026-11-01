import { MAX_POINTS, MIN_POINTS } from "../constants";
import type { OptimizeRequest, Point } from "../types";
import { parseConfig } from "./fields";
import { parsePoint } from "./fields";
import { ValidationError } from "./error";
import { isObject } from "./primitives";

/** Validate a raw request body into a typed `OptimizeRequest`. */
export function parseOptimizeRequest(body: unknown): OptimizeRequest {
  if (!isObject(body)) {
    throw new ValidationError("Request body must be a JSON object");
  }

  if (!Array.isArray(body.points)) {
    throw new ValidationError("points must be an array");
  }
  if (body.points.length < MIN_POINTS) {
    throw new ValidationError(
      `At least ${MIN_POINTS} points are required (start, end, and one stop)`,
    );
  }
  if (body.points.length > MAX_POINTS) {
    throw new ValidationError(`At most ${MAX_POINTS} points are allowed`);
  }

  const points = body.points.map(parsePoint);

  const starts = points.filter((p) => p.role === "start");
  const ends = points.filter((p) => p.role === "end");
  if (starts.length !== 1) {
    throw new ValidationError('Exactly one point must have role "start"');
  }
  if (ends.length !== 1) {
    throw new ValidationError('Exactly one point must have role "end"');
  }

  const ids = new Set(points.map((p) => p.id));
  if (ids.size !== points.length) {
    throw new ValidationError("Point IDs must be unique");
  }

  const config = parseConfig(body.config);

  return { points, config };
}

/**
 * Assert that `points` has exactly one start and one end.
 * Defensive invariant used by both solvers at the top of their run —
 * the API validates first, but a direct caller might not.
 */
export function requireStartAndEnd(points: Point[]): {
  start: Point;
  end: Point;
} {
  const start = points.find((p) => p.role === "start");
  const end = points.find((p) => p.role === "end");
  if (!start || !end) {
    throw new Error("Points must include exactly one start and one end");
  }
  return { start, end };
}
