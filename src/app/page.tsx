"use client";

import { useCallback, useMemo, useState } from "react";
import ControlPanel from "@/components/control/ControlPanel";
import Header from "@/components/layout/Header";
import MobileTabBar, { type MobileTab } from "@/components/layout/MobileTabBar";
import MapHUD from "@/components/map/MapHUD";
import MapLoadingOverlay from "@/components/map/MapLoadingOverlay";
import MapViewWrapper from "@/components/map/MapViewWrapper";
import ResultsPanel from "@/components/results/ResultsPanel";
import { useDynamicTitle } from "@/hooks/useDynamicTitle";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { useOptimize } from "@/hooks/useOptimize";
import { DEFAULT_GA_CONFIG } from "@/lib/constants";
import { placePoint, summarizePointSet } from "@/lib/points";
import { INITIAL_POINTS, PRESETS } from "@/lib/presets";
import type { GAConfig, Point, PointRole, Preset } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Home() {
  const [points, setPoints] = useState<Point[]>(INITIAL_POINTS);
  const [config, setConfig] = useState<GAConfig>(DEFAULT_GA_CONFIG);
  const [clickMode, setClickMode] = useState<PointRole>("stop");
  const [activeRoute, setActiveRoute] = useState<"ga" | "baseline">("ga");
  const [mapKey, setMapKey] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>("controls");

  const { stopCount, isReady: ready } = useMemo(
    () => summarizePointSet(points),
    [points],
  );

  const handleOptimizeSuccess = useCallback(() => {
    setActiveRoute("ga");
    setMobileTab("results");
  }, []);

  const { run, reset, loading, error, result } = useOptimize({
    points,
    config,
    onSuccess: handleOptimizeSuccess,
  });

  useDynamicTitle(result);

  useKeyboardShortcut({
    key: "Enter",
    ctrlOrMeta: true,
    enabled: ready && !loading,
    handler: run,
  });

  const activeSequence = useMemo(() => {
    if (!result) return undefined;
    return activeRoute === "ga" ? result.ga.sequence : result.baseline.sequence;
  }, [result, activeRoute]);

  const handleMapClick = (lat: number, lng: number) => {
    const id = `${clickMode}-${Date.now()}`;
    setPoints(placePoint(points, clickMode, lat, lng, id));
    reset();
  };

  const handleRemovePoint = (id: string) => {
    setPoints(points.filter((p) => p.id !== id));
    reset();
  };

  const handleReset = () => {
    setPoints(INITIAL_POINTS);
    reset();
    setMapKey((k) => k + 1);
  };

  const handlePresetLoad = (preset: Preset) => {
    setPoints(preset.points);
    reset();
    setMapKey((k) => k + 1);
  };

  const handleConfigChange = (next: GAConfig) => {
    setConfig(next);
    reset();
  };

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <Header
        ready={ready}
        loading={loading}
        hasResult={!!result}
        stopCount={stopCount}
        improvement={result?.improvementPercent}
      />

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <aside
          className={sidebarClass("left", mobileTab)}
          aria-label="Controls"
        >
          <div className="p-5">
            <ControlPanel
              points={points}
              config={config}
              clickMode={clickMode}
              loading={loading}
              error={error}
              presets={PRESETS}
              onPresetLoad={handlePresetLoad}
              onConfigChange={handleConfigChange}
              onModeChange={setClickMode}
              onRemovePoint={handleRemovePoint}
              onReset={handleReset}
              onOptimize={run}
            />
          </div>
        </aside>

        <div className="relative order-1 h-[45dvh] shrink-0 md:order-2 md:h-auto md:flex-1 md:shrink">
          <MapViewWrapper
            key={mapKey}
            points={points}
            route={activeSequence}
            variant={activeRoute}
            onMapClick={handleMapClick}
            onRemovePoint={handleRemovePoint}
          />
          <MapHUD stopCount={stopCount} ready={ready} />
          {loading && <MapLoadingOverlay />}
        </div>

        {result && (
          <aside
            className={sidebarClass("right", mobileTab)}
            aria-label="Results"
          >
            <div className="p-5">
              <ResultsPanel
                result={result}
                points={points}
                activeRoute={activeRoute}
                onActiveRouteChange={setActiveRoute}
              />
            </div>
          </aside>
        )}
      </div>

      <MobileTabBar
        active={mobileTab}
        onChange={setMobileTab}
        hasResult={!!result}
      />
    </main>
  );
}

/**
 * Sidebar visibility classes for the desktop (fixed-width) and mobile
 * (tabbed) layouts. `side === "left"` is Controls, `"right"` is Results.
 */
function sidebarClass(side: "left" | "right", mobileTab: MobileTab): string {
  const isActive =
    side === "left" ? mobileTab === "controls" : mobileTab === "results";
  const order = side === "left" ? "md:order-1 order-2" : "md:order-3 order-3";
  const width = side === "left" ? "md:w-[340px]" : "md:w-[380px]";
  const border = side === "left" ? "md:border-r" : "md:border-l";
  const animate =
    side === "right"
      ? "animate-[slide-up_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
      : "";
  const visibility = isActive
    ? "block w-full flex-1 border-t border-[var(--color-border)] md:flex-none md:border-t-0"
    : "hidden md:block md:flex-none";

  return cn(
    "overflow-y-auto bg-[var(--color-bg-elevated)]/40",
    "md:shrink-0 md:border-[var(--color-border)]",
    order,
    width,
    border,
    animate,
    visibility,
  );
}
