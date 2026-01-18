"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Tooltip } from "./Tooltip";

interface KnobProps {
  value: number; // 0 to 1
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
  size?: number;
  color?: "low" | "mid" | "high"; // Color coding for EQ
  helpText?: string;
}

export function Knob({
  value,
  onChange,
  label,
  min = 0,
  max = 1,
  size = 60,
  color,
  helpText
}: KnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);

  const normalizedValue = (value - min) / (max - min);
  const rotation = normalizedValue * 270 - 135; // -135 to 135 degrees

  // Color coding for EQ bands
  // Low = Blue, Mid = Green, High = Red
  const getRingColor = () => {
    switch (color) {
      case "low":
        return "#3b82f6"; // Blue
      case "mid":
        return "#22c55e"; // Green
      case "high":
        return "#ef4444"; // Red
      default:
        return "#2a2a2a"; // Default grey
    }
  };

  const ringColor = getRingColor();

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    let lastY = 0;
    let accumulatedDelta = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!knobRef.current) return;

      const rect = knobRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Support both circular drag and vertical drag
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      // Vertical drag (up/down) for easier mobile interaction
      if (Math.abs(dy) > Math.abs(dx)) {
        const deltaY = lastY === 0 ? 0 : e.clientY - lastY;
        lastY = e.clientY;
        accumulatedDelta -= deltaY; // Invert: up = increase, down = decrease

        const sensitivity = 2; // Adjust sensitivity
        const normalizedDelta = accumulatedDelta / (rect.height * sensitivity);
        let newValue = normalizedValue + normalizedDelta;
        newValue = Math.max(0, Math.min(1, newValue));

        const finalValue = min + newValue * (max - min);
        onChange(finalValue);
      } else {
        // Circular drag (original behavior)
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        angle += 90; // Adjust for 0 at top
        if (angle < 0) angle += 360;

        // Map angle (0-360) to value (0-1)
        let newValue = (angle - 135) / 270;
        if (newValue < 0) newValue = 0;
        if (newValue > 1) newValue = 1;

        const finalValue = min + newValue * (max - min);
        onChange(finalValue);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!knobRef.current) return;
      if (e.touches.length === 0) return;

      const rect = knobRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const touch = e.touches[0];

      // Support both circular drag and vertical drag
      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;

      // Vertical drag (up/down) for easier mobile interaction
      if (Math.abs(dy) > Math.abs(dx)) {
        const deltaY = lastY === 0 ? 0 : touch.clientY - lastY;
        lastY = touch.clientY;
        accumulatedDelta -= deltaY; // Invert: up = increase, down = decrease

        const sensitivity = 2; // Adjust sensitivity
        const normalizedDelta = accumulatedDelta / (rect.height * sensitivity);
        let newValue = normalizedValue + normalizedDelta;
        newValue = Math.max(0, Math.min(1, newValue));

        const finalValue = min + newValue * (max - min);
        onChange(finalValue);
      } else {
        // Circular drag (original behavior)
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        angle += 90; // Adjust for 0 at top
        if (angle < 0) angle += 360;

        // Map angle (0-360) to value (0-1)
        let newValue = (angle - 135) / 270;
        if (newValue < 0) newValue = 0;
        if (newValue > 1) newValue = 1;

        const finalValue = min + newValue * (max - min);
        onChange(finalValue);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      lastY = 0;
      accumulatedDelta = 0;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, onChange, min, max, normalizedValue]);

  const knobContent = (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={knobRef}
        className="relative cursor-pointer select-none"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
      >
        {/* Outer ring with color coding */}
        <div
          className="absolute inset-0 rounded-full border-2 border-gray-600"
          style={{
            background: color
              ? `conic-gradient(
                  from 0deg,
                  ${ringColor}40 0deg,
                  ${ringColor}40 ${normalizedValue * 270}deg,
                  #1a1a1a ${normalizedValue * 270}deg,
                  #1a1a1a 270deg
                )`
              : `conic-gradient(
                  from 0deg,
                  #2a2a2a 0deg,
                  #2a2a2a ${normalizedValue * 270}deg,
                  #1a1a1a ${normalizedValue * 270}deg,
                  #1a1a1a 270deg
                )`,
          }}
        />

        {/* Colored ring indicator */}
        {color && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: `2px solid ${ringColor}40`,
              opacity: normalizedValue > 0.1 ? 1 : 0.3,
            }}
          />
        )}

        {/* Inner circle */}
        <div className="absolute inset-2 rounded-full bg-[#1a1a1a] border border-gray-700" />

        {/* Indicator line */}
        <motion.div
          className="absolute top-1 left-1/2 w-0.5 bg-white origin-bottom"
          style={{
            height: size * 0.25,
            x: "-50%",
            rotate: rotation,
          }}
        />

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-500" />
      </div>
      {label && (
        <span className="text-xs font-barlow uppercase text-gray-400 tracking-wider">
          {label}
        </span>
      )}
    </div>
  );

  if (helpText) {
    return <Tooltip content={helpText}>{knobContent}</Tooltip>;
  }

  return knobContent;
}

