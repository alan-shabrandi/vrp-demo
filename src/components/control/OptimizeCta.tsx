"use client";

import { Button } from "@/components/ui/Button";

interface OptimizeCtaProps {
  loading: boolean;
  /** Drives disabled state and the hint; empty array = ready. */
  missing: string[];
  onOptimize: () => void;
}

/**
 * Primary CTA. Disabled while loading or while the point set is
 * incomplete; a hint under the button lists what's missing.
 */
export function OptimizeCta({
  loading,
  missing,
  onOptimize,
}: OptimizeCtaProps) {
  const notReady = missing.length > 0;

  return (
    <div className="pt-1">
      <Button
        variant="primary"
        size="md"
        loading={loading}
        disabled={notReady}
        onClick={onOptimize}
        className="group w-full"
      >
        {!loading && <BoltIcon />}
        {loading ? "Optimizing…" : "Optimize route"}
      </Button>

      {notReady && !loading && (
        <p className="mt-2 text-center font-mono text-[10px] tracking-widest text-fg-dim uppercase">
          Need {missing.join(" · ")}
        </p>
      )}
    </div>
  );
}

function BoltIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 transition-transform group-hover:rotate-12"
    >
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}
