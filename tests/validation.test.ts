import { describe, expect, it } from "vitest";
import {
  parseOptimizeRequest,
  requireStartAndEnd,
  ValidationError,
} from "@/lib/validation";
import type { Point } from "@/lib/types";

const validPoints = (): Point[] => [
  { id: "start", lat: 35.6, lng: 51.3, role: "start" },
  { id: "s1", lat: 35.7, lng: 51.4, role: "stop" },
  { id: "end", lat: 35.8, lng: 51.5, role: "end" },
];

const validBody = () => ({
  points: validPoints(),
  config: {
    populationSize: 80,
    generations: 150,
    mutationRate: 0.15,
    elitismCount: 2,
    tournamentSize: 3,
    objective: "distance" as const,
  },
});

describe("parseOptimizeRequest — happy path", () => {
  it("returns a typed request for a valid body", () => {
    const req = parseOptimizeRequest(validBody());
    expect(req.points).toHaveLength(3);
    expect(req.points[0].role).toBe("start");
    expect(req.config.objective).toBe("distance");
    expect(req.config.populationSize).toBe(80);
  });

  it("uses default config when config is missing", () => {
    const req = parseOptimizeRequest({ points: validPoints() });
    expect(req.config.populationSize).toBe(80);
    expect(req.config.objective).toBe("distance");
  });

  it("accepts optional label on points", () => {
    const body = validBody();
    body.points[1] = { ...body.points[1], label: "Customer A" };
    const req = parseOptimizeRequest(body);
    expect(req.points[1].label).toBe("Customer A");
  });

  it("accepts config with randomSeed", () => {
    const body = validBody();
    const req = parseOptimizeRequest({
      ...body,
      config: { ...body.config, randomSeed: 42 },
    });
    expect(req.config.randomSeed).toBe(42);
  });
});

describe("parseOptimizeRequest — body shape", () => {
  it("rejects null", () => {
    expect(() => parseOptimizeRequest(null)).toThrow(ValidationError);
  });

  it("rejects an array", () => {
    expect(() => parseOptimizeRequest([])).toThrow(ValidationError);
  });

  it("rejects a primitive", () => {
    expect(() => parseOptimizeRequest(42)).toThrow(ValidationError);
  });

  it("rejects missing points array", () => {
    expect(() => parseOptimizeRequest({ config: {} })).toThrow(
      /points must be/,
    );
  });

  it("rejects too few points", () => {
    expect(() => parseOptimizeRequest({ points: [] })).toThrow(/At least/);
  });

  it("rejects too many points", () => {
    const tooMany = Array.from({ length: 26 }, (_, i) => ({
      id: `p${i}`,
      lat: 0,
      lng: 0,
      role: "stop" as const,
    }));
    expect(() => parseOptimizeRequest({ points: tooMany })).toThrow(/At most/);
  });
});

describe("parseOptimizeRequest — point validation", () => {
  it("rejects a non-object point", () => {
    const body = validBody();
    (body.points as unknown[])[0] = "not a point";
    expect(() => parseOptimizeRequest(body)).toThrow(/must be an object/);
  });

  it("rejects empty id", () => {
    const body = validBody();
    body.points[0].id = "";
    expect(() => parseOptimizeRequest(body)).toThrow(/non-empty string/);
  });

  it("rejects lat out of range", () => {
    const body = validBody();
    body.points[0].lat = 100;
    expect(() => parseOptimizeRequest(body)).toThrow(/lat/);
  });

  it("rejects lng out of range", () => {
    const body = validBody();
    body.points[0].lng = -200;
    expect(() => parseOptimizeRequest(body)).toThrow(/lng/);
  });

  it("rejects invalid role", () => {
    const body = validBody();
    (body.points[1] as { role: string }).role = "middle";
    expect(() => parseOptimizeRequest(body)).toThrow(/role/);
  });

  it("rejects duplicate ids", () => {
    const body = validBody();
    body.points[1].id = "start";
    expect(() => parseOptimizeRequest(body)).toThrow(/unique/);
  });

  it("rejects zero starts", () => {
    const body = validBody();
    body.points[0].role = "stop";
    expect(() => parseOptimizeRequest(body)).toThrow(/start/);
  });

  it("rejects two starts", () => {
    const body = validBody();
    body.points[1].role = "start";
    expect(() => parseOptimizeRequest(body)).toThrow(/start/);
  });

  it("rejects zero ends", () => {
    const body = validBody();
    body.points[2].role = "stop";
    expect(() => parseOptimizeRequest(body)).toThrow(/end/);
  });
});

describe("parseOptimizeRequest — config validation", () => {
  it("rejects invalid objective", () => {
    const body = validBody();
    (body.config as { objective: string }).objective = "fuel";
    expect(() => parseOptimizeRequest(body)).toThrow(/objective/);
  });

  it("rejects populationSize below min", () => {
    const body = validBody();
    body.config.populationSize = 5;
    expect(() => parseOptimizeRequest(body)).toThrow(/populationSize/);
  });

  it("rejects populationSize above max", () => {
    const body = validBody();
    body.config.populationSize = 1000;
    expect(() => parseOptimizeRequest(body)).toThrow(/populationSize/);
  });

  it("rejects non-integer populationSize", () => {
    const body = validBody();
    body.config.populationSize = 80.5;
    expect(() => parseOptimizeRequest(body)).toThrow(/populationSize/);
  });

  it("rejects mutationRate out of bounds", () => {
    const body = validBody();
    body.config.mutationRate = 1.5;
    expect(() => parseOptimizeRequest(body)).toThrow(/mutationRate/);
  });

  it("rejects elitismCount > populationSize", () => {
    const body = validBody();
    body.config.elitismCount = 100;
    body.config.populationSize = 10;
    expect(() => parseOptimizeRequest(body)).toThrow(/elitismCount/);
  });
});

describe("requireStartAndEnd", () => {
  it("returns start and end from a valid set", () => {
    const { start, end } = requireStartAndEnd(validPoints());
    expect(start.id).toBe("start");
    expect(end.id).toBe("end");
  });

  it("throws when start is missing", () => {
    const points: Point[] = [
      { id: "s1", lat: 0, lng: 0, role: "stop" },
      { id: "end", lat: 0, lng: 0, role: "end" },
    ];
    expect(() => requireStartAndEnd(points)).toThrow(/start and one end/);
  });

  it("throws when end is missing", () => {
    const points: Point[] = [
      { id: "start", lat: 0, lng: 0, role: "start" },
      { id: "s1", lat: 0, lng: 0, role: "stop" },
    ];
    expect(() => requireStartAndEnd(points)).toThrow(/start and one end/);
  });
});
