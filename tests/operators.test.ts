import { describe, expect, it } from "vitest";
import { createRng } from "@/lib/rng";
import { orderCrossover, swapMutation } from "@/lib/operators";

describe("orderCrossover", () => {
  it("produces a valid permutation of the parent genes", () => {
    const rng = createRng(42);
    const p1 = ["a", "b", "c", "d", "e"];
    const p2 = ["e", "d", "c", "b", "a"];
    const child = orderCrossover(p1, p2, rng);

    expect(child).toHaveLength(p1.length);
    expect(new Set(child)).toEqual(new Set(p1));
    expect(child.every((g) => p1.includes(g))).toBe(true);
  });

  it("contains no duplicates even when parents differ", () => {
    const rng = createRng(7);
    const p1 = ["a", "b", "c", "d"];
    const p2 = ["d", "c", "b", "a"];
    const child = orderCrossover(p1, p2, rng);

    expect(new Set(child).size).toBe(child.length);
  });

  it("is deterministic for a fixed seed", () => {
    const p1 = ["a", "b", "c", "d", "e"];
    const p2 = ["e", "d", "c", "b", "a"];
    expect(orderCrossover(p1, p2, createRng(123))).toEqual(
      orderCrossover(p1, p2, createRng(123)),
    );
  });

  it("handles length < 2", () => {
    const rng = createRng(1);
    expect(orderCrossover(["a"], ["b"], rng)).toEqual(["a"]);
    expect(orderCrossover([], [], rng)).toEqual([]);
  });
});

describe("swapMutation", () => {
  it("preserves the multiset of genes", () => {
    const rng = createRng(42);
    const input = ["a", "b", "c", "d", "e"];
    const output = swapMutation(input, rng);
    expect(output).toHaveLength(input.length);
    expect(new Set(output)).toEqual(new Set(input));
  });

  it("does not mutate the input", () => {
    const rng = createRng(42);
    const input = ["a", "b", "c", "d", "e"];
    const snapshot = [...input];
    swapMutation(input, rng);
    expect(input).toEqual(snapshot);
  });

  it("returns unchanged for length < 2", () => {
    const rng = createRng(1);
    expect(swapMutation(["a"], rng)).toEqual(["a"]);
    expect(swapMutation([], rng)).toEqual([]);
  });
});
