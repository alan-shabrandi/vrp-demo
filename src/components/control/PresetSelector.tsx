"use client";

import { Button } from "@/components/ui/Button";
import type { Preset } from "@/lib/types";

interface PresetSelectorProps {
  presets: Preset[];
  loading: boolean;
  onLoad: (preset: Preset) => void;
}

/** Vertical list of preset scenarios, each a full-width secondary button. */
export function PresetSelector({
  presets,
  loading,
  onLoad,
}: PresetSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {presets.map((preset) => (
        <Button
          key={preset.key}
          variant="secondary"
          size="sm"
          disabled={loading}
          onClick={() => onLoad(preset)}
          className="group justify-between hover:border-route-ga/40 hover:bg-route-ga-soft hover:text-route-ga"
        >
          <span className="flex items-center gap-2 truncate">
            <PinIcon />
            <span className="truncate">{preset.name}</span>
          </span>
          <ArrowRightIcon />
        </Button>
      ))}
    </div>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0 text-fg-muted group-hover:text-route-ga"
    >
      <path d="M12 22s-8-7.5-8-13a8 8 0 0 1 16 0c0 5.5-8 13-8 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
