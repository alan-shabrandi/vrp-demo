import type { Point } from "@/lib/types";
import { PointListRow } from "./PointListRow";

interface PointListProps {
  points: Point[];
  onRemove: (id: string) => void;
}

/** Scrollable list of placed points, with a dashed empty state. */
export function PointList({ points, onRemove }: PointListProps) {
  return (
    <ul className="mb-3 max-h-48 space-y-1 overflow-y-auto pr-1">
      {points.length === 0 && (
        <li className="rounded-md border border-dashed border-border px-3 py-4 text-center text-[11px] text-fg-dim">
          No points yet
        </li>
      )}
      {points.map((p) => (
        <PointListRow key={p.id} point={p} onRemove={onRemove} />
      ))}
    </ul>
  );
}
