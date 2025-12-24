import { useState, useEffect, useRef } from "react";

/**
 * Hook for detecting scroll direction (up/down) with throttling via requestAnimationFrame
 * Returns 'up' | 'down' | null (null on initial load or no scroll)
 */
export function useScrollDirection(threshold: number = 50) {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
  const lastScrollY = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;

      // Only update if scroll has moved beyond threshold
      if (Math.abs(currentScrollY - lastScrollY.current) < threshold) {
        rafId.current = requestAnimationFrame(updateScrollDirection);
        return;
      }

      if (currentScrollY > lastScrollY.current && currentScrollY > threshold) {
        setScrollDirection("down");
      } else if (currentScrollY < lastScrollY.current) {
        setScrollDirection("up");
      }

      lastScrollY.current = currentScrollY;
      rafId.current = requestAnimationFrame(updateScrollDirection);
    };

    // Initial check
    lastScrollY.current = window.scrollY;
    rafId.current = requestAnimationFrame(updateScrollDirection);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [threshold]);

  return scrollDirection;
}

