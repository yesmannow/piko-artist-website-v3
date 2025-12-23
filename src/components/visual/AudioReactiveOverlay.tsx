"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAudioAnalyser } from "@/hooks/useAudioAnalyser";

interface AudioReactiveOverlayProps {
  videoElement: HTMLVideoElement | HTMLIFrameElement | null;
  enabled?: boolean;
  className?: string;
}

/**
 * Audio-reactive CRT overlay component
 * Visualizes audio through scanline pulsing, bass tearing, and brightness jitter
 */
export function AudioReactiveOverlay({
  videoElement,
  enabled = true,
  className = "",
}: AudioReactiveOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { bass, mid, overall } = useAudioAnalyser(
    videoElement instanceof HTMLVideoElement ? videoElement : null,
    enabled && videoElement instanceof HTMLVideoElement
  );

  // Calculate scanline offset based on bass (horizontal tearing)
  const [tearOffset, setTearOffset] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const updateTear = () => {
      // Bass creates random Y-axis scanline offsets (tearing effect)
      const bassIntensity = bass * 0.5;
      const randomOffset = (Math.random() - 0.5) * bassIntensity * 20;
      setTearOffset(randomOffset);
      requestAnimationFrame(updateTear);
    };

    const frameId = requestAnimationFrame(updateTear);
    return () => cancelAnimationFrame(frameId);
  }, [bass, enabled]);

  // Scanline glow intensity based on overall level
  const scanlineGlow = overall * 0.3 + 0.1;

  // Brightness jitter based on mid frequencies
  const brightnessJitter = mid * 0.05;

  return (
    <div ref={overlayRef} className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Scanlines with pulsing glow */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 0, ${scanlineGlow}) 2px,
            rgba(0, 255, 0, ${scanlineGlow}) 4px
          )`,
          mixBlendMode: "screen",
          transform: `translateY(${tearOffset}px)`,
        }}
        animate={{
          opacity: [0.2, 0.3 + scanlineGlow, 0.2],
        }}
        transition={{
          duration: 0.1,
          repeat: Infinity,
        }}
      />

      {/* Bass tearing effect - horizontal scanline offsets */}
      {bass > 0.3 && (
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(204, 255, 0, ${bass * 0.2}) 2px,
              rgba(204, 255, 0, ${bass * 0.2}) 4px
            )`,
            mixBlendMode: "screen",
            clipPath: `polygon(0 ${50 + tearOffset}%, 100% ${50 + tearOffset}%, 100% ${55 + tearOffset}%, 0 ${55 + tearOffset}%)`,
          }}
          animate={{
            opacity: [0, bass * 0.4, 0],
          }}
          transition={{
            duration: 0.05,
            repeat: Infinity,
          }}
        />
      )}

      {/* Brightness jitter based on mid frequencies */}
      <motion.div
        className="absolute inset-0 bg-white"
        animate={{
          opacity: [0, brightnessJitter, 0],
        }}
        transition={{
          duration: 0.05,
          repeat: Infinity,
        }}
      />
    </div>
  );
}

