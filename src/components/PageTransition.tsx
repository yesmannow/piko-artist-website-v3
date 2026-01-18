"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const prevPathnameRef = useRef<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Robust cleanup on route change
  useEffect(() => {
    if (prevPathnameRef.current && prevPathnameRef.current !== pathname) {
      // Cleanup any lingering transition overlays
      const transitionOverlays = document.querySelectorAll(
        ".page-transition-layer, .transition-overlay, [data-transition-overlay]"
      );
      transitionOverlays.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          // Remove after animation completes
          setTimeout(() => {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
          }, 300);
        }
      });

      // Reset body scroll only if no modals are open
      const body = document.body;
      if (body.style.overflow === "hidden" && !document.querySelector('[data-modal-open="true"]')) {
        body.style.overflow = "";
      }

      // Ensure pointer events are enabled on all interactive elements
      const interactiveElements = document.querySelectorAll(
        "nav, button, a, input, select, textarea, [role='button'], [tabindex]"
      );
      interactiveElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.pointerEvents = "";
        }
      });

      // Force reflow to ensure styles are applied
      void containerRef.current?.offsetHeight;
    }

    prevPathnameRef.current = pathname;
  }, [pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Final cleanup on component unmount
      const body = document.body;
      if (body.style.overflow === "hidden" && !document.querySelector('[data-modal-open="true"]')) {
        body.style.overflow = "";
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full overflow-x-hidden">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={pathname}
          initial={
            reducedMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  y: 20,
                  scale: 0.98,
                }
          }
          animate={
            reducedMotion
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }
          }
          exit={
            reducedMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  y: -10,
                  scale: 0.99,
                }
          }
          transition={
            reducedMotion
              ? { duration: 0.1 }
              : {
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1], // Custom easing for vinyl-sleeve feel
                }
          }
          className="relative w-full"
          style={{
            willChange: reducedMotion ? "auto" : "transform, opacity",
          }}
          onAnimationStart={() => {
            // Ensure pointer events are enabled during transition
            if (containerRef.current) {
              containerRef.current.style.pointerEvents = "auto";
            }
          }}
          onAnimationComplete={() => {
            // Final cleanup after animation
            if (containerRef.current) {
              containerRef.current.style.pointerEvents = "auto";
            }
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

