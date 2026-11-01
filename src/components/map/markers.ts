import L from "leaflet";

/**
 * Leaflet DivIcon factories for map markers.
 *
 * Client-only — imported by `StopMarker`, which lives inside
 * `MapViewWrapper`'s `dynamic(..., { ssr: false })` boundary.
 * Styling lives in `globals.css` under `.vrp-marker*`.
 */

export function makeStartIcon(): L.DivIcon {
  return L.divIcon({
    className: "vrp-marker vrp-marker--start",
    html: `
      <div class="vrp-marker__wrapper">
        <span class="vrp-marker__pulse"></span>
        <span class="vrp-marker__core">A</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  });
}

export function makeEndIcon(): L.DivIcon {
  return L.divIcon({
    className: "vrp-marker vrp-marker--end",
    html: `
      <div class="vrp-marker__wrapper">
        <span class="vrp-marker__pulse"></span>
        <span class="vrp-marker__core">B</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  });
}

export function makeStopIcon(label: string): L.DivIcon {
  return L.divIcon({
    className: "vrp-marker vrp-marker--stop",
    html: `
      <div class="vrp-marker__wrapper">
        <span class="vrp-marker__core">${label}</span>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

/** Start/end icons never change — build once. */
export const START_ICON = makeStartIcon();
export const END_ICON = makeEndIcon();
