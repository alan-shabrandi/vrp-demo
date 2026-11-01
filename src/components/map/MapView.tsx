"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import type { Point } from "@/lib/types";
import { FitBoundsOnce } from "./FitBoundsOnce";
import { MapClickHandler } from "./MapClickHandler";
import { RoutePolyline } from "./RoutePolyline";
import { StopMarker } from "./StopMarker";
import { useStopNumbers } from "./useStopNumbers";

export interface MapViewProps {
  points: Point[];
  route?: string[];
  /** Which algorithm produced `route` — controls polyline styling. */
  variant?: "ga" | "baseline";
  onMapClick?: (lat: number, lng: number) => void;
  onRemovePoint?: (id: string) => void;
}

/**
 * The interactive map. Intentionally thin — composes siblings and owns
 * no domain logic. Sub-concerns: `markers.ts` (icons), `useStopNumbers`
 * (numbering), `RoutePolyline` (polyline + draw-in), `StopMarker` +
 * `PointPopup` (marker + popup), `FitBoundsOnce` (first-mount fit),
 * `MapClickHandler` (clicks).
 */
export default function MapView({
  points,
  route,
  variant = "ga",
  onMapClick,
  onRemovePoint,
}: MapViewProps) {
  const stopNumbers = useStopNumbers(points, route);

  const center: [number, number] =
    points.length > 0 ? [points[0].lat, points[0].lng] : [35.6892, 51.389];

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%", background: "#0a0b0f" }}
        zoomControl
      >
        <TileLayer
          attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a> — Esri, DeLorme, NAVTEQ'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />

        <FitBoundsOnce points={points} />

        {route && route.length > 1 && (
          <RoutePolyline points={points} route={route} variant={variant} />
        )}

        {points.map((p) => (
          <StopMarker
            key={p.id}
            point={p}
            stopNumber={stopNumbers.get(p.id)}
            onRemove={onRemovePoint}
          />
        ))}

        <MapClickHandler onClick={onMapClick} />
      </MapContainer>
    </div>
  );
}
