import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  /** Right-aligned hint (e.g., "Load a scenario to get started fast."). */
  hint?: string;
  children: ReactNode;
}

/** Titled block for grouping related controls. */
export function Section({ title, hint, children }: SectionProps) {
  return (
    <section>
      <SectionHeader title={title} hint={hint} />
      {children}
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  hint?: string;
}

/** Header row alone, for callers that own the wrapping element. */
export function SectionHeader({ title, hint }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="font-mono text-[10px] font-medium tracking-[0.15em] text-fg-dim uppercase">
        {title}
      </h2>
      {hint && (
        <span className="font-mono text-[10px] tracking-[0.12em] text-fg-dim uppercase">
          {hint}
        </span>
      )}
    </div>
  );
}
