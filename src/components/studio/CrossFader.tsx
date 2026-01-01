"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHaptic } from "@/hooks/useHaptic";

interface CrossFaderProps {
  position: number; // 0.0 to 1.0
  onPositionChange: (position: number) => void;
  className?: string;
  filterMode?: boolean;
  onFilterModeChange?: (enabled: boolean) => void;
}

interface TouchTrail {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

/**
 * CrossFader - Mechanical Chrome Block with Particle Sparks
 *
 * V3 Urban Syndicate: Brutalist crossfader with Safety Yellow particle effects
 * at 0.0 and 1.0 positions. Triggers haptic feedback on mobile.
 */
export function CrossFader({ position, onPositionChange, className = "", filterMode = false, onFilterModeChange }: CrossFaderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [touchTrails, setTouchTrails] = useState<TouchTrail[]>([]);
  const { triggerHaptic } = useHaptic();
  const lastPositionRef = useRef(position);
  const lastTouchXRef = useRef<number | null>(null);

  // Generate particles at 0.0, 0.5, and 1.0 positions
  useEffect(() => {
    const isExtreme = position === 0 || position === 1;
    const isCenter = Math.abs(position - 0.5) < 0.01;

    if (isExtreme || isCenter) {
      // Trigger haptic feedback on mobile (light click: 10ms)
      triggerHaptic(10);

      // Generate particle sparks at extremes or center
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: position === 0 ? 0 : position === 1 ? 100 : 50,
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

  const handleMove = useCallback((clientX: number, isTouch: boolean = false) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const newPosition = Math.max(0, Math.min(1, x / rect.width));

    // Add Safety Yellow touch trail on mobile
    if (isTouch && typeof window !== "undefined" && window.innerWidth < 768) {
      const relativeX = (x / rect.width) * 100;
      const relativeY = 50; // Center of slider

      const newTrail: TouchTrail = {
        id: Date.now() + Math.random(),
        x: relativeX,
        y: relativeY,
        timestamp: Date.now(),
      };

      setTouchTrails((prev) => [...prev, newTrail].slice(-20)); // Keep last 20 trails

      // Remove trails after 500ms
      setTimeout(() => {
        setTouchTrails((prev) => prev.filter((t) => t.id !== newTrail.id));
      }, 500);
    }

    onPositionChange(newPosition);
  }, [onPositionChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX, false);
  }, [handleMove]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    const touchX = e.touches[0].clientX;
    lastTouchXRef.current = touchX;
    handleMove(touchX, true);
  }, [handleMove]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, true);
      }
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
      {/* Filter Mode Toggle */}
      {onFilterModeChange && (
        <div className="mb-3 flex items-center justify-between">
          <label className="text-xs font-mono text-[#E0E0E0]/70 uppercase">FILTER_MODE</label>
          <button
            onClick={() => onFilterModeChange(!filterMode)}
            className={`relative w-12 h-6 min-w-[44px] min-h-[44px] border-2 border-[#E0E0E0] transition-colors ${
              filterMode ? "bg-[#FFD700] border-[#FFD700]" : "bg-[#111]"
            }`}
            style={{ borderRadius: 0 }}
            aria-label={filterMode ? "Disable filter mode" : "Enable filter mode"}
          >
            <motion.div
              className="absolute top-0.5 bottom-0.5 w-5 bg-[#111] border border-[#E0E0E0]"
              animate={{ x: filterMode ? 20 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{ borderRadius: 0 }}
            />
          </button>
        </div>
      )}

      {/* Track - 44px minimum height for touch targets */}
      <div
        ref={sliderRef}
        className="relative h-16 min-h-[44px] bg-[#111] border-4 border-[#E0E0E0] cursor-pointer"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{ touchAction: "none" }}
      >
        {/* Center Indicator */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#E0E0E0]/30" />

        {/* Fader Handle - Mechanical Chrome Block - 44px minimum width for touch */}
        <motion.div
          className="absolute top-0 bottom-0 w-8 min-w-[44px] bg-gradient-to-r from-[#C0C0C0] via-[#E0E0E0] to-[#C0C0C0] border-2 border-[#000] cursor-grab active:cursor-grabbing"
          style={{
            left: `${position * 100}%`,
            marginLeft: "-22px", // Center the handle (44px / 2)
            minHeight: "44px",
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

      {/* Safety Yellow Touch Trails (Mobile Only) */}
      {typeof window !== "undefined" && window.innerWidth < 768 && (
        <AnimatePresence>
          {touchTrails.map((trail) => (
            <motion.div
              key={trail.id}
              className="absolute w-2 h-2 rounded-full bg-[#FFD700]"
              initial={{
                x: `${trail.x}%`,
                y: `${trail.y}%`,
                opacity: 0.8,
                scale: 1,
              }}
              animate={{
                opacity: 0,
                scale: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
              }}
              style={{
                transform: `translate(-50%, -50%)`,
                boxShadow: "0 0 12px #FFD700, 0 0 24px #FFD700",
              }}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}

