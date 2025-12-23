import { useCallback } from "react";

/**
 * Hook for triggering haptic feedback (vibration) on mobile devices
 * @returns A function to trigger haptic feedback
 */
export function useHaptic() {
  const triggerHaptic = useCallback((pattern?: number | number[]) => {
    // Check if vibration API is supported
    if ("vibrate" in navigator) {
      try {
        // Default: short, sharp "click" feeling (10ms)
        const vibrationPattern = pattern ?? 10;
        navigator.vibrate(vibrationPattern);
      } catch (error) {
        // Silently fail if vibration is not supported or blocked
        console.debug("Haptic feedback not available:", error);
      }
    }
  }, []);

  return triggerHaptic;
}

