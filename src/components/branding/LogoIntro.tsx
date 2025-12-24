"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";

const STORAGE_KEY = "piko_logo_intro_seen";

export function LogoIntro() {
  const [isActive, setIsActive] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const hasCompletedRef = useRef(false);
  const [targetPosition, setTargetPosition] = useState<{
    x: number;
    y: number;
    scale: number;
  } | null>(null);

  useEffect(() => {
    // Check if intro has been seen
    if (typeof window === "undefined") return;

    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (hasSeen) {
      return; // Don't show intro if already seen
    }

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reducedMotion = mediaQuery.matches;

    // If reduced motion, skip intro and mark as seen
    if (reducedMotion) {
      localStorage.setItem(STORAGE_KEY, "true");
      return;
    }

    // Show intro
    setShouldRender(true);
    setIsActive(true);

    // Calculate target position after first paint
    const calculateTarget = () => {
      // Find all anchors (mobile and desktop both have the same ID, but we'll find the visible one)
      const anchors = document.querySelectorAll("#nav-logo-anchor");
      let anchor: Element | null = null;

      // Find the first visible anchor
      for (const el of anchors) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          anchor = el;
          break;
        }
      }

      if (!anchor || !logoRef.current) {
        // Fallback to top-left corner
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isMobile = viewportWidth < 768;
        const targetX = isMobile ? -viewportWidth / 2 + 32 : -viewportWidth / 2 + 48;
        const targetY = isMobile ? -viewportHeight / 2 + 32 : -viewportHeight / 2 + 48;
        setTargetPosition({
          x: targetX,
          y: targetY,
          scale: 0.5,
        });
        return;
      }

      // Get center of viewport
      const viewportCenterX = window.innerWidth / 2;
      const viewportCenterY = window.innerHeight / 2;

      // Get anchor position
      const anchorRect = anchor.getBoundingClientRect();
      const anchorCenterX = anchorRect.left + anchorRect.width / 2;
      const anchorCenterY = anchorRect.top + anchorRect.height / 2;

      // Calculate delta
      const deltaX = anchorCenterX - viewportCenterX;
      const deltaY = anchorCenterY - viewportCenterY;

      // Calculate scale (from large centered to small nav size)
      const initialSize = 200; // Large centered logo size
      const finalSize = Math.min(anchorRect.width, anchorRect.height, 48);
      const scale = finalSize / initialSize;

      setTargetPosition({
        x: deltaX,
        y: deltaY,
        scale: Math.max(scale, 0.3), // Minimum scale
      });
    };

    // Wait for DOM to be ready
    const timeoutId = setTimeout(() => {
      calculateTarget();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // Set data-modal-open on overlay root only
  useEffect(() => {
    if (!isActive || !overlayRef.current) return;

    const overlay = overlayRef.current;
    overlay.setAttribute("data-modal-open", "true");

    return () => {
      overlay.removeAttribute("data-modal-open");
    };
  }, [isActive]);

  // Handle animation completion (only run once)
  const handleAnimationComplete = () => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    // Mark as seen
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }

    // Small delay before unmounting to ensure smooth transition
    setTimeout(() => {
      setIsActive(false);
      setShouldRender(false);
    }, 300);
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-[200] bg-black pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              ref={logoRef}
              initial={{
                scale: 1,
                x: 0,
                y: 0,
              }}
              animate={
                targetPosition
                  ? {
                      scale: targetPosition.scale,
                      x: targetPosition.x,
                      y: targetPosition.y,
                    }
                  : {
                      scale: 0.3,
                      x: 0,
                      y: 0,
                    }
              }
              transition={{
                duration: 1.2,
                ease: [0.4, 0, 0.2, 1],
                delay: 0.3, // Wait for overlay to fade in
              }}
              onAnimationComplete={handleAnimationComplete}
            >
              <Logo size={200} priority alt="Piko" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

