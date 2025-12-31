"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHaptic } from "@/hooks/useHaptic";

interface CrossFaderProps {
  position: number; // 0.0 to 1.0
  onPositionChange: (position: number) => void;
  className?: string;
}

/**
 * CrossFader - Mechanical Chrome Block with Particle Sparks
 *
 * V3 Urban Syndicate: Brutalist crossfader with Safety Yellow particle effects
 * at 0.0 and 1.0 positions. Triggers haptic feedback on mobile.
 */
export function CrossFader({ position, onPositionChange, className = "" }: CrossFaderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const { triggerHaptic } = useHaptic();
  const lastPositionRef = useRef(position);

  // Generate particles at 0.0 and 1.0 positions
  useEffect(() => {
    if (position === 0 || position === 1) {
      // Trigger haptic feedback on mobile (light click: 10ms)
      triggerHaptic(10);

      // Generate particle sparks
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: position === 0 ? 0 : 100,
        y: 50 + (Math.random() - 0.5) * 20,
      }));

      setParticles((prev) => [...prev, ...newParticles]);

      // Remove particles after animation
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
      }, 1000);
    }
    lastPositionRef.current = position;
  }, [position, triggerHaptic]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const newPosition = Math.max(0, Math.min(1, x / rect.width));

    onPositionChange(newPosition);
  }, [onPositionChange]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };

    const handleEnd = () => {
      setIsDragging(false);
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
  }, [isDragging, handleMove]);

  return (
    <div className={`relative ${className}`}>
      {/* Track */}
      <div
        ref={sliderRef}
        className="relative h-16 bg-[#111] border-4 border-[#E0E0E0] cursor-pointer"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Center Indicator */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#E0E0E0]/30" />

        {/* Fader Handle - Mechanical Chrome Block */}
        <motion.div
          className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-[#C0C0C0] via-[#E0E0E0] to-[#C0C0C0] border-2 border-[#000] cursor-grab active:cursor-grabbing"
          style={{
            left: `${position * 100}%`,
            marginLeft: "-16px", // Center the handle
            boxShadow: "inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.5), 4px 4px 0px rgba(0,0,0,1)",
          }}
          animate={{
            x: 0,
          }}
          whileHover={{
            scale: 1.05,
          }}
          whileTap={{
            scale: 0.95,
          }}
        >
          {/* Chrome Shader - High-contrast linear gradient */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)",
            }}
          />
        </motion.div>

        {/* Position Labels */}
        <div className="absolute top-1 left-2 text-[10px] font-mono text-[#E0E0E0]/50 uppercase">
          ARTIST
        </div>
        <div className="absolute top-1 right-2 text-[10px] font-mono text-[#E0E0E0]/50 uppercase">
          VAULT
        </div>
      </div>

      {/* Particle Sparks */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-[#FFD700]"
            initial={{
              x: `${particle.x}%`,
              y: `${particle.y}%`,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: `${particle.x + (Math.random() - 0.5) * 20}%`,
              y: `${particle.y - 30}%`,
              opacity: 0,
              scale: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            style={{
              boxShadow: "0 0 8px #FFD700, 0 0 16px #FFD700",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

