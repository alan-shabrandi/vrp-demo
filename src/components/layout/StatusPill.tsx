"use client";

export interface StatusPillProps {
  ready: boolean;
  loading: boolean;
  hasResult: boolean;
  stopCount: number;
  /** Fraction in [0, 1], only meaningful when `hasResult` is true. */
  improvement?: number;
}

/**
 * Four-state status indicator — the single source of truth for
 * "what is the app doing right now?":
 *
 *   Add points to start → Ready · N stops → Optimizing… → X% better
 */
export function StatusPill({
  ready,
  loading,
  hasResult,
  stopCount,
  improvement,
}: StatusPillProps) {
  const base =
    "flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px] whitespace-nowrap transition-colors";

  if (loading) {
    return (
      <div
        className={`${base} border border-route-ga/30 bg-route-ga-soft text-route-ga`}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-route-ga" />
        Optimizing…
      </div>
    );
  }

  if (hasResult && improvement !== undefined) {
    return (
      <div
        className={`${base} border border-success/30 bg-success-soft text-success`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3 w-3"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
        <span>{(improvement * 100).toFixed(1)}% better</span>
      </div>
    );
  }

  if (ready) {
    return (
      <div className={`${base} border border-border bg-surface text-fg-muted`}>
        <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_var(--color-success)]" />
        <span>
          Ready · {stopCount} stop{stopCount === 1 ? "" : "s"}
        </span>
      </div>
    );
  }

  return (
    <div className={`${base} border border-border bg-surface text-fg-muted`}>
      <span className="h-1.5 w-1.5 rounded-full bg-warning" />
      <span>Add points to start</span>
    </div>
  );
}
