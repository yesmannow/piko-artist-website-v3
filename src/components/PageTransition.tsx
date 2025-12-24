"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const prevPathnameRef = useRef<string | null>(null);

  // Cleanup function to reset any lingering styles
  useEffect(() => {
    // Reset any potential overlay styles on route change
    if (prevPathnameRef.current && prevPathnameRef.current !== pathname) {
      // Force cleanup of any transition-related DOM elements
      const transitionLayers = document.querySelectorAll('.page-transition-layer, .transition-overlay');
      transitionLayers.forEach((layer) => {
        if (layer instanceof HTMLElement) {
          layer.style.opacity = '0';
          layer.style.pointerEvents = 'none';
        }
      });

      // Ensure body styles are reset (but preserve intentional styles)
      const body = document.body;
      // Only reset transition-related styles, not global styles
      if (body.style.overflow === 'hidden' && !document.querySelector('[data-modal-open="true"]')) {
        body.style.overflow = '';
      }
    }

    prevPathnameRef.current = pathname;
  }, [pathname]);

  return (
    <div ref={containerRef} className="relative w-full overflow-x-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

