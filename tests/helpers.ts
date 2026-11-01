import { Point } from "@/lib/types";

/** Make a valid start point. */
export const start = (lat: number, lng: number, id = "start"): Point => ({
  id,
  lat,
  lng,
  role: "start",
});

export const end = (lat: number, lng: number, id = "end"): Point => ({
  id,
  lat,
  lng,
  role: "end",
});

export const stop = (lat: number, lng: number, id: string): Point => ({
  id,
  lat,
  lng,
  role: "stop",
});

/** Fixed, hand-picked point set around Tehran for deterministic tests. */
export function fixedScenario(): Point[] {
  return [
    start(35.6892, 51.389), // Tehran center
    stop(35.7005, 51.4013, "s1"),
    stop(35.7309, 51.4205, "s2"),
    stop(35.7448, 51.3753, "s3"),
    stop(35.7595, 51.4108, "s4"),
    end(35.7795, 51.4033, "end"),
  ];
}
