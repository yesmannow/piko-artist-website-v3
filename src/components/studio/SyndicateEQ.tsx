"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAudioStore } from "@/stores/useAudioStore";

interface StemGains {
  vocals: number;
  bass: number;
  drums: number;
  other: number;
}

interface SyndicateEQProps {
  stems?: {
    vocals?: AudioBuffer;
    bass?: AudioBuffer;
    drums?: AudioBuffer;
    other?: AudioBuffer;
  };
  onStemGainChange?: (stem: keyof StemGains, gain: number) => void;
}

/**
 * SyndicateEQ - Brutalist Stem Mixing Console
 *
 * V3 Urban Syndicate: Industrial EQ sliders for controlling isolated stem volumes
 * (Vocals, Bass, Drums, Other) with 0px border-radius and Safety Yellow highlights.
 *
 * Features:
 * - 44x44px minimum touch targets for mobile
 * - Real-time gain control mapped to stem GainNodes
 * - Brutalist styling with Safety Yellow (#FFD700) accents
 */
export function SyndicateEQ({ stems, onStemGainChange }: SyndicateEQProps) {
  const { audioContext } = useAudioStore();
  const [gains, setGains] = useState<StemGains>({
    vocals: 1.0,
    bass: 1.0,
    drums: 1.0,
    other: 1.0,
  });

  // Stem gain nodes (created when stems are available)
  const gainNodesRef = useRef<Map<keyof StemGains, GainNode>>(new Map());

  // Initialize gain nodes when stems are available
  useEffect(() => {
    if (!audioContext || !stems) return;

    // Create gain nodes for each stem
    const nodes = new Map<keyof StemGains, GainNode>();
    (Object.keys(stems) as (keyof StemGains)[]).forEach((stem) => {
      if (stems[stem]) {
        const gainNode = audioContext.createGain();
        gainNode.gain.value = gains[stem];
        nodes.set(stem, gainNode);
      }
    });

    gainNodesRef.current = nodes;

    return () => {
      // Cleanup: disconnect all gain nodes
      nodes.forEach((node) => node.disconnect());
    };
  }, [audioContext, stems, gains]);

  /**
   * Handle gain change for a specific stem
   */
  const handleGainChange = useCallback(
    (stem: keyof StemGains, value: number) => {
      const clampedValue = Math.max(0, Math.min(2.0, value)); // 0-200% range
      setGains((prev) => ({ ...prev, [stem]: clampedValue }));

      // Update gain node
      const gainNode = gainNodesRef.current.get(stem);
      if (gainNode && audioContext) {
        const currentTime = audioContext.currentTime;
        gainNode.gain.setTargetAtTime(clampedValue, currentTime, 0.02);
      }

      // Notify parent component
      onStemGainChange?.(stem, clampedValue);
    },
    [audioContext, onStemGainChange],
  );

  const stemConfigs: {
    key: keyof StemGains;
    label: string;
    color: string;
  }[] = [
    { key: "vocals", label: "VOX", color: "#FFD700" },
    { key: "bass", label: "BASS", color: "#E0E0E0" },
    { key: "drums", label: "DRUM", color: "#FFD700" },
    { key: "other", color: "#E0E0E0", label: "OTHER" },
  ];

  return (
    <div className="bg-[#111] border-4 border-[#E0E0E0] p-4">
      <h3
        className="text-sm font-black italic uppercase text-[#FFD700] mb-4"
        style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
      >
        SYNDICATE_EQ
      </h3>

      <div className="space-y-4">
        {stemConfigs.map((config) => {
          const gain = gains[config.key];
          const isActive = stems?.[config.key] !== undefined;

          return (
            <div key={config.key} className="space-y-2">
              {/* Label */}
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-mono uppercase"
                  style={{ color: isActive ? config.color : "#E0E0E0/40" }}
                >
                  {config.label}
                </span>
                <span className="text-xs font-mono text-[#E0E0E0]/60">
                  {Math.round(gain * 100)}%
                </span>
              </div>

              {/* Slider - 44px minimum height for touch targets */}
              <div className="relative h-11 min-h-[44px] bg-[#050505] border-2 border-[#E0E0E0]/30">
                {/* Track */}
                <div className="absolute inset-0 flex items-center">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${(gain / 2.0) * 100}%`,
                      backgroundColor: isActive ? config.color : "#E0E0E0/20",
                      borderRadius: 0, // 0px border-radius (brutalist)
                    }}
                  />
                </div>

                {/* Thumb - 44x44px minimum */}
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.01"
                  value={gain}
                  onChange={(e) =>
                    handleGainChange(config.key, parseFloat(e.target.value))
                  }
                  disabled={!isActive}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  style={{
                    minHeight: "44px",
                    minWidth: "44px",
                  }}
                />

                {/* Visual thumb indicator */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] border-2 border-[#E0E0E0] bg-[#111] pointer-events-none"
                  style={{
                    left: `${(gain / 2.0) * 100}%`,
                    marginLeft: "-22px", // Center the thumb
                    borderRadius: 0, // 0px border-radius
                    borderColor: isActive ? config.color : "#E0E0E0/30",
                    boxShadow: isActive
                      ? `0 0 12px ${config.color}40, inset 0 0 8px ${config.color}20`
                      : "inset 0 2px 4px rgba(0,0,0,0.5)",
                  }}
                  animate={{
                    scale: isActive ? 1 : 0.9,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Status indicator */}
      {stems && (
        <div className="mt-4 pt-4 border-t-2 border-[#E0E0E0]/20">
          <p className="text-[8px] font-mono text-[#E0E0E0]/60 uppercase">
            STEMS_ACTIVE: {Object.keys(stems).length}/4
          </p>
        </div>
      )}
    </div>
  );
}
