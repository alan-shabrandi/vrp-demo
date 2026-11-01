"use client";

export type MobileTab = "controls" | "results";

interface MobileTabBarProps {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
  hasResult: boolean;
}

/**
 * Bottom tab bar for mobile. "Results" is disabled until a run
 * completes to prevent opening to an empty state; the parent
 * auto-switches on run completion (see `page.tsx`).
 * `env(safe-area-inset-bottom)` respects the iOS home indicator.
 */
export default function MobileTabBar({
  active,
  onChange,
  hasResult,
}: MobileTabBarProps) {
  return (
    <nav className="relative z-20 flex shrink-0 border-t border-border bg-bg-elevated/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <TabButton
        active={active === "controls"}
        onClick={() => onChange("controls")}
      >
        Controls
      </TabButton>
      <TabButton
        active={active === "results"}
        disabled={!hasResult}
        onClick={() => onChange("results")}
      >
        Results
      </TabButton>
    </nav>
  );
}

function TabButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative flex-1 py-3 font-mono text-[11px] font-medium tracking-widest uppercase transition-colors disabled:opacity-40 ${
        active ? "text-route-ga" : "text-fg-muted"
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-route-ga" />
      )}
    </button>
  );
}
