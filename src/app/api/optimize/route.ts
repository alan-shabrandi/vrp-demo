import { NextRequest, NextResponse } from "next/server";
import { computeImprovement } from "@/lib/distance";
import { solveGA } from "@/lib/ga";
import { solveNearestNeighbor } from "@/lib/nearest-neighbor";
import { parseOptimizeRequest, ValidationError } from "@/lib/validation";
import type { OptimizeRequest, OptimizeResponse } from "@/lib/types";

/**
 * POST /api/optimize — thin HTTP wrapper: parse → validate → solve → respond.
 * All validation and algorithm logic lives in `lib/`.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  let parsed: OptimizeRequest;
  try {
    parsed = parseOptimizeRequest(body);
  } catch (err) {
    const message =
      err instanceof ValidationError ? err.message : "Invalid request";
    return errorResponse(message, 400);
  }

  try {
    const ga = solveGA(parsed.points, parsed.config);
    const baseline = solveNearestNeighbor(parsed.points, parsed.config);
    const improvementPercent = computeImprovement(baseline.fitness, ga.fitness);

    const response: OptimizeResponse = { ga, baseline, improvementPercent };
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Solver failed";
    return errorResponse(message, 500);
  }
}

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
