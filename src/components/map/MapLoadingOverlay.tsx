/**
 * Translucent overlay while an optimize request is in flight. Uses a
 * pulsing ring (not the standard spinner) so it reads as "a route is
 * being computed" rather than "the page is loading". Pointer events
 * pass through so the user can still pan while waiting.
 */
export default function MapLoadingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-500 flex animate-[fade-in_0.2s_ease-out] items-center justify-center bg-bg/25 backdrop-blur-[2px]">
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-elevated/95 px-4 py-2.5 shadow-2xl">
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-route-ga opacity-75" />
          <span className="relative h-2 w-2 rounded-full bg-route-ga" />
        </span>
        <span className="font-mono text-[11px] text-route-ga">
          Evolving route…
        </span>
      </div>
    </div>
  );
}
