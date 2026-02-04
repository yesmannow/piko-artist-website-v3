"use client";

import { useSyncExternalStore } from "react";

/**
 * useOrientation - Detects device orientation (portrait vs landscape)
 *
 * Returns true for landscape, false for portrait.
 * Uses useSyncExternalStore for proper SSR handling.
 *
 * @returns {boolean} isLandscape - true if landscape, false if portrait
 */
export function useOrientation(): boolean {
  const subscribe = (callback: () => void) => {
    if (globalThis.window === undefined) return () => {};

    const landscapeQuery = globalThis.matchMedia("(orientation: landscape)");
    landscapeQuery.addEventListener("change", callback);
    globalThis.addEventListener("resize", callback);
    globalThis.addEventListener("orientationchange", callback);

    return () => {
      landscapeQuery.removeEventListener("change", callback);
      globalThis.removeEventListener("resize", callback);
      globalThis.removeEventListener("orientationchange", callback);
    };
  };

  const getSnapshot = () => {
    if (globalThis.window === undefined) return false;
    return globalThis.matchMedia("(orientation: landscape)").matches;
  };

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}