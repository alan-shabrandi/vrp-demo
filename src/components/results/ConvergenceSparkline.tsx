"use client";

import { useId } from "react";
import type { FitnessHistoryPoint } from "@/lib/types";
import { computeSparklineGeometry } from "./sparkline-geometry";

interface ConvergenceSparklineProps {
  history: FitnessHistoryPoint[];
  /** Total generations actually run (shown in the bottom-right legend). */
  generationsRun: number;
}

/**
 * Inline SVG convergence chart: best (solid, animated) vs average
 * (dashed, muted) per generation, with a gradient fill under the best
 * curve.
 *
 * Gradient ID comes from `useId()` so multiple instances on one page
 * don't collide — a hardcoded ID would resolve every `url(#id)` to the
 * first instance.
 */
export function ConvergenceSparkline({
  history,
  generationsRun,
}: ConvergenceSparklineProps) {
  const gradientId = useId();

  if (history.length < 2) return null;

  const g = computeSparklineGeometry(history);

  return (
    <div>
      <svg
        key={g.animationKey}
        viewBox={g.viewBox}
        className="w-full overflow-visible"
        role="img"
        aria-label="Convergence history of the genetic algorithm"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-route-ga)"
              stopOpacity="0.32"
            />
            <stop
              offset="100%"
              stopColor="var(--color-route-ga)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {g.gridYPositions.map((y) => (
          <line
            key={y}
            x1={10}
            y1={y}
            x2={310}
            y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="2 4"
          />
        ))}

        <path
          d={g.fillPath}
          fill={`url(#${gradientId})`}
          style={{ animation: "fade-in 0.8s ease-out 0.9s both" }}
        />

        <path
          d={g.avgPath}
          fill="none"
          stroke="var(--color-fg-dim)"
          strokeWidth="1.2"
          strokeDasharray="3 4"
          strokeLinecap="round"
        />

        <path
          d={g.bestPath}
          fill="none"
          stroke="var(--color-route-ga)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: 1,
            animation:
              "sparkline-draw 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards",
            filter: "drop-shadow(0 0 4px rgba(79, 158, 255, 0.5))",
          }}
        />

        <circle
          cx={g.endX}
          cy={g.endY}
          r="3.5"
          fill="var(--color-route-ga)"
          stroke="var(--color-bg)"
          strokeWidth="1.5"
          style={{ animation: "fade-in 0.3s ease-out 1.4s both" }}
        />
      </svg>

      <SparklineLegend generationsRun={generationsRun} />
    </div>
  );
}

function SparklineLegend({ generationsRun }: { generationsRun: number }) {
  return (
    <div className="mt-2 flex items-center justify-between font-mono text-[9px] tracking-[0.12em] text-fg-dim uppercase">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-3 rounded bg-route-ga" />
          best
        </span>
        <span className="flex items-center gap-1">
          <span className="h-0 w-3 border-t border-dashed border-fg-dim" />
          average
        </span>
      </div>
      <span>{generationsRun} gens</span>
    </div>
  );
}
