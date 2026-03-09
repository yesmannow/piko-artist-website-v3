import { useCallback, useRef } from "react";

/**
 * Hook for triggering haptic feedback (vibration) on mobile devices
 *
 * Upgraded with velocity-based haptics:
 * - Slow = distinct ticks (10ms)
 * - Fast = continuous rumble
 *
 * @returns A function to trigger haptic feedback with optional velocity
 */
export function useHaptic() {
  const lastHapticTimeRef = useRef(0);
  const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const triggerHaptic = useCallback((pattern?: number | number[], velocity?: number) => {
    // Check if vibration API is supported
    if ("vibrate" in navigator) {
      try {
        // Velocity-based haptics: proportional to scratch speed
        if (velocity !== undefined && velocity > 0) {
          const absVelocity = Math.abs(velocity);

          // Clear any existing interval
          if (hapticIntervalRef.current) {
            clearInterval(hapticIntervalRef.current);
            hapticIntervalRef.current = null;
          }

          // Fast velocity (> 5 deg/ms): continuous rumble
          if (absVelocity > 5) {
            const intensity = Math.min(50, absVelocity * 2); // Max 50ms
            navigator.vibrate(intensity);

            // Continuous rumble while moving fast
            hapticIntervalRef.current = setInterval(() => {
              navigator.vibrate(intensity);
            }, 50); // Update every 50ms
          }
          // Medium velocity (1-5 deg/ms): distinct ticks
          else if (absVelocity > 1) {
            const tickInterval = Math.max(10, 100 - absVelocity * 10); // 10-90ms interval
            const now = Date.now();

            // Throttle ticks to prevent overwhelming
            if (now - lastHapticTimeRef.current > tickInterval) {
              navigator.vibrate(10); // Short, sharp tick
              lastHapticTimeRef.current = now;
            }
          }
          // Slow velocity (< 1 deg/ms): single distinct tick
          else {
            const now = Date.now();
            if (now - lastHapticTimeRef.current > 100) {
              navigator.vibrate(10);
              lastHapticTimeRef.current = now;
            }
          }
        } else {
          // Default: short, sharp "click" feeling (10ms)
          const vibrationPattern = pattern ?? 10;
          navigator.vibrate(vibrationPattern);
        }
      } catch (error) {
        // Silently fail if vibration is not supported or blocked
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.debug("Haptic feedback not available:", error);
        }
      }
    }
  }, []);

  // Cleanup function to stop continuous haptics
  const stopHaptic = useCallback(() => {
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }
    if ("vibrate" in navigator) {
      navigator.vibrate(0); // Stop vibration
    }
  }, []);

  return { triggerHaptic, stopHaptic };
}

