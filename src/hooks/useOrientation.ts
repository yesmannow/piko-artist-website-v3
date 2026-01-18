"use client";

import { useState, useEffect } from "react";

/**
 * useOrientation - Detects device orientation (portrait vs landscape)
 *
 * Returns true for landscape, false for portrait.
 * Uses window.matchMedia for reliable detection across devices.
 *
 * @returns {boolean} isLandscape - true if landscape, false if portrait
 */
export function useOrientation(): boolean {
  const [isLandscape, setIsLandscape] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    if (typeof window === "undefined") return;

    // Check initial orientation
    const checkOrientation = () => {
      // Use matchMedia for reliable detection
      const landscapeQuery = window.matchMedia("(orientation: landscape)");
      setIsLandscape(landscapeQuery.matches);
    };

    checkOrientation();

    // Listen for orientation changes
    const landscapeQuery = window.matchMedia("(orientation: landscape)");
    const handleOrientationChange = (e: MediaQueryListEvent) => {
      setIsLandscape(e.matches);
    };

    landscapeQuery.addEventListener("change", handleOrientationChange);
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      landscapeQuery.removeEventListener("change", handleOrientationChange);
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Return false during SSR to prevent hydration mismatches
  return isMounted ? isLandscape : false;
}

