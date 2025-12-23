"use client";

import { useEffect, useRef } from "react";

/**
 * Hook for playing sound effect on pull-to-refresh gesture
 * Triggers when user pulls down more than 100px at scrollTop === 0
 */
export function usePullSound() {
  const touchStartY = useRef<number | null>(null);
  const hasTriggered = useRef<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio
    if (!audioRef.current) {
      audioRef.current = new Audio("/audio/sfx/spray-shake.mp3");
      audioRef.current.volume = 0.3;
    }

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at the top of the page
      if (window.scrollY === 0) {
        touchStartY.current = e.touches[0].clientY;
        hasTriggered.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null || hasTriggered.current) return;
      if (window.scrollY !== 0) {
        touchStartY.current = null;
        return;
      }

      const currentY = e.touches[0].clientY;
      const pullDistance = currentY - touchStartY.current;

      // Trigger sound when pulled down more than 100px
      if (pullDistance > 100) {
        hasTriggered.current = true;
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch((err) => {
            console.debug("Failed to play pull sound:", err);
          });
        }
      }
    };

    const handleTouchEnd = () => {
      touchStartY.current = null;
      hasTriggered.current = false;
    };

    // Only attach listeners on mobile devices
    if (typeof window !== "undefined" && "ontouchstart" in window) {
      window.addEventListener("touchstart", handleTouchStart, { passive: true });
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", handleTouchEnd, { passive: true });
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("touchstart", handleTouchStart);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, []);

  return null;
}

