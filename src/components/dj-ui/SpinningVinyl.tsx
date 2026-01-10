"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface SpinningVinylProps {
  isPlaying: boolean;
  coverArt?: string;
  rotation: number;
  onScratch?: (velocity: number, isTouching: boolean) => void;
  size?: number;
  deckColor?: string;
  duration?: number; // Track duration in seconds
}

export function SpinningVinyl({
  isPlaying,
  coverArt,
  rotation,
  onScratch,
  size = 200,
  deckColor = "#00d9ff",
  duration = 0,
}: SpinningVinylProps) {
  const vinylRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastAngle, setLastAngle] = useState(0);
  const [lastTime, setLastTime] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  // Handle gradient coverArt
  const isImagePath = (art: string | undefined): boolean => {
    return !!art && art.startsWith("/");
  };

  // Calculate angle from center
  const calculateAngle = useCallback(
    (clientX: number, clientY: number): number => {
      if (!vinylRef.current) return 0;

      const rect = vinylRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;

      return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    },
    [],
  );

  // Handle mouse/touch start
  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      setIsDragging(true);
      const angle = calculateAngle(clientX, clientY);
      setLastAngle(angle);
      setLastTime(Date.now());
      onScratch?.(0, true);
    },
    [calculateAngle, onScratch],
  );

  // Handle mouse/touch move
  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;

      const currentAngle = calculateAngle(clientX, clientY);
      const currentTime = Date.now();

      // Calculate angular velocity
      let angleDelta = currentAngle - lastAngle;

      // Handle wrap-around
      if (angleDelta > 180) angleDelta -= 360;
      if (angleDelta < -180) angleDelta += 360;

      const timeDelta = Math.max(1, currentTime - lastTime);
      const velocity = angleDelta / timeDelta; // degrees per millisecond

      setLastAngle(currentAngle);
      setLastTime(currentTime);

      onScratch?.(velocity * 100, true); // Scale velocity for audio effect
    },
    [isDragging, lastAngle, lastTime, calculateAngle, onScratch],
  );

  // Handle mouse/touch end
  const handleEnd = useCallback(() => {
    setIsDragging(false);
    onScratch?.(0, false);
  }, [onScratch]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Add/remove global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={vinylRef}
      className="relative select-none touch-none"
      style={{ width: size, height: size }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Vinyl Record */}
      <motion.div
        className="absolute inset-0 rounded-full cursor-grab active:cursor-grabbing"
        style={{
          background: `radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 40%, #1a1a1a 60%, #0a0a0a 100%)`,
          boxShadow: `
            inset 0 0 20px rgba(0, 0, 0, 0.8),
            0 4px 20px rgba(0, 0, 0, 0.5),
            0 0 0 2px ${deckColor}40
          `,
          rotate: `${rotation}deg`,
        }}
        animate={{
          rotate:
            isPlaying && !isDragging ? [rotation, rotation + 360] : rotation,
        }}
        transition={{
          duration: isPlaying && !isDragging ? 2 : 0,
          repeat: isPlaying && !isDragging ? Infinity : 0,
          ease: "linear",
        }}
      >
        {/* Grooves */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border border-gray-800/30"
            style={{
              margin: `${10 + i * 5}px`,
            }}
          />
        ))}

        {/* Center Label */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            margin: `${size * 0.25}px`,
          }}
        >
          <div
            className="relative w-full h-full rounded-full overflow-hidden border-2"
            style={{
              borderColor: deckColor,
              boxShadow: `0 0 10px ${deckColor}80`,
            }}
          >
            {coverArt && isImagePath(coverArt) ? (
              <Image
                src={coverArt}
                alt="Track artwork"
                fill
                className="object-cover"
                sizes={`${size * 0.5}px`}
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: coverArt?.includes("from-")
                    ? `linear-gradient(135deg, var(--tw-gradient-stops))`
                    : `radial-gradient(circle, ${deckColor}40, ${deckColor}20)`,
                }}
              />
            )}

            {/* Center Hole */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                margin: `${size * 0.15}px`,
              }}
            >
              <div
                className="w-full h-full rounded-full bg-black border-2"
                style={{
                  borderColor: deckColor,
                  boxShadow: `inset 0 0 10px rgba(0, 0, 0, 0.8)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Spindle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-3 h-3 rounded-full bg-gray-700 border border-gray-600"
            style={{
              boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.5)",
            }}
          />
        </div>
      </motion.div>

      {/* Playback Indicator */}
      {isPlaying && !isDragging && (
        <div
          className="absolute top-1 right-1 w-3 h-3 rounded-full animate-pulse"
          style={{
            backgroundColor: deckColor,
            boxShadow: `0 0 10px ${deckColor}`,
          }}
        />
      )}

      {/* Scratch Indicator */}
      {isDragging && (
        <div
          className="absolute inset-0 rounded-full border-2 border-dashed animate-spin"
          style={{
            borderColor: deckColor,
            animationDuration: "1s",
          }}
        />
      )}

      {/* Mini Waveform Position Indicator */}
      {isPlaying && duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 30"
            preserveAspectRatio="none"
          >
            {/* Background waveform (simplified visual) */}
            <path
              d="M 0,15 Q 10,5 20,15 T 40,15 T 60,15 T 80,15 T 100,15"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            {/* Progress waveform */}
            <defs>
              <clipPath id={`waveform-clip-${deckColor}`}>
                <rect x="0" y="0" width={(rotation / 360) * 100} height="30" />
              </clipPath>
            </defs>
            <path
              d="M 0,15 Q 10,5 20,15 T 40,15 T 60,15 T 80,15 T 100,15"
              fill="none"
              stroke={deckColor}
              strokeWidth="2"
              clipPath={`url(#waveform-clip-${deckColor})`}
            />
            {/* Playhead indicator */}
            <line
              x1={(rotation / 360) * 100}
              y1="0"
              x2={(rotation / 360) * 100}
              y2="30"
              stroke={deckColor}
              strokeWidth="2"
              opacity="0.8"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
