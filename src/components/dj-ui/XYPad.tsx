"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useDrag } from "@use-gesture/react";
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";

interface XYPadProps {
  label?: string;
  xLabel?: string; // e.g., "CUTOFF"
  yLabel?: string; // e.g., "RESONANCE"
  onChange: (x: number, y: number) => void;
  onRelease?: () => void;
  className?: string;
}

interface TrailPoint {
  x: number;
  y: number;
  id: number;
  opacity: number;
}

/**
 * XYPad - Expert-Level Kaoss Pad Style Tactile FX Controller
 *
 * High-performance touch surface with physics-based cursor movement and
 * glowing "Ghost Trail" visualizer. Maps gestures to normalized X/Y values (0-1).
 *
 * Features:
 * - Physics-based spring animations for smooth cursor movement
 * - Real-time ghost trail visualization with opacity decay
 * - Snap-back to center (0.5, 0) on release
 * - Touch-optimized with @use-gesture/react for precise gesture handling
 */
export function XYPad({
  label = "FX_KAOSS",
  xLabel = "FREQ",
  yLabel = "DRY/WET",
  onChange,
  onRelease,
  className = "",
}: XYPadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [trail, setTrail] = useState<TrailPoint[]>([]);

  // Physics-based cursor movement
  const x = useSpring(0.5, { stiffness: 300, damping: 25 });
  const y = useSpring(0.5, { stiffness: 300, damping: 25 });

  // Map 0-1 values to percentages for CSS
  const cursorLeft = useTransform(x, (val) => `${val * 100}%`);
  const cursorTop = useTransform(y, (val) => `${(1 - val) * 100}%`); // Invert Y so up is 1.0

  // Gesture Handling
  const bind = useDrag(
    ({ active, xy: [pageX, pageY], movement }) => {
      setActive(active);

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();

        // Calculate normalized values (0 to 1)
        // Clamp to ensure we don't go outside the box
        const relativeX = Math.min(Math.max((pageX - rect.left) / rect.width, 0), 1);
        const relativeY = Math.min(Math.max(1 - (pageY - rect.top) / rect.height, 0), 1); // 1 at top

        // Update Springs
        x.set(relativeX);
        y.set(relativeY);

        // Emit values to parent audio engine
        onChange(relativeX, relativeY);

        // Add trail point if active
        if (active) {
          setTrail((prev) => [
            ...prev.slice(-20), // Keep last 20 points for performance
            { x: relativeX, y: relativeY, id: Date.now(), opacity: 1 },
          ]);
        }
      }

      if (!active && onRelease) {
        // Snap back to center/zero on release (optional behavior)
        x.set(0.5);
        y.set(0);
        onChange(0.5, 0);
        onRelease();
      }
    },
    {
      eventOptions: { passive: false }, // Prevent scrolling on mobile
    }
  );

  // Trail Decay Loop
  useEffect(() => {
    let animationFrame: number;

    const loop = () => {
      setTrail((prev) => {
        if (prev.length === 0) return prev;
        // Fade out points
        const updated = prev
          .map((p) => ({ ...p, opacity: p.opacity - 0.04 })) // Fade speed
          .filter((p) => p.opacity > 0);
        return updated;
      });
      animationFrame = requestAnimationFrame(loop);
    };

    if (trail.length > 0 || active) {
      loop();
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [active, trail.length]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-end px-1">
        <span className="text-xs font-black italic text-toxic-lime uppercase tracking-wider">
          {label}
        </span>
        <div className="flex gap-2 text-[9px] font-mono text-zinc-500">
          <span>X: {xLabel}</span>
          <span>Y: {yLabel}</span>
        </div>
      </div>

      {/* Touch Surface */}
      <div
        ref={containerRef}
        {...bind()}
        className="relative w-full aspect-square bg-[#080808] border-2 border-zinc-800 overflow-hidden touch-none cursor-crosshair active:border-toxic-lime transition-colors duration-200"
        style={{
          backgroundImage: `
            linear-gradient(rgb(204 255 0 / 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgb(204 255 0 / 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
          touchAction: "none",
          minWidth: "44px",
          minHeight: "44px",
        }}
      >
        {/* Ghost Trail (SVG Overlay) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {trail.map((point, i) => (
            <circle
              key={point.id}
              cx={`${point.x * 100}%`}
              cy={`${(1 - point.y) * 100}%`}
              r={active ? 3 + point.opacity * 4 : 2} // Pulse size
              fill="rgb(204 255 0)"
              fillOpacity={point.opacity * 0.4}
              className="stroke-toxic-lime"
            />
          ))}
          {/* Optional: Connect points with a line for a smooth look */}
          {trail.length > 1 && (
            <polyline
              points={trail.map((p) => `${p.x * 100},${(1 - p.y) * 100}`).join(" ")}
              fill="none"
              stroke="rgb(204 255 0)"
              strokeWidth="2"
              strokeOpacity="0.3"
              className="stroke-toxic-lime"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke" // Keeps line thin regardless of scale
            />
          )}
        </svg>

        {/* The Reticle / Cursor */}
        <motion.div
          className="absolute w-6 h-6 border-2 border-toxic-lime z-10 pointer-events-none"
          style={{
            left: cursorLeft,
            top: cursorTop,
            x: "-50%",
            y: "-50%",
            boxShadow: active ? "0 0 15px rgb(204 255 0), inset 0 0 5px rgb(204 255 0)" : "none",
            backgroundColor: active ? "rgb(204 255 0 / 0.1)" : "transparent",
            borderRadius: 0, // Brutalist design
          }}
        >
          {/* Crosshairs inside reticle */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-toxic-lime/50" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-toxic-lime/50" />
        </motion.div>

        {/* Axis Indicators */}
        <div className="absolute bottom-2 right-2 text-[10px] font-mono text-toxic-lime opacity-50 pointer-events-none">
          {x.get().toFixed(2)}, {y.get().toFixed(2)}
        </div>
      </div>
    </div>
  );
}

