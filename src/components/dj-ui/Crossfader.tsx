"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Tooltip } from "./Tooltip";

interface CrossfaderProps {
  value: number; // 0 to 1 (0 = left, 1 = right)
  onChange: (value: number) => void;
  width?: number;
  helpText?: string;
}

export function Crossfader({ value, onChange, width = 300, helpText }: CrossfaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const faderRef = useRef<HTMLDivElement>(null);

  // Make width responsive
  const responsiveWidth = typeof window !== "undefined" && window.innerWidth < 768
    ? Math.min(width, window.innerWidth - 80)
    : width;

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

    const updateValue = (clientX: number) => {
      if (!faderRef.current) return;
      const rect = faderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const newValue = Math.max(0, Math.min(1, x / rect.width));
      onChange(newValue);
    };

    const handleMouseMove = (e: MouseEvent) => {
      updateValue(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateValue(e.touches[0].clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
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
  }, [isDragging, onChange]);

  const position = value * responsiveWidth;

  const crossfaderContent = (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-barlow uppercase text-gray-400 tracking-wider">
        CROSSFADER
      </span>
      <div
        ref={faderRef}
        className="relative cursor-pointer select-none touch-manipulation"
        style={{
          width: responsiveWidth,
          height: typeof window !== "undefined" && window.innerWidth < 768 ? 40 : 30
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Track groove */}
        <div className="absolute inset-0 bg-[#0a0a0a] rounded-sm border border-gray-800">
          {/* Center marker */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-600" />
        </div>

        {/* Fader cap */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 bg-[#2a2a2a] border border-gray-600 rounded-sm shadow-lg cursor-grab active:cursor-grabbing touch-manipulation"
          style={{
            left: position - (typeof window !== "undefined" && window.innerWidth < 768 ? 22 : 20),
            width: typeof window !== "undefined" && window.innerWidth < 768 ? 44 : 40,
            height: typeof window !== "undefined" && window.innerWidth < 768 ? 24 : 24,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Cap detail lines */}
          <div className="absolute inset-y-1 left-1 w-px bg-gray-500" />
          <div className="absolute inset-y-1 right-1 w-px bg-gray-500" />
        </motion.div>
      </div>
    </div>
  );

  if (helpText) {
    return <Tooltip content={helpText}>{crossfaderContent}</Tooltip>;
  }

  return crossfaderContent;
}

