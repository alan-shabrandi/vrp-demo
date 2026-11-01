"use client";

import { ROLE_META, ROLE_ORDER } from "@/lib/role-meta";
import type { PointRole } from "@/lib/types";

interface PointModeSelectorProps {
  mode: PointRole;
  onChange: (mode: PointRole) => void;
}

/**
 * Three-way toggle: which role the next map click will create.
 * Colors mirror the map markers so the connection is obvious.
 */
export function PointModeSelector({ mode, onChange }: PointModeSelectorProps) {
  return (
    <div className="mb-3 grid grid-cols-3 gap-1 rounded-lg border border-border bg-bg/50 p-1">
      {ROLE_ORDER.map((role) => {
        const meta = ROLE_META[role];
        const active = mode === role;
        return (
          <button
            key={role}
            type="button"
            onClick={() => onChange(role)}
            aria-pressed={active}
            className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-all duration-150 ${
              active
                ? "bg-surface-hover text-fg shadow-sm"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            <span
              className="h-2 w-2 rounded-full transition-shadow"
              style={{
                background: meta.color,
                boxShadow: active ? `0 0 8px ${meta.color}` : "none",
              }}
            />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
