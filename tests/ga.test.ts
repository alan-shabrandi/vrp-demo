import { describe, expect, it } from "vitest";
import { solveGA } from "@/lib/ga";
import { solveNearestNeighbor } from "@/lib/nearest-neighbor";
import { DEFAULT_GA_CONFIG } from "@/lib/constants";
import type { GAConfig } from "@/lib/types";
import { fixedScenario, end, start, stop } from "./helpers";

const baseConfig: GAConfig = {
  ...DEFAULT_GA_CONFIG,
  populationSize: 40,
  generations: 60,
  randomSeed: 42,
};

describe("solveGA — structural invariants", () => {
  it("starts with start and ends with end", () => {
    const points = fixedScenario();
    const r = solveGA(points, baseConfig);
    expect(r.sequence[0]).toBe("start");
    expect(r.sequence[r.sequence.length - 1]).toBe("end");
  });

  it("visits every stop exactly once", () => {
    const points = fixedScenario();
    const r = solveGA(points, baseConfig);
    const stops = points.filter((p) => p.role === "stop").map((p) => p.id);
    expect(r.sequence.slice(1, -1).sort()).toEqual(stops.sort());
  });

  it("reports history of length == generations", () => {
    const points = fixedScenario();
    const r = solveGA(points, baseConfig);
    expect(r.history).toHaveLength(baseConfig.generations);
    expect(r.generationsRun).toBe(baseConfig.generations);
  });

  it("history.best is monotonically non-increasing (elitism guarantee)", () => {
    const points = fixedScenario();
    const r = solveGA(points, baseConfig);
    for (let i = 1; i < r.history.length; i++) {
      expect(r.history[i].best).toBeLessThanOrEqual(r.history[i - 1].best);
    }
  });

  it("reported fitness equals history's last best", () => {
    const points = fixedScenario();
    const r = solveGA(points, baseConfig);
    expect(r.fitness).toBe(r.history[r.history.length - 1].best);
  });
});

describe("solveGA — quality vs baseline", () => {
  it("beats nearest-neighbor on the fixed scenario", () => {
    const points = fixedScenario();
    const ga = solveGA(points, baseConfig);
    const nn = solveNearestNeighbor(points, baseConfig);
    expect(ga.fitness).toBeLessThanOrEqual(nn.fitness);
  });

  it("is deterministic with a fixed seed", () => {
    const points = fixedScenario();
    const a = solveGA(points, baseConfig);
    const b = solveGA(points, baseConfig);
    expect(a.sequence).toEqual(b.sequence);
    expect(a.fitness).toBe(b.fitness);
  });

  it("different seeds produce different evolutionary trajectories", () => {
    const points = fixedScenario();
    const a = solveGA(points, { ...baseConfig, randomSeed: 1 });
    const b = solveGA(points, { ...baseConfig, randomSeed: 2 });

    // With only 4 stops, both runs often converge to the same global optimum —
    // that's *good*. But the trajectory (initial population + evolution path)
    // must be seed-dependent, otherwise the RNG isn't actually wired through.
    const trajectoriesDiffer =
      a.history.length !== b.history.length ||
      a.history.some(
        (h, i) =>
          h.best !== b.history[i].best || h.average !== b.history[i].average,
      );
    expect(trajectoriesDiffer).toBe(true);
  });
});

describe("solveGA — edge cases", () => {
  it("handles zero stops (start → end only)", () => {
    const points = [start(35.7, 51.4), end(35.8, 51.5)];
    const r = solveGA(points, baseConfig);
    expect(r.sequence).toEqual(["start", "end"]);
    expect(r.history).toEqual([]);
    expect(r.generationsRun).toBe(0);
  });

  it("handles a single stop", () => {
    const points = [
      start(35.7, 51.4),
      stop(35.75, 51.45, "s1"),
      end(35.8, 51.5),
    ];
    const r = solveGA(points, baseConfig);
    expect(r.sequence).toEqual(["start", "s1", "end"]);
    expect(r.history).toHaveLength(baseConfig.generations);
  });

  it("throws if start or end is missing", () => {
    expect(() => solveGA([stop(0, 0, "s1")], baseConfig)).toThrow(
      /start and one end/,
    );
  });

  it("respects the time objective for fitness ranking", () => {
    const points = fixedScenario();
    const r = solveGA(points, { ...baseConfig, objective: "time" });
    expect(r.fitness).toBe(r.totalTime);
    expect(r.fitness).toBeCloseTo(r.totalDistance / (40_000 / 3600), 3);
  });
});
