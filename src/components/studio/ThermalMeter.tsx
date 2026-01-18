"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ThermalMeterProps {
  audioLevel: number; // 0.0 to 1.0
  className?: string;
}

/**
 * ThermalMeter - Visual "Signal Heat" Meter
 *
 * V3 Urban Syndicate: Pulses when high-intensity audio is being processed.
 * Displays signal intensity with color-coded thermal visualization.
 */
export function ThermalMeter({ audioLevel, className = "" }: ThermalMeterProps) {
  const [pulseIntensity, setPulseIntensity] = useState(0);

  // Calculate pulse intensity based on audio level
  useEffect(() => {
    // High intensity threshold: > 0.7
    if (audioLevel > 0.7) {
      setPulseIntensity(audioLevel);
    } else {
      setPulseIntensity(0);
    }
  }, [audioLevel]);

  // Color mapping: Cool (blue) -> Warm (yellow) -> Hot (red)
  const getColor = (level: number) => {
    if (level < 0.33) {
      return "#3B82F6"; // Blue (cool)
    } else if (level < 0.66) {
      return "#FBBF24"; // Yellow (warm)
    } else {
      return "#EF4444"; // Red (hot)
    }
  };

  const color = getColor(audioLevel);

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      <div className="text-[10px] font-mono text-[#E0E0E0]/60 uppercase mb-1">
        SIGNAL_HEAT
      </div>

      {/* Meter Container */}
      <div className="relative h-4 bg-[#111] border-2 border-[#E0E0E0] overflow-hidden">
        {/* Fill Bar */}
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${audioLevel * 100}%`,
            backgroundColor: color,
            boxShadow: pulseIntensity > 0.7 ? `0 0 20px ${color}` : "none",
          }}
          animate={{
            opacity: pulseIntensity > 0.7 ? [1, 0.8, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            repeat: pulseIntensity > 0.7 ? Infinity : 0,
            ease: "easeInOut",
          }}
        />

        {/* Thermal Gradient Overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `linear-gradient(to right,
              #3B82F6 0%,
              #60A5FA 25%,
              #FBBF24 50%,
              #F59E0B 75%,
              #EF4444 100%)`,
          }}
        />

        {/* Intensity Markers */}
        <div className="absolute inset-0 flex">
          {[0, 0.33, 0.66, 1].map((marker) => (
            <div
              key={marker}
              className="absolute top-0 bottom-0 w-0.5 bg-[#E0E0E0]/20"
              style={{ left: `${marker * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Value Display */}
      <div className="text-[9px] font-mono text-[#E0E0E0]/40 mt-0.5">
        {Math.round(audioLevel * 100)}%
      </div>
    </div>
  );
}

