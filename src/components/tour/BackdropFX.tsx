"use client";

import { motion } from "framer-motion";
import { useGlitchOverlay } from "@/hooks/useGlitchOverlay";

interface BackdropFXProps {
  className?: string;
}

/**
 * Backdrop component for modal backgrounds with noise, overlays, and gridlines
 */
export function BackdropFX({ className = "" }: BackdropFXProps) {
  const scanlineSVG = useGlitchOverlay();

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Gridlines */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(204, 255, 0, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(204, 255, 0, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Noise Overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
          mixBlendMode: "overlay",
        }}
      />

      {/* Neon Scanlines - Hip-Hop Vibe */}
      {scanlineSVG}

      {/* Neon Glitch Flicker Effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(204,255,0,0.02) 50%, transparent 100%)',
        }}
        animate={{
          opacity: [0, 0.03, 0],
        }}
        transition={{
          duration: 0.1,
          repeat: Infinity,
          repeatDelay: Math.random() * 2 + 1,
        }}
      />

      {/* Neon Outline Glitch */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 40px rgba(204,255,0,0.1), 0 0 60px rgba(204,255,0,0.05)',
        }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

