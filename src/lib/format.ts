/** Human-readable formatting for route metrics. Pure, framework-free. */

/** 12345.6 → "12.35 km" */
export function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * 12345.6 seconds → "3h 25m" (or "5m 5s" / "12s").
 * Seconds are omitted above 1 hour — at typical route durations they
 * add noise without adding information.
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
