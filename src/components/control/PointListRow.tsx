import { ROLE_META } from "@/lib/role-meta";
import type { Point } from "@/lib/types";

interface PointListRowProps {
  point: Point;
  onRemove: (id: string) => void;
}

/** One row: role badge · label · remove button. */
export function PointListRow({ point, onRemove }: PointListRowProps) {
  const meta = ROLE_META[point.role];
  const displayName = point.label ?? point.id;

  return (
    <li className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 transition-colors hover:border-border-strong">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
          style={{
            background: meta.bg,
            color: meta.color,
            border: `1px solid ${meta.border}`,
          }}
        >
          {meta.short}
        </span>
        <span className="truncate text-xs text-fg">{displayName}</span>
      </div>
      <button
        type="button"
        onClick={() => onRemove(point.id)}
        aria-label={`Remove ${displayName}`}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-fg-dim transition-colors hover:bg-danger/15 hover:text-danger"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="h-3 w-3"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </li>
  );
}
