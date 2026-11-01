interface MetricCardProps {
  label: string;
  gaValue: string;
  baselineValue: string;
}

/**
 * Compact metric block: one measurement for both routes side by side.
 * Inputs are pre-formatted strings — purely presentational.
 */
export function MetricCard({ label, gaValue, baselineValue }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="mb-2 font-mono text-[9px] tracking-[0.15em] text-fg-dim uppercase">
        {label}
      </div>
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-1.5">
          <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-wider text-route-ga uppercase">
            <span className="h-1 w-1 rounded-full bg-route-ga" />
            GA
          </span>
          <span className="font-mono text-sm font-semibold text-fg">
            {gaValue}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-1.5">
          <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-wider text-fg-dim uppercase">
            <span className="h-1 w-1 rounded-full bg-route-baseline" />
            Base
          </span>
          <span className="font-mono text-xs text-fg-muted">
            {baselineValue}
          </span>
        </div>
      </div>
    </div>
  );
}
