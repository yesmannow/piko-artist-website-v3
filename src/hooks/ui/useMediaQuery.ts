"use client";

import { useSyncExternalStore } from "react";

/**
 * useMediaQuery - Detects media query matches
 *
 * Returns true if the media query matches, false otherwise.
 * Uses useSyncExternalStore for proper SSR handling and no cascading renders.
 *
 * @param {string} query - Media query string (e.g., "(min-width: 768px)")
 * @returns {boolean} matches - true if media query matches
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (callback: () => void) => {
    if (globalThis.window === undefined) return () => {};

    const mediaQuery = globalThis.matchMedia(query);
    mediaQuery.addEventListener("change", callback);

    return () => {
      mediaQuery.removeEventListener("change", callback);
    };
  };

  const getSnapshot = () => {
    if (globalThis.window === undefined) return false;
    return globalThis.matchMedia(query).matches;
  };

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
