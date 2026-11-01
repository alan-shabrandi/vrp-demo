import { formatDistance, formatTime } from "@/lib/format";

interface ImprovementBannerProps {
  /** Already formatted as a percentage with one decimal (e.g. "11.1"). */
  pct: string;
  /** Absolute distance saved, in meters. Rendered only if > 0. */
  distanceSaved: number;
  /** Absolute time saved, in seconds. Rendered only if > 0. */
  timeSaved: number;
}

/**
 * Highlighted banner showing the GA's improvement over the baseline.
 * The savings pills only render for positive values, so a GA that
 * ties the baseline shows a percentage but no misleading "saved 0 km".
 */
export function ImprovementBanner({
  pct,
  distanceSaved,
  timeSaved,
}: ImprovementBannerProps) {
  const hasSavings = distanceSaved > 0 || timeSaved > 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-success/30 bg-linear-to-br from-success/8 to-transparent px-4 py-3">
      <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-success/20 blur-2xl" />
      <div className="relative">
        <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[9px] tracking-[0.15em] text-success/80 uppercase">
          <BoltIcon />
          Improvement over baseline
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-2xl leading-none font-bold text-success">
            {pct}
          </span>
          <span className="font-mono text-sm text-success/70">%</span>
        </div>
        {hasSavings && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-fg-muted">
            {distanceSaved > 0 && (
              <span>
                <span className="text-fg-dim">saved </span>
                <span className="text-fg">{formatDistance(distanceSaved)}</span>
              </span>
            )}
            {timeSaved > 0 && (
              <span>
                <span className="text-fg-dim">saved </span>
                <span className="text-fg">{formatTime(timeSaved)}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BoltIcon() {
  return (
    <svg
      className="h-2.5 w-2.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}
