"use client";

import { useEffect } from "react";
import type { OptimizeResponse } from "@/lib/types";

/**
 * Syncs `document.title` with the current result.
 * Client-only via `useEffect`; the layout's metadata stays authoritative
 * for crawlers and pre-hydration tab labels.
 */
export function useDynamicTitle(result: OptimizeResponse | null): void {
  useEffect(() => {
    if (result) {
      const pct = (result.improvementPercent * 100).toFixed(1);
      document.title = `VRP Solver · ${pct}% better`;
    } else {
      document.title = "VRP Solver — Genetic Algorithm Demo";
    }
  }, [result]);
}
