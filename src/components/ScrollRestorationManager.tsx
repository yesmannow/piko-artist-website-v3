"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";

/**
 * ScrollRestorationManager - Robust scroll-to-top on route changes
 *
 * Fixes sporadic blank/black screens caused by Lenis momentum carrying
 * into the next route. Guarantees each route starts at scrollTop=0.
 *
 * Features:
 * - Stops Lenis momentum before route change
 * - Forces native scroll reset (multiple methods for reliability)
 * - Forces Lenis scroll reset with immediate option
 * - Resumes Lenis after reset
 * - Modal-aware: pauses Lenis when modals are open
 * - Manual scroll restoration to prevent browser interference
 */
export function ScrollRestorationManager() {
  const pathname = usePathname();
  const lenis = useLenis();
  const prevPathnameRef = useRef<string | null>(null);
  const originalScrollRestorationRef = useRef<ScrollRestoration | null>(null);
  const modalObserverRef = useRef<MutationObserver | null>(null);
  const modalCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set manual scroll restoration on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      originalScrollRestorationRef.current = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
    }

    return () => {
      // Restore original scroll restoration on unmount
      if (
        typeof window !== "undefined" &&
        "scrollRestoration" in window.history &&
        originalScrollRestorationRef.current !== null
      ) {
        window.history.scrollRestoration = originalScrollRestorationRef.current;
      }
    };
  }, []);

  // Modal-aware Lenis pausing
  useEffect(() => {
    if (!lenis) return;

    const checkForModals = () => {
      const hasModal = !!document.querySelector('[data-modal-open="true"]');

      if (hasModal) {
        // Stop Lenis when modal is open
        try {
          if (typeof lenis.stop === "function") {
            lenis.stop();
          }
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.debug("[ScrollRestorationManager] Error stopping Lenis:", error);
          }
        }
      } else {
        // Resume Lenis when no modal
        try {
          if (typeof lenis.start === "function") {
            lenis.start();
          }
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.debug("[ScrollRestorationManager] Error starting Lenis:", error);
          }
        }
      }
    };

    // Use MutationObserver to watch for modal attribute changes
    const observer = new MutationObserver(() => {
      checkForModals();
    });

    // Observe body and document for attribute changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-modal-open"],
      subtree: true,
      childList: true,
    });

    // Also observe document for modal elements
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-modal-open"],
      subtree: true,
      childList: true,
    });

    // Initial check
    checkForModals();

    // Fallback: poll every 100ms as backup (in case MutationObserver misses something)
    const interval = setInterval(checkForModals, 100);

    modalObserverRef.current = observer;
    modalCheckIntervalRef.current = interval;

    return () => {
      observer.disconnect();
      if (interval) clearInterval(interval);
    };
  }, [lenis]);

  // Robust scroll-to-top on route change
  useEffect(() => {
    // Skip on initial mount
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname;
      return;
    }

    // Skip if pathname hasn't changed
    if (prevPathnameRef.current === pathname) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      console.debug(
        "[ScrollRestorationManager] Route change detected:",
        prevPathnameRef.current,
        "->",
        pathname
      );
    }

    // Robust scroll reset sequence
    const performScrollReset = () => {
      // Step 1: Stop Lenis momentum immediately
      if (lenis) {
        try {
          if (typeof lenis.stop === "function") {
            lenis.stop();
          }
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.debug("[ScrollRestorationManager] Error stopping Lenis:", error);
          }
        }
      }

      // Step 2: Force native scroll reset (multiple methods for reliability)
      try {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Also set scrollTop on html element directly
        if (document.documentElement) {
          document.documentElement.scrollTop = 0;
        }
        if (document.body) {
          document.body.scrollTop = 0;
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[ScrollRestorationManager] Error resetting native scroll:", error);
        }
      }

      // Step 3: Force Lenis scroll reset
      if (lenis) {
        try {
          // Use immediate: true to skip animation, force: true to scroll even if stopped
          lenis.scrollTo(0, { immediate: true, force: true });
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.debug("[ScrollRestorationManager] Error resetting Lenis scroll:", error);
          }
        }
      }

      // Step 4: Resume Lenis (only if no modal is open)
      if (lenis) {
        const hasModal = !!document.querySelector('[data-modal-open="true"]');
        if (!hasModal) {
          try {
            // Small delay to ensure scroll reset is complete
            setTimeout(() => {
              if (typeof lenis.start === "function") {
                lenis.start();
              }
            }, 10);
          } catch (error) {
            if (process.env.NODE_ENV !== "production") {
              console.debug("[ScrollRestorationManager] Error starting Lenis:", error);
            }
          }
        }
      }
    };

    // Execute immediately
    performScrollReset();

    // Execute in requestAnimationFrame (ensures DOM is ready)
    requestAnimationFrame(() => {
      performScrollReset();

      // Execute again in next frame for extra safety
      requestAnimationFrame(() => {
        performScrollReset();
      });
    });

    // Execute in setTimeout(0) as final fallback
    setTimeout(() => {
      performScrollReset();
    }, 0);

    // Update previous pathname
    prevPathnameRef.current = pathname;
  }, [pathname, lenis]);

  return null;
}

