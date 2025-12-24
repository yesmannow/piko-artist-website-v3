import { useEffect, useRef } from "react";

// Global counter to track how many modals/overlays are requesting scroll lock
let scrollLockCount = 0;

/**
 * Hook for managing body scroll lock with a counter system
 * Prevents conflicts when multiple modals are open (e.g., EventModal + PosterModal)
 * Only unlocks scroll when all modals are closed
 *
 * @param isLocked - Whether this instance should lock the body scroll
 * @returns void
 */
export function useBodyScrollLock(isLocked: boolean) {
  const hasLockedRef = useRef(false);

  useEffect(() => {
    if (isLocked && !hasLockedRef.current) {
      // Increment counter and lock scroll
      scrollLockCount++;
      document.body.style.overflow = "hidden";
      hasLockedRef.current = true;
    } else if (!isLocked && hasLockedRef.current) {
      // Decrement counter
      scrollLockCount--;
      hasLockedRef.current = false;

      // Only unlock if no other modals are locking scroll
      if (scrollLockCount <= 0) {
        scrollLockCount = 0; // Prevent negative counts
        document.body.style.overflow = "";
      }
    }

    // Cleanup: ensure we decrement on unmount if we locked
    return () => {
      if (hasLockedRef.current) {
        scrollLockCount--;
        hasLockedRef.current = false;
        if (scrollLockCount <= 0) {
          scrollLockCount = 0;
          document.body.style.overflow = "";
        }
      }
    };
  }, [isLocked]);
}

