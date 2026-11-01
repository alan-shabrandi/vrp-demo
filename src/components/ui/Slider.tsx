"use client";

import type { CSSProperties } from "react";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Formats the readout; defaults to `String(value)`. */
  format?: (value: number) => string;
  onChange: (value: number) => void;
}

/**
 * Labeled range slider.
 *
 * The `.slider` class (see `globals.css`) renders the track, thumb,
 * focus ring, and gradient fill — `--slider-progress` tells it where
 * the filled portion ends.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: SliderProps) {
  const progress = ((value - min) / (max - min)) * 100;
  const display = format ? format(value) : String(value);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-[11px] text-fg-muted">{label}</label>
        <span className="rounded bg-bg/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-fg">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="slider"
        style={{ "--slider-progress": `${progress}%` } as CSSProperties}
        aria-label={label}
      />
    </div>
  );
}
