import { useState, useEffect, useRef } from "react";

/**
 * Hook for detecting scroll direction (up/down) with throttling
 * Returns 'up' | 'down' | null (null on initial load or no scroll)
 */
export function useScrollDirection(threshold = 50) {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(
    null,
  );
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;

      // Only update if scroll has moved beyond threshold
      if (Math.abs(currentScrollY - lastScrollY.current) >= threshold) {
        if (
          currentScrollY > lastScrollY.current &&
          currentScrollY > threshold
        ) {
          setScrollDirection("down");
        } else if (currentScrollY < lastScrollY.current) {
          setScrollDirection("up");
        }
        lastScrollY.current = currentScrollY;
      }

      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    // Initial check
    lastScrollY.current = window.scrollY;

    // Use passive scroll listener for better performance
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  return scrollDirection;
}
