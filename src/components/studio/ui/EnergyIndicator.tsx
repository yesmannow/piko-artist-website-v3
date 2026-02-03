"use client";

/**
 * EnergyIndicator Component - Phase IX.5
 *
 * Vertical energy meter next to jog wheel
 * Displays 0.0-1.0 energy level with gradient from Electric Indigo to Cyber Lime
 */

import { motion } from 'framer-motion';

interface EnergyIndicatorProps {
  energy: number; // 0.0-1.0
  className?: string;
}

export function EnergyIndicator({ energy, className = '' }: EnergyIndicatorProps) {
  const normalizedEnergy = Math.min(1, Math.max(0, energy));
  const heightPercent = normalizedEnergy * 100;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <span className="text-[10px] font-mono uppercase text-white/60 tracking-wider">Energy</span>

      {/* Vertical Bar */}
      <div className="relative w-8 h-40 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
        {/* Energy Fill */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-indigo-500 via-purple-500 to-lime-400"
          initial={{ height: 0 }}
          animate={{ height: `${heightPercent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />

        {/* Segmented Indicators */}
        <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="h-[1px] bg-zinc-950/50 mx-1"
            />
          ))}
        </div>
      </div>

      {/* Numeric Display */}
      <span className="text-xs font-mono font-bold text-white/80">
        {(normalizedEnergy * 100).toFixed(0)}%
      </span>
    </div>
  );
}
