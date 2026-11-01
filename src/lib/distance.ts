import { AVERAGE_SPEED_MS, EARTH_RADIUS_M } from "./constants";
import type { Objective, Point, RouteSolution } from "./types";

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two WGS84 points, in meters. */
export function haversineDistance(a: Point, b: Point): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Evaluate a full route.
 *
 * `sequence` must include start, end, and every stop, in visit order,
 * starting with the start point and ending with the end point.
 */
export function evaluateSequence(
  points: Point[],
  sequence: string[],
  objective: Objective,
): RouteSolution {
  const byId = new Map(points.map((p) => [p.id, p]));
  let totalDistance = 0;

  for (let i = 0; i < sequence.length - 1; i++) {
    const a = byId.get(sequence[i]);
    const b = byId.get(sequence[i + 1]);
    if (!a || !b) {
      throw new Error(
        `Unknown point in sequence: ${sequence[i]} or ${sequence[i + 1]}`,
      );
    }
    totalDistance += haversineDistance(a, b);
  }

  const totalTime = totalDistance / AVERAGE_SPEED_MS;
  const fitness = objective === "distance" ? totalDistance : totalTime;

  return { sequence, totalDistance, totalTime, fitness };
}

/**
 * Fractional improvement of `candidate` over `baseline`, clamped to
 * [0, 1]. `0.111` means the candidate is 11.1% better.
 */
export function computeImprovement(
  baselineFitness: number,
  candidateFitness: number,
): number {
  if (baselineFitness <= 0) return 0;
  const raw = (baselineFitness - candidateFitness) / baselineFitness;
  return Math.max(0, Math.min(1, raw));
}
