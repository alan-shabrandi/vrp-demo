import type { Point } from "@/lib/types";
import { Button } from "@/components/ui/Button";

interface PointPopupProps {
  point: Point;
  onRemove?: (id: string) => void;
}

/**
 * Content of a marker's Leaflet popup.
 *
 * Rendered inside React's tree — react-leaflet mounts `<Popup>` children
 * as normal React nodes — so Tailwind works and the popup inherits the
 * dark theme via `.leaflet-popup-*` overrides in `globals.css`.
 */
export function PointPopup({ point, onRemove }: PointPopupProps) {
  return (
    <div className="min-w-40">
      <div className="mb-0.5 text-xs font-semibold text-fg">
        {point.label ?? point.id}
      </div>
      <div className="font-mono text-[9px] tracking-[0.12em] text-fg-muted uppercase">
        {point.role}
      </div>
      <div className="mt-1 font-mono text-[10px] text-fg-dim">
        {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
      </div>
      {onRemove && (
        <Button
          variant="danger"
          size="sm"
          onClick={() => onRemove(point.id)}
          className="mt-2.5 w-full"
        >
          Remove point
        </Button>
      )}
    </div>
  );
}
