import { Fragment } from "react";
import { ROLE_META } from "@/lib/role-meta";
import type { Point, PointRole } from "@/lib/types";

interface SequenceDisplayProps {
  /** Full route, including start and end IDs. */
  sequence: string[];
  points: Point[];
}

interface SequenceItem {
  id: string;
  point: Point;
  display: string;
}

/**
 * The visit order as numbered chips connected by arrows. Chip colors
 * come from `lib/role-meta` so they match the map markers. Stops are
 * renumbered 1..n in visit order; start and end show as "A" and "B".
 */
export function SequenceDisplay({ sequence, points }: SequenceDisplayProps) {
  const byId = new Map(points.map((p) => [p.id, p]));

  // Pre-compute display labels before rendering — no mutation inside
  // `map()`. Unknown IDs are dropped (defensive: the solvers never
  // produce them, but a malformed route shouldn't crash the panel).
  const items: SequenceItem[] = [];
  let visitIndex = 0;
  for (const id of sequence) {
    const point = byId.get(id);
    if (!point) continue;
    const display =
      point.role === "start"
        ? "A"
        : point.role === "end"
          ? "B"
          : String(++visitIndex);
    items.push({ id, point, display });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
      {items.map((item, i) => (
        <Fragment key={item.id}>
          <SequenceChip
            label={item.display}
            title={item.point.label ?? item.id}
            role={item.point.role}
          />
          {i < items.length - 1 && <ArrowIcon />}
        </Fragment>
      ))}
    </div>
  );
}

function SequenceChip({
  label,
  title,
  role,
}: {
  label: string;
  title: string;
  role: PointRole;
}) {
  const meta = ROLE_META[role];
  return (
    <span
      title={title}
      className="inline-flex h-5 min-w-5 cursor-default items-center justify-center rounded-full border px-1 font-mono text-[9px] font-bold transition-transform hover:scale-110"
      style={{
        background: meta.bg,
        color: meta.color,
        borderColor: meta.border,
      }}
    >
      {label}
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="h-2.5 w-2.5 shrink-0 text-fg-dim"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
