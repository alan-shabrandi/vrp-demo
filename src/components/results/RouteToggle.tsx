"use client";

interface RouteToggleProps {
  activeRoute: "ga" | "baseline";
  onChange: (route: "ga" | "baseline") => void;
}

/**
 * Two-way toggle between the GA route and the nearest-neighbor baseline.
 * The active dot takes on the route's polyline color (blue / orange)
 * so the map connection stays obvious.
 */
export function RouteToggle({ activeRoute, onChange }: RouteToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-bg/60 p-1">
      <RouteToggleOption
        active={activeRoute === "ga"}
        color="var(--color-route-ga)"
        onClick={() => onChange("ga")}
      >
        GA
      </RouteToggleOption>
      <RouteToggleOption
        active={activeRoute === "baseline"}
        color="var(--color-route-baseline)"
        onClick={() => onChange("baseline")}
      >
        Baseline
      </RouteToggleOption>
    </div>
  );
}

function RouteToggleOption({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-all duration-150 ${
        active
          ? "bg-surface-hover text-fg shadow-sm"
          : "text-fg-muted hover:text-fg"
      }`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full transition-all"
        style={{
          background: active ? color : "var(--color-fg-dim)",
          boxShadow: active ? `0 0 8px ${color}` : "none",
        }}
      />
      {children}
    </button>
  );
}
