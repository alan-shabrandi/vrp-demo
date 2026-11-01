import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-6 w-6",
};

interface SpinnerProps {
  size?: SpinnerSize;
  /** Extra classes — useful for color overrides (e.g. `text-[var(--color-route-ga)]`). */
  className?: string;
}

/**
 * Circular loading indicator. The stroke is `currentColor`, so it
 * inherits from the parent — dark inside a primary button, light on a
 * dark surface. Override via `className`.
 */
export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
        SIZE_CLASSES[size],
        className,
      )}
    />
  );
}
