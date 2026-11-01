import { describe, expect, it } from "vitest";
import { formatDistance, formatTime } from "@/lib/format";

describe("formatDistance", () => {
  it("renders zero as 0.00 km", () => {
    expect(formatDistance(0)).toBe("0.00 km");
  });

  it("renders exactly 1000 m as 1.00 km", () => {
    expect(formatDistance(1000)).toBe("1.00 km");
  });

  it("renders 100 m as 0.10 km", () => {
    expect(formatDistance(100)).toBe("0.10 km");
  });

  it("renders 2500 m as 2.50 km", () => {
    expect(formatDistance(2500)).toBe("2.50 km");
  });

  it("renders 1 230 000 m as 1230.00 km", () => {
    expect(formatDistance(1_230_000)).toBe("1230.00 km");
  });
});

describe("formatTime", () => {
  it("renders sub-minute durations in seconds", () => {
    expect(formatTime(0)).toBe("0s");
    expect(formatTime(1)).toBe("1s");
    expect(formatTime(30)).toBe("30s");
    expect(formatTime(59)).toBe("59s");
  });

  it("rounds sub-minute seconds", () => {
    expect(formatTime(45.4)).toBe("45s");
    expect(formatTime(45.6)).toBe("46s");
  });

  it("renders minute+second durations", () => {
    expect(formatTime(60)).toBe("1m 0s");
    expect(formatTime(90)).toBe("1m 30s");
    expect(formatTime(3599)).toBe("59m 59s");
  });

  it("renders hour+minute durations, omitting seconds", () => {
    expect(formatTime(3600)).toBe("1h 0m");
    expect(formatTime(3660)).toBe("1h 1m");
    expect(formatTime(7200)).toBe("2h 0m");
    expect(formatTime(5430)).toBe("1h 30m");
  });
});
