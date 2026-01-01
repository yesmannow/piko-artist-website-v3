"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useDrag } from "@use-gesture/react";

interface DeckSwiperProps {
  consoleA: ReactNode; // Console A (Cyan)
  consoleB: ReactNode; // Console B (Magenta)
  onConsoleChange?: (console: "A" | "B") => void;
}

/**
 * DeckSwiper - Gesture-controlled container for switching between Console A and B
 *
 * Features:
 * - Swipe Left/Right to toggle between consoles
 * - Heavy, industrial slide effect using framer-motion
 * - Touch-action: none to prevent scroll-jacking
 */
export function DeckSwiper({
  consoleA,
  consoleB,
  onConsoleChange,
}: DeckSwiperProps) {
  const [activeConsole, setActiveConsole] = useState<"A" | "B">("A");
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 30 });

  // Snap to console positions
  const snapToConsole = (console: "A" | "B") => {
    const targetX = console === "A" ? 0 : -100;
    x.set(targetX);
    setActiveConsole(console);
    onConsoleChange?.(console);
  };

  // Drag gesture handler
  const bind = useDrag(
    ({ movement: [mx], direction: [dx], velocity: [vx], active, cancel }) => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const threshold = containerWidth * 0.3; // 30% of width to trigger switch
      const velocityThreshold = 0.5; // Minimum velocity to trigger switch

      if (active) {
        // During drag: allow free movement
        const clampedX = Math.max(-100, Math.min(0, (mx / containerWidth) * 100));
        x.set(clampedX);
      } else {
        // On release: snap to nearest console
        const shouldSwitch =
          Math.abs(mx) > threshold || Math.abs(vx) > velocityThreshold;

        if (shouldSwitch && dx !== 0) {
          // Switch to opposite console
          const newConsole = activeConsole === "A" ? "B" : "A";
          snapToConsole(newConsole);
        } else {
          // Snap back to current console
          snapToConsole(activeConsole);
        }
      }
    },
    {
      axis: "x",
      filterTaps: true,
      rubberband: false,
    }
  );

  // Transform for console positions
  const consoleATransform = useTransform(springX, (value) => `${value}%`);
  const consoleBTransform = useTransform(springX, (value) => `${value + 100}%`);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ touchAction: "none" }}
      {...bind()}
    >
      {/* Console A (Cyan) */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{
          x: consoleATransform,
        }}
      >
        <div className="w-full h-full bg-[#0a0a0a]">{consoleA}</div>
      </motion.div>

      {/* Console B (Magenta) */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{
          x: consoleBTransform,
        }}
      >
        <div className="w-full h-full bg-[#0a0a0a]">{consoleB}</div>
      </motion.div>

      {/* Console Indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        <div
          className={`w-2 h-2 rounded-full transition-all ${
            activeConsole === "A" ? "bg-[#00d9ff] w-8" : "bg-gray-600"
          }`}
        />
        <div
          className={`w-2 h-2 rounded-full transition-all ${
            activeConsole === "B" ? "bg-[#ff00d9] w-8" : "bg-gray-600"
          }`}
        />
      </div>
    </div>
  );
}

