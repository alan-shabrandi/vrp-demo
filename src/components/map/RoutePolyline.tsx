"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { Polyline } from "react-leaflet";
import type { Point } from "@/lib/types";

const ROUTE_GA = "#4f9eff";
const ROUTE_BASELINE = "#ff6b4a";

interface RoutePolylineProps {
  points: Point[];
  route: string[];
  variant: "ga" | "baseline";
}

/**
 * The route polyline, in two layers (ambient glow + crisp stroke).
 *
 * The GA variant plays a draw-in animation on every new solution:
 * measure the SVG path, set dasharray/offset, force reflow, then
 * transition offset → 0. Baseline renders dashed with no animation —
 * its `dashArray` would collide with the draw-in's `strokeDasharray`.
 */
export function RoutePolyline({ points, route, variant }: RoutePolylineProps) {
  const isBaseline = variant === "baseline";
  const routeColor = isBaseline ? ROUTE_BASELINE : ROUTE_GA;

  const positions = useMemo<[number, number][]>(() => {
    if (route.length < 2) return [];
    const byId = new Map(points.map((p) => [p.id, p]));
    const out: [number, number][] = [];
    for (const id of route) {
      const p = byId.get(id);
      if (p) out.push([p.lat, p.lng]);
    }
    return out;
  }, [points, route]);

  const lineKey = route.join("-");
  const lineRef = useRef<L.Polyline>(null);

  useLayoutEffect(() => {
    if (isBaseline) return;
    const el = lineRef.current?.getElement?.() as SVGPathElement | null;
    if (!el) return;
    const len = Math.ceil(el.getTotalLength());
    if (!len) return;

    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    el.style.transition = "none";
    // Force reflow so the transition doesn't collapse into the same frame.
    void el.getBoundingClientRect();
    el.style.transition =
      "stroke-dashoffset 1.3s cubic-bezier(0.22, 1, 0.36, 1)";
    el.style.strokeDashoffset = "0";
  }, [lineKey, isBaseline]);

  if (positions.length < 2) return null;

  return (
    <>
      {/* Ambient glow layer */}
      <Polyline
        key={`glow-${lineKey}`}
        positions={positions}
        pathOptions={{
          color: routeColor,
          weight: 12,
          opacity: isBaseline ? 0.1 : 0.18,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      {/* Main line — ref is only needed for the animated GA variant */}
      <Polyline
        ref={lineRef}
        key={`line-${lineKey}`}
        positions={positions}
        pathOptions={{
          color: routeColor,
          weight: isBaseline ? 3 : 3.5,
          opacity: 0.95,
          ...(isBaseline ? { dashArray: "8 8" } : {}),
        }}
        className={isBaseline ? undefined : "route-line"}
      />
    </>
  );
}
