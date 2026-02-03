"use client";

import React from "react";
import { motion } from "framer-motion";
import { useStudioStore } from "@/store/useStudioStore";

interface StemRackProps {
  deck: "A" | "B";
  className?: string;
}

type StemType = "vocals" | "drums" | "bass" | "other";

const STEM_CONFIG: Record<StemType, { label: string; color: string }> = {
  vocals: { label: "VOCALS", color: "var(--color-studio-cyan, #00F2FF)" },
  drums: { label: "DRUMS", color: "var(--color-studio-crimson, #ef4444)" },
  bass: { label: "BASS", color: "var(--color-studio-purple, #9333ea)" },
  other: { label: "OTHER", color: "var(--color-studio-gold, #f59e0b)" },
};

/**
 * StemRack - Phase IV AI Stems Creative Tool
 *
 * Tactile vertical stack of 4 stem mute buttons with LED indicators.
 * Zero-latency muting through direct audio node control.
 */
export const StemRack = React.memo<StemRackProps>(({ deck, className = "" }) => {
  const mutedStems = useStudioStore((state) => state.mutedStems[deck]);
  const soloStem = useStudioStore((state) => state.soloStem[deck]);
  const setMutedStem = useStudioStore((state) => state.setMutedStem);
  const setSoloStem = useStudioStore((state) => state.setSoloStem);

  const handleStemClick = (stem: StemType) => {
    // Double-click to solo (future enhancement)
    // Single-click to mute/unmute
    const isMuted = mutedStems[stem];
    setMutedStem(deck, stem, !isMuted);
  };

  const handleStemDoubleClick = (stem: StemType) => {
    // Toggle solo mode
    if (soloStem === stem) {
      setSoloStem(deck, null);
    } else {
      setSoloStem(deck, stem);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {(Object.keys(STEM_CONFIG) as StemType[]).map((stem) => {
        const config = STEM_CONFIG[stem];
        const isMuted = soloStem ? stem !== soloStem : mutedStems[stem];
        const isSolo = soloStem === stem;
        const isActive = !isMuted;

        return (
          <motion.button
            key={stem}
            onClick={() => handleStemClick(stem)}
            onDoubleClick={() => handleStemDoubleClick(stem)}
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.02 }}
            className={`
              relative flex items-center justify-between
              px-4 py-3 min-h-13
              backdrop-blur-md
              border transition-all duration-150
              ${
                isActive
                  ? "bg-linear-to-r from-[rgba(255,255,255,0.08)] to-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.2)]"
                  : "bg-[rgba(6,7,10,0.6)] border-[rgba(255,255,255,0.06)]"
              }
              ${isSolo ? "ring-2 ring-offset-1 ring-offset-black" : ""}
              hover:border-[rgba(255,255,255,0.15)]
              active:translate-y-px
              select-none cursor-pointer
            `}
            style={{
              borderColor: isActive ? config.color : undefined,
              boxShadow: isActive ? `0 0 16px -4px ${config.color}` : undefined,
              ...(isSolo && { ringColor: config.color }),
            }}
          >
            {/* LED Indicator */}
            <div className="flex items-center gap-3">
              <motion.div
                className="relative w-2 h-2 rounded-full"
                animate={{
                  backgroundColor: isActive ? config.color : "rgba(255,255,255,0.2)",
                  boxShadow: isActive ? `0 0 12px ${config.color}` : "none",
                }}
                transition={{ duration: 0.15 }}
              >
                {/* Glow ring */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: config.color }}
                    animate={{
                      scale: [1, 1.8, 1],
                      opacity: [0.6, 0, 0.6],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </motion.div>

              {/* Label */}
              <span
                className={`
                  text-sm font-bold tracking-wider
                  transition-colors duration-150
                  ${isActive ? "text-white" : "text-[rgba(255,255,255,0.3)]"}
                `}
                style={{
                  color: isActive ? config.color : undefined,
                  textShadow: isActive ? `0 0 8px ${config.color}` : undefined,
                }}
              >
                {config.label}
              </span>
            </div>

            {/* Solo indicator */}
            {isSolo && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-2 top-2 px-1.5 py-0.5 text-[10px] font-bold rounded"
                style={{
                  backgroundColor: config.color,
                  color: "black",
                }}
              >
                SOLO
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
});

StemRack.displayName = "StemRack";
