import type { Preset, Point } from "./types";

/** First-load points: Tehran (Azadi → Tajrish). Placeholder for the user. */
export const INITIAL_POINTS: Point[] = [
  { id: "start", lat: 35.6892, lng: 51.389, role: "start", label: "Start" },
  { id: "end", lat: 35.7795, lng: 51.4033, role: "end", label: "End" },
];

/**
 * Demo scenarios. Kept in `lib/` (not the page) so tests, alternative
 * UIs, and URL-state hydration can consume them without importing page state.
 */
export const PRESETS: Preset[] = [
  {
    key: "downtown",
    name: "Downtown Tehran",
    points: [
      { id: "start", lat: 35.6892, lng: 51.389, role: "start", label: "Start" },
      { id: "s1", lat: 35.7005, lng: 51.4013, role: "stop", label: "Stop 1" },
      { id: "s2", lat: 35.7309, lng: 51.4205, role: "stop", label: "Stop 2" },
      { id: "s3", lat: 35.7124, lng: 51.3501, role: "stop", label: "Stop 3" },
      { id: "s4", lat: 35.722, lng: 51.445, role: "stop", label: "Stop 4" },
      { id: "s5", lat: 35.7448, lng: 51.3753, role: "stop", label: "Stop 5" },
      { id: "end", lat: 35.7795, lng: 51.4033, role: "end", label: "End" },
    ],
  },
  {
    key: "cross-city",
    name: "Cross-city (West → East)",
    points: [
      { id: "start", lat: 35.7, lng: 51.3, role: "start", label: "Start" },
      { id: "s1", lat: 35.71, lng: 51.34, role: "stop", label: "Stop 1" },
      { id: "s2", lat: 35.72, lng: 51.38, role: "stop", label: "Stop 2" },
      { id: "s3", lat: 35.73, lng: 51.42, role: "stop", label: "Stop 3" },
      { id: "s4", lat: 35.74, lng: 51.46, role: "stop", label: "Stop 4" },
      { id: "end", lat: 35.75, lng: 51.5, role: "end", label: "End" },
    ],
  },
  {
    key: "grid",
    name: "Grid (many stops)",
    points: [
      { id: "start", lat: 35.68, lng: 51.37, role: "start", label: "Start" },
      { id: "s1", lat: 35.69, lng: 51.4, role: "stop", label: "Stop 1" },
      { id: "s2", lat: 35.7, lng: 51.37, role: "stop", label: "Stop 2" },
      { id: "s3", lat: 35.71, lng: 51.4, role: "stop", label: "Stop 3" },
      { id: "s4", lat: 35.72, lng: 51.37, role: "stop", label: "Stop 4" },
      { id: "s5", lat: 35.73, lng: 51.4, role: "stop", label: "Stop 5" },
      { id: "s6", lat: 35.74, lng: 51.37, role: "stop", label: "Stop 6" },
      { id: "s7", lat: 35.75, lng: 51.4, role: "stop", label: "Stop 7" },
      { id: "end", lat: 35.76, lng: 51.37, role: "end", label: "End" },
    ],
  },
];
