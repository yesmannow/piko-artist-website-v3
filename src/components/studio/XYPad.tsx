"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHaptic } from "@/hooks/useHaptic";

interface XYPadProps {
  /** Current X position (0.0 to 1.0) - maps to Filter Frequency */
  x?: number;
  /** Current Y position (0.0 to 1.0) - maps to Effect Intensity */
  y?: number;
  /** Callback when position changes */
  onPositionChange?: (x: number, y: number) => void;
  /** Optional size override */
  size?: number;
  /** Label for X-axis */
  xLabel?: string;
  /** Label for Y-axis */
  yLabel?: string;
  /** Whether the pad is active */
  isActive?: boolean;
  /** Latch Mode: If true, position stays when released. If false, snaps back to (0.5, 0) */
  latchMode?: boolean;
  /** Callback when latch mode changes */
  onLatchModeChange?: (enabled: boolean) => void;
  className?: string;
}

interface TrailPoint {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

/**
 * XYPad - Kaoss Pad Style Tactile FX Controller
 *
 * Professional DJ-style XY pad for controlling two parameters simultaneously.
 * Maps X-axis to Filter Frequency and Y-axis to Effect Intensity.
 *
 * Features:
 * - Safety Yellow (#FFD700) glowing trail visualization
 * - Haptic feedback on touch
 * - 0px border-radius (Brutalist design)
 * - Touch-optimized with 44x44px minimum interaction area
 */
export function XYPad({
  x = 0.5,
  y = 0.5,
  onPositionChange,
  size = 200,
  xLabel = "FILTER",
  yLabel = "FX_WET",
  isActive = true,
  latchMode = false,
  onLatchModeChange,
  className = "",
}: XYPadProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x, y });
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const { triggerHaptic } = useHaptic();
  const trailIdRef = useRef(0);

  // Neutral position (snap-back target)
  const NEUTRAL_X = 0.5;
  const NEUTRAL_Y = 0;

  // Sync external position changes
  useEffect(() => {
    setPosition({ x, y });
  }, [x, y]);

  // Fade out old trail points
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTrail((prev) =>
        prev.filter((point) => now - point.timestamp < 800) // 800ms trail lifetime
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Calculate position from pointer event
  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!padRef.current || !isActive) return;

      const rect = padRef.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newY = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height)); // Invert Y

      setPosition({ x: newX, y: newY });
      onPositionChange?.(newX, newY);

      // Add trail point
      setTrail((prev) => [
        ...prev.slice(-30), // Keep last 30 points
        {
          id: trailIdRef.current++,
          x: newX,
          y: newY,
          timestamp: Date.now(),
        },
      ]);
    },
    [isActive, onPositionChange]
  );

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isActive) return;
      setIsDragging(true);
      triggerHaptic(10);
      updatePosition(e.clientX, e.clientY);
    },
    [isActive, triggerHaptic, updatePosition]
  );

  // Touch handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isActive || e.touches.length === 0) return;
      setIsDragging(true);
      triggerHaptic(10);
      updatePosition(e.touches[0].clientX, e.touches[0].clientY);
    },
    [isActive, triggerHaptic, updatePosition]
  );

  // Global move/end handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        updatePosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      triggerHaptic(5);

      // Snap-back to neutral position unless latch mode is enabled
      if (!latchMode) {
        // Smooth snap-back animation
        const startX = position.x;
        const startY = position.y;
        const startTime = Date.now();
        const duration = 300; // 300ms snap-back

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Ease-out cubic for smooth deceleration
          const eased = 1 - Math.pow(1 - progress, 3);

          const newX = startX + (NEUTRAL_X - startX) * eased;
          const newY = startY + (NEUTRAL_Y - startY) * eased;

          setPosition({ x: newX, y: newY });
          onPositionChange?.(newX, newY);

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, triggerHaptic, updatePosition]);

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-bold uppercase text-[#FFD700]">
          KAOSS_PAD
        </span>
        <div className="flex items-center gap-3">
          {/* Latch Mode Toggle */}
          {onLatchModeChange && (
            <button
              onClick={() => {
                triggerHaptic(10);
                onLatchModeChange(!latchMode);
              }}
              className={`text-[9px] font-mono uppercase px-2 py-1 border transition-all min-h-[32px] min-w-[32px] ${
                latchMode
                  ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10"
                  : "border-zinc-600 text-zinc-500"
              }`}
              style={{ borderRadius: 0 }}
              aria-label={latchMode ? "Disable latch mode" : "Enable latch mode"}
            >
              LATCH
            </button>
          )}
          <span className="text-[10px] font-mono text-[#E0E0E0]/50 uppercase">
            X: {Math.round(position.x * 100)}% | Y: {Math.round(position.y * 100)}%
          </span>
        </div>
      </div>

      {/* XY Pad Surface */}
      <div
        ref={padRef}
        className="relative cursor-crosshair"
        style={{
          width: size,
          height: size,
          minWidth: 44,
          minHeight: 44,
          touchAction: "none",
          borderRadius: 0,
          background: isActive
            ? "linear-gradient(135deg, #111 0%, #050505 100%)"
            : "#111",
          border: `4px solid ${isDragging ? "#FFD700" : "#E0E0E0"}`,
          boxShadow: isDragging
            ? "0 0 20px rgba(255, 215, 0, 0.3), inset 0 0 30px rgba(255, 215, 0, 0.1)"
            : "inset 0 2px 8px rgba(0,0,0,0.5)",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Grid Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {/* Vertical center */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#E0E0E0]" />
          {/* Horizontal center */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-[#E0E0E0]" />
          {/* Quarter lines */}
          <div className="absolute left-1/4 top-0 bottom-0 w-px bg-[#E0E0E0]/50" />
          <div className="absolute left-3/4 top-0 bottom-0 w-px bg-[#E0E0E0]/50" />
          <div className="absolute top-1/4 left-0 right-0 h-px bg-[#E0E0E0]/50" />
          <div className="absolute top-3/4 left-0 right-0 h-px bg-[#E0E0E0]/50" />
        </div>

        {/* Trail Visualization */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={size}
          height={size}
          style={{ overflow: "visible" }}
        >
          <AnimatePresence>
            {trail.map((point, index) => {
              const age = Date.now() - point.timestamp;
              const opacity = Math.max(0, 1 - age / 800);
              const pointSize = 8 * opacity + 2;

              return (
                <motion.circle
                  key={point.id}
                  cx={point.x * (size - 8) + 4}
                  cy={(1 - point.y) * (size - 8) + 4}
                  r={pointSize}
                  fill="#FFD700"
                  initial={{ opacity: 0.8, scale: 1 }}
                  animate={{ opacity, scale: opacity }}
                  exit={{ opacity: 0 }}
                  style={{
                    filter: `blur(${(1 - opacity) * 3}px)`,
                    boxShadow: "0 0 10px #FFD700",
                  }}
                />
              );
            })}
          </AnimatePresence>

          {/* Trail line connecting points */}
          {trail.length > 1 && (
            <motion.path
              d={trail
                .map((point, i) => {
                  const px = point.x * (size - 8) + 4;
                  const py = (1 - point.y) * (size - 8) + 4;
                  return i === 0 ? `M ${px} ${py}` : `L ${px} ${py}`;
                })
                .join(" ")}
              fill="none"
              stroke="#FFD700"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.4}
              style={{ filter: "blur(1px)" }}
            />
          )}
        </svg>

        {/* Current Position Indicator */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            width: 24,
            height: 24,
            borderRadius: 0,
            border: "3px solid #FFD700",
            background: isDragging
              ? "rgba(255, 215, 0, 0.3)"
              : "rgba(255, 215, 0, 0.1)",
            boxShadow: isDragging
              ? "0 0 20px #FFD700, 0 0 40px rgba(255, 215, 0, 0.5)"
              : "0 0 10px rgba(255, 215, 0, 0.3)",
            left: position.x * (size - 24),
            top: (1 - position.y) * (size - 24),
          }}
          animate={{
            scale: isDragging ? 1.2 : 1,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {/* Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-0.5 bg-[#FFD700]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-0.5 h-full bg-[#FFD700]" />
          </div>
        </motion.div>

        {/* Axis Labels */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-mono text-[#E0E0E0]/40 uppercase pointer-events-none">
          {xLabel}
        </div>
        <div
          className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-mono text-[#E0E0E0]/40 uppercase pointer-events-none"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg) translateY(50%)" }}
        >
          {yLabel}
        </div>
      </div>

      {/* Status Bar */}
      <div className="mt-2 flex justify-between text-[9px] font-mono text-[#E0E0E0]/50 uppercase">
        <span>{isDragging ? "MANIPULATING..." : "TOUCH_TO_CONTROL"}</span>
        <span className={isDragging ? "text-[#FFD700]" : ""}>
          {isDragging ? "● LIVE" : "○ STANDBY"}
        </span>
      </div>
    </div>
  );
}

