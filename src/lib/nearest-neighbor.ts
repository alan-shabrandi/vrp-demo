import { evaluateSequence, haversineDistance } from "./distance";
import { requireStartAndEnd } from "./validation";
import type { BaselineResult, GAConfig, Point } from "./types";

/**
 * Greedy nearest-neighbor baseline.
 *
 * From the current point, hop to the nearest unvisited stop; terminate
 * at the fixed end. Deliberately weak — its role is to give the GA a
 * comparison floor, not to be a competitive heuristic.
 */
export function solveNearestNeighbor(
  points: Point[],
  config: GAConfig,
): BaselineResult {
  const { start, end } = requireStartAndEnd(points);

  const remaining = points.filter((p) => p.role === "stop");
  const sequence: string[] = [start.id];
  let current: Point = start;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineDistance(current, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    sequence.push(next.id);
    current = next;
  }
  sequence.push(end.id);

  const result = evaluateSequence(points, sequence, config.objective);
  return { ...result, algorithm: "nearest-neighbor" };
}
