"use client";

import { useMapEvents } from "react-leaflet";

interface MapClickHandlerProps {
  onClick?: (lat: number, lng: number) => void;
}

/** Forwards Leaflet `click` events to the parent as `(lat, lng)`. */
export function MapClickHandler({ onClick }: MapClickHandlerProps) {
  useMapEvents({
    click(event) {
      onClick?.(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}
