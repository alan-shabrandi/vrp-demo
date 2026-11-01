import { describe, expect, it } from "vitest";
import { solveNearestNeighbor } from "@/lib/nearest-neighbor";
import { DEFAULT_GA_CONFIG } from "@/lib/constants";
import { fixedScenario } from "./helpers";

describe("solveNearestNeighbor", () => {
  const config = { ...DEFAULT_GA_CONFIG, randomSeed: 1 };

  it("starts with start and ends with end", () => {
    const points = fixedScenario();
    const r = solveNearestNeighbor(points, config);
    expect(r.sequence[0]).toBe("start");
    expect(r.sequence[r.sequence.length - 1]).toBe("end");
  });

  it("visits every stop exactly once", () => {
    const points = fixedScenario();
    const r = solveNearestNeighbor(points, config);
    const stops = points.filter((p) => p.role === "stop").map((p) => p.id);
    const inRoute = r.sequence.slice(1, -1).sort();
    expect(inRoute).toEqual(stops.sort());
  });

  it("reports a valid positive distance for a non-trivial scenario", () => {
    const points = fixedScenario();
    const r = solveNearestNeighbor(points, config);
    expect(r.totalDistance).toBeGreaterThan(0);
    expect(r.fitness).toBe(r.totalDistance);
  });

  it("throws if start or end is missing", () => {
    expect(() =>
      solveNearestNeighbor(
        [{ id: "s1", lat: 0, lng: 0, role: "stop" }],
        config,
      ),
    ).toThrow(/start and one end/);
  });
});
