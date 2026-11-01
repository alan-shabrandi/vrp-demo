import { useMemo } from "react";
import type { Point } from "@/lib/types";

/**
 * Assign display numbers to each stop.
 *
 * - With a route: number by visit order so map markers match the
 *   sequence shown in ResultsPanel.
 * - Without: number by creation order (stable across renders, no
 *   flicker while the user is placing points).
 *
 * Stops omitted from the route are appended at the end (defensive —
 * the solvers never produce this, but a malformed route shouldn't
 * break numbering).
 */
export function useStopNumbers(
  points: Point[],
  route?: string[],
): Map<string, number> {
  return useMemo(() => {
    const numbers = new Map<string, number>();

    if (route && route.length > 1) {
      const byId = new Map(points.map((p) => [p.id, p]));
      let visitIdx = 0;
      for (const id of route) {
        const p = byId.get(id);
        if (p?.role === "stop") numbers.set(id, ++visitIdx);
      }
      for (const p of points) {
        if (p.role === "stop" && !numbers.has(p.id)) {
          numbers.set(p.id, ++visitIdx);
        }
      }
      return numbers;
    }

    let n = 0;
    for (const p of points) {
      if (p.role === "stop") numbers.set(p.id, ++n);
    }
    return numbers;
  }, [points, route]);
}
