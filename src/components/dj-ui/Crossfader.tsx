"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface CrossfaderProps {
  value: number; // 0 to 1 (0 = left, 1 = right)
  onChange: (value: number) => void;
  width?: number;
}

export function Crossfader({ value, onChange, width = 300 }: CrossfaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const faderRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!faderRef.current) return;

      const rect = faderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newValue = Math.max(0, Math.min(1, x / rect.width));
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onChange]);

  const position = value * width;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-barlow uppercase text-gray-400 tracking-wider">
        CROSSFADER
      </span>
      <div
        ref={faderRef}
        className="relative cursor-pointer select-none"
        style={{ width, height: 30 }}
        onMouseDown={handleMouseDown}
      >
        {/* Track groove */}
        <div className="absolute inset-0 bg-[#0a0a0a] rounded-sm border border-gray-800">
          {/* Center marker */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-600" />
        </div>

        {/* Fader cap */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-10 h-6 bg-[#2a2a2a] border border-gray-600 rounded-sm shadow-lg cursor-grab active:cursor-grabbing"
          style={{
            left: position - 20,
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
}

