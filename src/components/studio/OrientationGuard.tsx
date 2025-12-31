"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCw } from "lucide-react";

/**
 * OrientationGuard - Displays high-contrast overlay when studio is accessed in mobile portrait
 *
 * V3 Urban Syndicate: Industrial orientation warning for optimal console experience
 */
export function OrientationGuard() {
  const [showGuard, setShowGuard] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isMobile = window.innerWidth < 768;
      setShowGuard(isPortrait && isMobile);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  return (
    <AnimatePresence>
      {showGuard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center"
          style={{
            background: `
              #050505,
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, 0.5) 2px,
                rgba(0, 0, 0, 0.5) 4px
              )
            `,
            backgroundSize: "100% 100%, 100% 8px",
          }}
        >
          <div className="text-center px-6 space-y-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mx-auto"
            >
              <RotateCw size={64} className="text-[#FFD700]" strokeWidth={2} />
            </motion.div>

            <div className="space-y-4">
              <h2
                className="text-3xl md:text-4xl font-black italic uppercase text-[#FFD700]"
                style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
              >
                ROTATE FOR FULL CONSOLE
              </h2>
              <p className="text-base md:text-lg font-mono text-[#E0E0E0]/80 uppercase tracking-wider">
                Landscape orientation required for optimal studio experience
              </p>
            </div>

            <div className="pt-4 border-t-2 border-[#E0E0E0]/20">
              <p className="text-xs font-mono text-[#E0E0E0]/60 uppercase">
                Rotate your device to access the full widescreen console
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

