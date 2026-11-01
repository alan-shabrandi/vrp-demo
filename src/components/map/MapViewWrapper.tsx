"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/Spinner";
import type { Point } from "@/lib/types";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-bg text-route-ga">
      <div className="flex flex-col items-center gap-2.5">
        <Spinner size="lg" />
        <span className="font-mono text-[11px] tracking-wide text-fg-muted">
          Loading map…
        </span>
      </div>
    </div>
  ),
});

interface MapViewWrapperProps {
  points: Point[];
  route?: string[];
  variant?: "ga" | "baseline";
  onMapClick?: (lat: number, lng: number) => void;
  onRemovePoint?: (id: string) => void;
}

export default function MapViewWrapper(props: MapViewWrapperProps) {
  return <MapView {...props} />;
}
