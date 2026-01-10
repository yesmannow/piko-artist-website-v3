"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Tooltip } from "./Tooltip";

interface FaderProps {
  value: number; // 0 to 1
  onChange: (value: number) => void;
  label?: string;
  height?: number;
  helpText?: string;
}

/**
 * Fader with Elastic Boundaries
 *
 * When user drags to 0% or 100%, visual elements "stretch" 5px past the limit
 * and snap back to simulate rubber gaskets.
 */
export function Fader({
  value,
  onChange,
  label,
  height = 200,
  helpText,
}: FaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const faderRef = useRef<HTMLDivElement>(null);

  // Motion values for elastic boundaries
  const rawPosition = useMotionValue((1 - value) * height);
  const springPosition = useSpring(rawPosition, {
    stiffness: 300,
    damping: 30,
    restDelta: 0.01,
  });

  // Calculate elastic stretch when at boundaries
  const displayPosition = useTransform(springPosition, (pos) => {
    const clamped = Math.max(0, Math.min(height, pos));
    const stretch = pos - clamped;
    // Limit stretch to 5px
    const limitedStretch = Math.max(-5, Math.min(5, stretch));
    return clamped + limitedStretch;
  });

  // Update raw position when value prop changes (but not while dragging)
  useEffect(() => {
    if (!isDragging) {
      rawPosition.set((1 - value) * height);
    }
  }, [value, height, isDragging, rawPosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const updateValue = (clientY: number) => {
      if (!faderRef.current) return;
      const rect = faderRef.current.getBoundingClientRect();
      const y = clientY - rect.top;

      // Allow stretching past boundaries during drag
      rawPosition.set(y - 12); // Offset by half cap height

      // Calculate actual value (clamped) for onChange
      const newValue = 1 - Math.max(0, Math.min(1, y / rect.height));
      onChange(newValue);
    };

    const handleMouseMove = (e: MouseEvent) => {
      updateValue(e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateValue(e.touches[0].clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Snap back to clamped position
      const currentPos = rawPosition.get();
      const clampedPos = Math.max(0, Math.min(height, currentPos));
      rawPosition.set(clampedPos);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      // Snap back to clamped position
      const currentPos = rawPosition.get();
      const clampedPos = Math.max(0, Math.min(height, currentPos));
      rawPosition.set(clampedPos);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, onChange, height, rawPosition]);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const faderContent = (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-xs font-barlow uppercase text-gray-400 tracking-wider">
          {label}
        </span>
      )}
      <div
        ref={faderRef}
        className="relative cursor-pointer select-none touch-manipulation"
        style={{
          height,
          width: isMobile ? 50 : 40,
          touchAction: "none",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Track groove */}
        <div className="absolute inset-0 bg-[#0a0a0a] rounded-sm border border-gray-800">
          {/* Groove lines */}
          <div className="absolute inset-x-0 top-0 h-px bg-gray-700" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-gray-700" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gray-700" />
        </div>

        {/* Fader cap with elastic boundaries */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 bg-[#2a2a2a] border border-gray-600 rounded-sm shadow-lg cursor-grab active:cursor-grabbing touch-manipulation"
          style={{
            top: displayPosition,
            width: isMobile ? 44 : 32,
            height: isMobile ? 20 : 24,
            minWidth: isMobile ? 44 : 32,
            minHeight: isMobile ? 20 : 24,
          }}
          whileHover={!isMobile ? { scale: 1.05 } : {}}
          whileTap={{ scale: 0.95 }}
        >
          {/* Cap detail lines */}
          <div className="absolute inset-x-1 top-1 h-px bg-gray-500" />
          <div className="absolute inset-x-1 bottom-1 h-px bg-gray-500" />
        </motion.div>
      </div>
    </div>
  );

  if (helpText) {
    return <Tooltip content={helpText}>{faderContent}</Tooltip>;
  }

  return faderContent;
}
