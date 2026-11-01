"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GAConfig, OptimizeResponse, Point } from "@/lib/types";

interface UseOptimizeOptions {
  points: Point[];
  config: GAConfig;
  /** Fired on success only; the hook does not touch UI state. */
  onSuccess?: (result: OptimizeResponse) => void;
}

interface UseOptimizeReturn {
  /** Trigger a run. Supersedes any in-flight request. */
  run: () => Promise<void>;
  /** Clear result/error and abort any in-flight request. */
  reset: () => void;
  loading: boolean;
  error: string | null;
  result: OptimizeResponse | null;
}

/**
 * Manages the full lifecycle of a POST /api/optimize request.
 *
 * - Concurrency-safe: a new `run()` aborts the previous request.
 * - Reset-safe: `reset()` aborts in-flight work, so a late response
 *   cannot overwrite cleared state (the "add a point while optimizing"
 *   bug).
 * - Stable `run`: `onSuccess` is mirrored into a ref so an inline arrow
 *   does not re-create `run` on every render.
 */
export function useOptimize({
  points,
  config,
  onSuccess,
}: UseOptimizeOptions): UseOptimizeReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizeResponse | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // React 19 forbids `ref.current =` during render (render purity).
  // The effect runs after commit but before any user event, so the ref
  // always holds the latest callback.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const run = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points, config }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Optimization failed");
      }

      // A `reset()` may have fired between the response and this line.
      if (controller.signal.aborted) return;

      const typed = data as OptimizeResponse;
      setResult(typed);
      onSuccessRef.current?.(typed);
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      // Only the current controller clears loading; a superseded one must not.
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [points, config]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { run, reset, loading, error, result };
}
