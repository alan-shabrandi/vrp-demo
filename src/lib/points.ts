import type { Point, PointRole } from "./types";

export interface PointSetSummary {
  startCount: number;
  endCount: number;
  stopCount: number;
  /** True iff exactly one start, one end, and ≥1 stop. */
  isReady: boolean;
  /** Unmet requirements, empty when `isReady`. */
  missing: string[];
}

/**
 * Analyze a point set against the solver's preconditions.
 *
 * Single source of truth for "can we optimize yet?" — consumed by
 * `ControlPanel` (CTA disabled state, missing hint) and `page.tsx`
 * (header status pill, keyboard-shortcut gate). Two consumers is one
 * too many for duplicated logic.
 */
export function summarizePointSet(points: Point[]): PointSetSummary {
  let startCount = 0;
  let endCount = 0;
  let stopCount = 0;

  for (const p of points) {
    if (p.role === "start") startCount++;
    else if (p.role === "end") endCount++;
    else stopCount++;
  }

  const missing: string[] = [];
  if (startCount !== 1) missing.push("1 start");
  if (endCount !== 1) missing.push("1 end");
  if (stopCount < 1) missing.push("≥1 stop");

  return {
    startCount,
    endCount,
    stopCount,
    isReady: missing.length === 0,
    missing,
  };
}

/**
 * Apply a map click: place a new point, honoring per-role rules —
 * start replaces the existing start, end replaces the existing end,
 * stop appends. `id` is passed in (not generated) so the caller
 * controls uniqueness; this function stays pure.
 */
export function placePoint(
  points: Point[],
  clickMode: PointRole,
  lat: number,
  lng: number,
  id: string,
): Point[] {
  const stopCount = points.filter((p) => p.role === "stop").length;
  const label =
    clickMode === "stop"
      ? `Stop ${stopCount + 1}`
      : clickMode === "start"
        ? "Start"
        : "End";
  const newPoint: Point = { id, lat, lng, role: clickMode, label };

  if (clickMode === "start") {
    return [newPoint, ...points.filter((p) => p.role !== "start")];
  }
  if (clickMode === "end") {
    return [...points.filter((p) => p.role !== "end"), newPoint];
  }
  return [...points, newPoint];
}
