import { describe, expect, it } from "vitest";
import { summarizePointSet } from "@/lib/points";
import type { Point } from "@/lib/types";

const start = (): Point => ({ id: "start", lat: 0, lng: 0, role: "start" });
const stop = (id: string): Point => ({ id, lat: 0, lng: 0, role: "stop" });
const end = (): Point => ({ id: "end", lat: 0, lng: 0, role: "end" });

describe("summarizePointSet", () => {
  it("reports all requirements missing for an empty set", () => {
    const s = summarizePointSet([]);
    expect(s.startCount).toBe(0);
    expect(s.endCount).toBe(0);
    expect(s.stopCount).toBe(0);
    expect(s.isReady).toBe(false);
    expect(s.missing).toEqual(["1 start", "1 end", "≥1 stop"]);
  });

  it("reports missing end and stop when only start is present", () => {
    const s = summarizePointSet([start()]);
    expect(s.startCount).toBe(1);
    expect(s.endCount).toBe(0);
    expect(s.stopCount).toBe(0);
    expect(s.isReady).toBe(false);
    expect(s.missing).toEqual(["1 end", "≥1 stop"]);
  });

  it("reports missing stop when start + end are present", () => {
    const s = summarizePointSet([start(), end()]);
    expect(s.missing).toEqual(["≥1 stop"]);
    expect(s.isReady).toBe(false);
  });

  it("is ready with start, end, and one stop", () => {
    const s = summarizePointSet([start(), stop("s1"), end()]);
    expect(s.startCount).toBe(1);
    expect(s.endCount).toBe(1);
    expect(s.stopCount).toBe(1);
    expect(s.isReady).toBe(true);
    expect(s.missing).toEqual([]);
  });

  it("is ready with many stops", () => {
    const s = summarizePointSet([
      start(),
      stop("s1"),
      stop("s2"),
      stop("s3"),
      end(),
    ]);
    expect(s.stopCount).toBe(3);
    expect(s.isReady).toBe(true);
  });

  it("reports missing start when there are two starts", () => {
    const s = summarizePointSet([
      start(),
      { id: "start2", lat: 1, lng: 1, role: "start" },
      stop("s1"),
      end(),
    ]);
    expect(s.startCount).toBe(2);
    expect(s.missing).toContain("1 start");
    expect(s.isReady).toBe(false);
  });

  it("reports missing end when there are two ends", () => {
    const s = summarizePointSet([
      start(),
      stop("s1"),
      end(),
      { id: "end2", lat: 1, lng: 1, role: "end" },
    ]);
    expect(s.endCount).toBe(2);
    expect(s.missing).toContain("1 end");
    expect(s.isReady).toBe(false);
  });
});
