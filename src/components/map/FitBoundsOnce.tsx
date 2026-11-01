"use client";

import { useLayoutEffect, useRef } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import type { Point } from "@/lib/types";

interface FitBoundsOnceProps {
  points: Point[];
}

/**
 * Fit the viewport to the given points, exactly once per mount.
 * Re-fitting (preset load, point reset) is handled by remounting
 * `MapView` — cheaper to reason about than imperative `fitBounds`.
 */
export function FitBoundsOnce({ points }: FitBoundsOnceProps) {
  const map = useMap();
  const fitted = useRef(false);

  useLayoutEffect(() => {
    if (fitted.current || points.length < 2) return;
    const bounds = L.latLngBounds(
      points.map((p) => [p.lat, p.lng] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    fitted.current = true;
  }, [map, points]);

  return null;
}
