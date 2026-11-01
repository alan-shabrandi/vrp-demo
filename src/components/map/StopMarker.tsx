"use client";

import { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import type { Point } from "@/lib/types";
import { END_ICON, START_ICON, makeStopIcon } from "./markers";
import { PointPopup } from "./PointPopup";

interface StopMarkerProps {
  point: Point;
  /** Visit-order (or creation-order) number, only used for `role === "stop"`. */
  stopNumber?: number;
  onRemove?: (id: string) => void;
}

/**
 * A single marker. Picks the icon by role, ensures start/end paint
 * above stops (`zIndexOffset`), and renders the shared popup.
 */
export function StopMarker({ point, stopNumber, onRemove }: StopMarkerProps) {
  const icon = useMemo(() => {
    if (point.role === "start") return START_ICON;
    if (point.role === "end") return END_ICON;
    return makeStopIcon(String(stopNumber ?? "•"));
  }, [point.role, stopNumber]);

  return (
    <Marker
      position={[point.lat, point.lng]}
      icon={icon}
      zIndexOffset={point.role === "stop" ? 0 : 1000}
    >
      <Popup>
        <PointPopup point={point} onRemove={onRemove} />
      </Popup>
    </Marker>
  );
}
