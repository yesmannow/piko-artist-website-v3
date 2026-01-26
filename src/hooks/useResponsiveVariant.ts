"use client";

import { useState, useEffect } from "react";
import type { DeckVariant } from "@/components/deck/types";

/**
 * Hook to determine the current responsive variant based on viewport width
 * Uses breakpoints matching the Tailwind config:
 * - mobile: < 768px
 * - tablet: 768px - 1023px
 * - desktop: >= 1024px
 */
export function useResponsiveVariant(): DeckVariant {
  const [variant, setVariant] = useState<DeckVariant>(() => {
    if (typeof window === "undefined") return "desktop";
    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateVariant = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setVariant("mobile");
      } else if (width < 1024) {
        setVariant("tablet");
      } else {
        setVariant("desktop");
      }
    };

    updateVariant();
    window.addEventListener("resize", updateVariant);
    return () => window.removeEventListener("resize", updateVariant);
  }, []);

  return variant;
}
