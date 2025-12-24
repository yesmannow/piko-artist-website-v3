"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";

/**
 * Component that forces scroll-to-top on route changes
 * Fixes issue where Lenis smooth scrolling can cause pages to load
 * at an offset position, making them appear blank
 */
export function ScrollToTopOnRouteChange() {
  const pathname = usePathname();
  const lenis = useLenis();
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    // Only reset scroll if pathname actually changed (not on initial mount)
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname;
      return;
    }

    if (prevPathnameRef.current === pathname) {
      return; // Same pathname, no need to reset
    }

    // On route change, reset scroll position to top
    // Use immediate: true to skip animation and ensure instant reset
    // Also reset window.scrollY as a fallback for edge cases
    if (lenis) {
      try {
        // Lenis scrollTo with immediate option for instant scroll
        lenis.scrollTo(0, { immediate: true });
      } catch (error) {
        // If Lenis API fails, fallback to native scroll
        console.warn("Lenis scrollTo failed, using fallback:", error);
        window.scrollTo(0, 0);
      }
    } else {
      // Fallback for safety if Lenis is not available
      window.scrollTo(0, 0);
    }

    prevPathnameRef.current = pathname;
  }, [pathname, lenis]);

  return null;
}

