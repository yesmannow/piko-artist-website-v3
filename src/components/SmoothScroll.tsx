"use client";

import { ReactLenis } from "lenis/react";
import { useEffect } from "react";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  // REMEDIATION: Decouple Lenis from Next.js scroll restoration to prevent "Double Jump"
  useEffect(() => {
    // Inject manual scroll restoration on mount
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  return (
    <ReactLenis 
      root 
      options={{ 
        lerp: 0.08, 
        duration: 1.2, 
        smoothWheel: true,
        wheelMultiplier: 1.0, // Allow normal mouse wheel sensitivity
        touchMultiplier: 2.0, // Better touch scrolling
        infinite: false,
        // Ensure Lenis targets window (global) for PWA compatibility
        wrapper: typeof window !== "undefined" ? window : undefined,
        content: typeof document !== "undefined" ? document.documentElement : undefined,
      }}
    >
      {children}
    </ReactLenis>
  );
}

