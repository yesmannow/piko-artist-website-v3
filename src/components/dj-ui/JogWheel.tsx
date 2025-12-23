"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface JogWheelProps {
  rotation: number; // Rotation in degrees
  isPlaying: boolean;
  size?: number;
  onScrub?: (delta: number) => void; // Delta rotation for scrubbing
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function JogWheel({
  rotation,
  isPlaying,
  size = 200,
  onScrub,
  onDragStart,
  onDragEnd,
}: JogWheelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragRotation, setDragRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const lastAngleRef = useRef<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    onDragStart?.();
    e.preventDefault();

    if (wheelRef.current) {
      const rect = wheelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      lastAngleRef.current = Math.atan2(dy, dx) * (180 / Math.PI);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!wheelRef.current || lastAngleRef.current === null) return;

      const rect = wheelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);

      // Calculate delta angle
      let deltaAngle = currentAngle - lastAngleRef.current;

      // Handle wrap-around
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;

      // Update drag rotation
      setDragRotation((prev) => prev + deltaAngle);

      // Call scrub callback
      if (onScrub) {
        onScrub(deltaAngle);
      }

      lastAngleRef.current = currentAngle;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragRotation(0);
      lastAngleRef.current = null;
      onDragEnd?.();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleMouseMove as any);
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove as any);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, onScrub, onDragEnd]);

  const displayRotation = isDragging ? dragRotation : (isPlaying ? rotation : 0);

  return (
    <div
      ref={wheelRef}
      className="relative cursor-grab active:cursor-grabbing select-none touch-none"
      style={{ width: size, height: size }}
      onMouseDown={handleMouseDown}
      onTouchStart={(e) => {
        setIsDragging(true);
        onDragStart?.();
        e.preventDefault();
        if (wheelRef.current) {
          const rect = wheelRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const touch = e.touches[0];
          const dx = touch.clientX - centerX;
          const dy = touch.clientY - centerY;
          lastAngleRef.current = Math.atan2(dy, dx) * (180 / Math.PI);
        }
      }}
    >
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-4 border-gray-700 bg-[#1a1a1a]" />

      {/* Inner ring */}
      <div className="absolute inset-4 rounded-full border-2 border-gray-600 bg-[#0a0a0a]" />

      {/* Rotating disc */}
      <motion.div
        className="absolute inset-8 rounded-full bg-[#1a1a1a] border border-gray-700"
        animate={{ rotate: displayRotation }}
        transition={isDragging ? { duration: 0 } : { duration: 0.1, ease: "linear" }}
      >
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-500" />

        {/* Spoke lines */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <div
            key={angle}
            className="absolute top-1/2 left-1/2 w-px h-1/2 origin-top bg-gray-600"
            style={{
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
            }}
          />
        ))}
      </motion.div>

      {/* Play indicator */}
      {isPlaying && !isDragging && (
        <motion.div
          className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500" />
      )}
    </div>
  );
}

