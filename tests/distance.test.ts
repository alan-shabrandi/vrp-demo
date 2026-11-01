import { describe, expect, it } from "vitest";
import {
  computeImprovement,
  evaluateSequence,
  haversineDistance,
} from "@/lib/distance";
import { Point } from "@/lib/types";
import { fixedScenario, start } from "./helpers";

describe("haversineDistance", () => {
  it("returns 0 for the same point", () => {
    const p: Point = start(35.6892, 51.389);
    expect(haversineDistance(p, p)).toBe(0);
  });

  it("is symmetric", () => {
    const a = start(35.6892, 51.389);
    const b = start(36.297, 59.606); // Mashhad
    expect(haversineDistance(a, b)).toBeCloseTo(haversineDistance(b, a), 6);
  });

  it("approximates Tehran → Mashhad at ~740 km (±2%)", () => {
    const a = start(35.6892, 51.389);
    const b = start(36.297, 59.606);
    const km = haversineDistance(a, b) / 1000;
    expect(km).toBeGreaterThan(725);
    expect(km).toBeLessThan(755);
  });
});

describe("evaluateSequence", () => {
  it("computes total distance as the sum of consecutive edges", () => {
    const points = fixedScenario();
    const seq = ["start", "s1", "s2", "s3", "s4", "end"];
    const result = evaluateSequence(points, seq, "distance");

    const byId = new Map(points.map((p) => [p.id, p]));
    let expected = 0;
    for (let i = 0; i < seq.length - 1; i++) {
      expected += haversineDistance(byId.get(seq[i])!, byId.get(seq[i + 1])!);
    }
    expect(result.totalDistance).toBeCloseTo(expected, 3);
  });

  it("returns time derived from distance and constant speed", () => {
    const points = fixedScenario();
    const result = evaluateSequence(points, ["start", "s1", "end"], "distance");
    // 40 km/h → 11.111... m/s
    expect(result.totalTime).toBeCloseTo(
      result.totalDistance / (40_000 / 3600),
      3,
    );
  });

  it("sets fitness to totalDistance for distance objective", () => {
    const points = fixedScenario();
    const r = evaluateSequence(points, ["start", "s1", "end"], "distance");
    expect(r.fitness).toBe(r.totalDistance);
  });

  it("sets fitness to totalTime for time objective", () => {
    const points = fixedScenario();
    const r = evaluateSequence(points, ["start", "s1", "end"], "time");
    expect(r.fitness).toBe(r.totalTime);
  });

  it("throws on unknown point id", () => {
    const points = fixedScenario();
    expect(() =>
      evaluateSequence(points, ["start", "missing", "end"], "distance"),
    ).toThrow(/Unknown point/);
  });
});

describe("computeImprovement", () => {
  it("returns the fractional reduction for a strictly better candidate", () => {
    expect(computeImprovement(100, 90)).toBeCloseTo(0.1, 6);
    expect(computeImprovement(1000, 500)).toBeCloseTo(0.5, 6);
  });

  it("returns 0 when the candidate ties the baseline", () => {
    expect(computeImprovement(100, 100)).toBe(0);
  });

  it("clamps to 0 when the candidate is worse", () => {
    expect(computeImprovement(100, 110)).toBe(0);
    expect(computeImprovement(100, 1000)).toBe(0);
  });

  it("returns 1 when the candidate has zero fitness", () => {
    expect(computeImprovement(100, 0)).toBe(1);
  });

  it("returns 0 when the baseline is zero (no divide-by-zero)", () => {
    expect(computeImprovement(0, 0)).toBe(0);
    expect(computeImprovement(0, 10)).toBe(0);
  });

  it("returns 0 when the baseline is negative (defensive)", () => {
    expect(computeImprovement(-100, 10)).toBe(0);
  });
});
