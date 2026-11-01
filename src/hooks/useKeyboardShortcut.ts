"use client";

import { useEffect, useRef } from "react";

interface UseKeyboardShortcutOptions {
  /** `KeyboardEvent.key` to match (e.g. `"Enter"`). */
  key: string;
  /** Requires Ctrl (Win/Linux) or Cmd (macOS). */
  ctrlOrMeta?: boolean;
  /** Gate the binding — e.g. disable while loading. */
  enabled?: boolean;
  handler: () => void;
}

/**
 * Bind a global keyboard shortcut. `enabled: false` removes the listener
 * entirely; `handler` is mirrored into a ref so an inline arrow function
 * does not re-attach the listener on every render.
 */
export function useKeyboardShortcut({
  key,
  ctrlOrMeta = false,
  enabled = true,
  handler,
}: UseKeyboardShortcutOptions): void {
  // React 19 forbids writing refs during render — sync in an effect.
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== key) return;
      if (ctrlOrMeta && !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      handlerRef.current();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key, ctrlOrMeta, enabled]);
}
