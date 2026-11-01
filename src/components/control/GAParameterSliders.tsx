"use client";

import { Slider } from "@/components/ui/Slider";
import type { GAConfig } from "@/lib/types";

interface GAParameterSlidersProps {
  config: GAConfig;
  onChange: (config: GAConfig) => void;
}

/**
 * Objective selector + five numeric GA parameter sliders.
 *
 * Slider min/max mirror `GA_CONFIG_BOUNDS` for UX only — the API is the
 * actual security boundary.
 */
export function GAParameterSliders({
  config,
  onChange,
}: GAParameterSlidersProps) {
  return (
    <>
      <div className="mb-4">
        <label
          htmlFor="objective-select"
          className="mb-1.5 block text-[11px] text-fg-muted"
        >
          Objective
        </label>
        <div className="relative">
          <select
            id="objective-select"
            value={config.objective}
            onChange={(event) =>
              onChange({
                ...config,
                objective: event.target.value as GAConfig["objective"],
              })
            }
            className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-bg/60 px-3 py-2 pr-8 text-xs text-fg transition-colors hover:border-border-strong focus:border-route-ga/60"
          >
            <option value="distance">Minimize distance</option>
            <option value="time">Minimize time</option>
          </select>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      <div className="space-y-4">
        <Slider
          label="Population size"
          value={config.populationSize}
          min={10}
          max={300}
          step={10}
          onChange={(v) => onChange({ ...config, populationSize: v })}
        />
        <Slider
          label="Generations"
          value={config.generations}
          min={10}
          max={500}
          step={10}
          onChange={(v) => onChange({ ...config, generations: v })}
        />
        <Slider
          label="Mutation rate"
          value={config.mutationRate}
          min={0}
          max={1}
          step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(v) => onChange({ ...config, mutationRate: v })}
        />
        <Slider
          label="Elitism count"
          value={config.elitismCount}
          min={1}
          max={10}
          step={1}
          onChange={(v) => onChange({ ...config, elitismCount: v })}
        />
        <Slider
          label="Tournament size"
          value={config.tournamentSize}
          min={2}
          max={10}
          step={1}
          onChange={(v) => onChange({ ...config, tournamentSize: v })}
        />
      </div>
    </>
  );
}
