interface MapHUDProps {
  stopCount: number;
  ready: boolean;
}

/**
 * Floating heads-up display in the map's top-right. Zero-pads the stop
 * count; warns when the point set is incomplete. `pointer-events-none`
 * lets map drags pass through.
 */
export default function MapHUD({ stopCount, ready }: MapHUDProps) {
  return (
    <div className="pointer-events-none absolute top-3 right-3 z-400 animate-[fade-in_0.4s_ease-out] rounded-xl border border-border bg-bg-elevated/80 px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="font-mono text-[9px] tracking-[0.15em] text-fg-dim uppercase">
        Stops
      </div>
      <div className="font-mono text-lg leading-tight font-semibold text-fg">
        {String(stopCount).padStart(2, "0")}
      </div>
      {!ready && (
        <div className="mt-0.5 font-mono text-[9px] text-warning">
          Need A &amp; B
        </div>
      )}
    </div>
  );
}
