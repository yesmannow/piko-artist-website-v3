"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, useState } from "react";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // REMEDIATION: Decouple Lenis from Next.js scroll restoration to prevent "Double Jump"
  useEffect(() => {
    setMounted(true);
    // Inject manual scroll restoration on mount
    if (
      typeof window !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Don't render Lenis until mounted to prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

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
        content:
          typeof document !== "undefined"
            ? document.documentElement
            : undefined,
      }}
    >
      {children}
    </ReactLenis>
  );
}
