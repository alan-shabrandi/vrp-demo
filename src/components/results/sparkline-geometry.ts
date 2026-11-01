import type { FitnessHistoryPoint } from "@/lib/types";

export const SPARKLINE_WIDTH = 320;
export const SPARKLINE_HEIGHT = 100;
export const SPARKLINE_PAD = 10;

export interface SparklineGeometry {
  viewBox: string;
  bestPath: string;
  avgPath: string;
  fillPath: string;
  /** Y coordinates for the three dashed guide lines (25%, 50%, 75%). */
  gridYPositions: number[];
  /** Endpoint of the `best` curve — for the terminal dot. */
  endX: number;
  endY: number;
  /** Changes whenever the first or last `best` value changes. */
  animationKey: string;
}

/**
 * Pure geometry for the convergence chart.
 *
 * Y axis is inverted (higher fitness → lower pixel Y) because SVG's
 * origin is top-left, but "lower fitness is better" means the useful
 * area of the chart is the bottom.
 *
 * @throws if `history.length < 2` — the caller must guard.
 */
export function computeSparklineGeometry(
  history: FitnessHistoryPoint[],
): SparklineGeometry {
  if (history.length < 2) {
    throw new Error(
      "computeSparklineGeometry requires at least 2 history points",
    );
  }

  const innerW = SPARKLINE_WIDTH - 2 * SPARKLINE_PAD;
  const innerH = SPARKLINE_HEIGHT - 2 * SPARKLINE_PAD;

  const max = Math.max(...history.map((h) => Math.max(h.best, h.average)));
  const min = Math.min(...history.map((h) => Math.min(h.best, h.average)));
  const range = max - min || 1;

  const getX = (i: number) =>
    SPARKLINE_PAD + (i / (history.length - 1)) * innerW;
  const getY = (v: number) =>
    SPARKLINE_HEIGHT - SPARKLINE_PAD - ((v - min) / range) * innerH;

  const buildPath = (key: "best" | "average") =>
    history
      .map(
        (h, i) =>
          `${i === 0 ? "M" : "L"} ${getX(i).toFixed(2)} ${getY(h[key]).toFixed(2)}`,
      )
      .join(" ");

  const bestPath = buildPath("best");
  const avgPath = buildPath("average");

  const endX = getX(history.length - 1);
  const endY = getY(history[history.length - 1].best);
  const fillPath = `${bestPath} L ${endX.toFixed(2)} ${SPARKLINE_HEIGHT - SPARKLINE_PAD} L ${SPARKLINE_PAD} ${SPARKLINE_HEIGHT - SPARKLINE_PAD} Z`;

  return {
    viewBox: `0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`,
    bestPath,
    avgPath,
    fillPath,
    gridYPositions: [0.25, 0.5, 0.75].map((p) => SPARKLINE_PAD + p * innerH),
    endX,
    endY,
    animationKey: `${history[0].best}-${history[history.length - 1].best}`,
  };
}
