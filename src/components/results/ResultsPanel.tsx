"use client";

import { SectionHeader } from "@/components/ui/Section";
import { formatDistance, formatTime } from "@/lib/format";
import type { OptimizeResponse, Point } from "@/lib/types";
import { ConvergenceSparkline } from "./ConvergenceSparkline";
import { ImprovementBanner } from "./ImprovementBanner";
import { MetricCard } from "./MetricCard";
import { RouteToggle } from "./RouteToggle";
import { SequenceDisplay } from "./SequenceDisplay";

interface ResultsPanelProps {
  result: OptimizeResponse;
  points: Point[];
  activeRoute: "ga" | "baseline";
  onActiveRouteChange: (route: "ga" | "baseline") => void;
}

/**
 * Right-hand results sidebar. Pure composition — derived values
 * (improvement %, active sequence, savings) are computed here and
 * passed down as plain props, so sub-components stay free of domain
 * logic.
 */
export default function ResultsPanel({
  result,
  points,
  activeRoute,
  onActiveRouteChange,
}: ResultsPanelProps) {
  const improvementPct = (result.improvementPercent * 100).toFixed(1);
  const activeLabel = activeRoute === "ga" ? "GA" : "Baseline";
  const activeSequence =
    activeRoute === "ga" ? result.ga.sequence : result.baseline.sequence;

  const distanceSaved = result.baseline.totalDistance - result.ga.totalDistance;
  const timeSaved = result.baseline.totalTime - result.ga.totalTime;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <SectionHeader title="Route" />
        <RouteToggle activeRoute={activeRoute} onChange={onActiveRouteChange} />
      </section>

      <section>
        <SectionHeader title="Metrics" />
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Distance"
            gaValue={formatDistance(result.ga.totalDistance)}
            baselineValue={formatDistance(result.baseline.totalDistance)}
          />
          <MetricCard
            label="Time"
            gaValue={formatTime(result.ga.totalTime)}
            baselineValue={formatTime(result.baseline.totalTime)}
          />
        </div>
      </section>

      <ImprovementBanner
        pct={improvementPct}
        distanceSaved={distanceSaved}
        timeSaved={timeSaved}
      />

      <section>
        <SectionHeader title="Route order" hint={activeLabel} />
        <SequenceDisplay sequence={activeSequence} points={points} />
      </section>

      <section>
        <SectionHeader title="Convergence" />
        <ConvergenceSparkline
          history={result.ga.history}
          generationsRun={result.ga.generationsRun}
        />
      </section>
    </div>
  );
}
