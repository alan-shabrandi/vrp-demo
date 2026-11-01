"use client";

import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { summarizePointSet } from "@/lib/points";
import type { GAConfig, Point, PointRole, Preset } from "@/lib/types";
import { ErrorBanner } from "./ErrorBanner";
import { GAParameterSliders } from "./GAParameterSliders";
import { OptimizeCta } from "./OptimizeCta";
import { PointList } from "./PointList";
import { PointModeSelector } from "./PointModeSelector";
import { PresetSelector } from "./PresetSelector";

interface ControlPanelProps {
  points: Point[];
  config: GAConfig;
  clickMode: PointRole;
  loading: boolean;
  error: string | null;
  presets: Preset[];
  onPresetLoad: (preset: Preset) => void;
  onConfigChange: (config: GAConfig) => void;
  onModeChange: (mode: PointRole) => void;
  onRemovePoint: (id: string) => void;
  onReset: () => void;
  onOptimize: () => void;
}

/**
 * Left-hand controls sidebar. Composition shell — every section is
 * delegated to a sibling. Owns only the `summarizePointSet` derivation
 * and callback pass-through.
 */
export default function ControlPanel({
  points,
  config,
  clickMode,
  loading,
  error,
  presets,
  onPresetLoad,
  onConfigChange,
  onModeChange,
  onRemovePoint,
  onReset,
  onOptimize,
}: ControlPanelProps) {
  const { missing } = summarizePointSet(points);

  return (
    <div className="flex flex-col gap-7">
      <Section title="Presets" hint="Load a scenario to get started fast.">
        <PresetSelector
          presets={presets}
          loading={loading}
          onLoad={onPresetLoad}
        />
      </Section>

      <Section title="Points">
        <PointModeSelector mode={clickMode} onChange={onModeChange} />
        <PointList points={points} onRemove={onRemovePoint} />
        <p className="mb-3 text-[11px] leading-relaxed text-fg-muted">
          Click on the map to place a{" "}
          <span className="font-mono text-fg">{clickMode}</span> point.
        </p>
        <Button
          variant="secondary"
          size="sm"
          disabled={loading}
          onClick={onReset}
          className="w-full"
        >
          Reset points
        </Button>
      </Section>

      <Section title="GA parameters">
        <GAParameterSliders config={config} onChange={onConfigChange} />
      </Section>

      {error && <ErrorBanner message={error} />}

      <OptimizeCta
        loading={loading}
        missing={missing}
        onOptimize={onOptimize}
      />
    </div>
  );
}
