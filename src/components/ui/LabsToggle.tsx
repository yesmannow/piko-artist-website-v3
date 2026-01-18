"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";

type LabsToggleProps = {
  className?: string;
};

/**
 * Animated Labs toggle with glass + glow styling.
 */
export function LabsToggle({ className = "" }: LabsToggleProps) {
  const { labsEnabled, toggleLabsEnabled } = useUIStore();

  return (
    <button
      type="button"
      onClick={toggleLabsEnabled}
      className={`relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur transition hover:border-[#c1ff00]/40 ${className}`}
    >
      <motion.div
        className="relative h-5 w-10 rounded-full bg-white/10"
        animate={{
          backgroundColor: labsEnabled ? "rgba(193,255,0,0.2)" : "rgba(255,255,255,0.08)",
          boxShadow: labsEnabled
            ? "0 0 16px rgba(193,255,0,0.45), 0 0 32px rgba(124,58,237,0.35)"
            : "0 0 8px rgba(255,255,255,0.15)",
        }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <motion.span
          className="absolute top-[2px] left-[2px] h-4 w-4 rounded-full bg-gradient-to-r from-[#c1ff00] to-[#7c3aed] shadow-[0_0_12px_rgba(193,255,0,0.45)]"
          animate={{
            x: labsEnabled ? 20 : 0,
            scale: labsEnabled ? 1.05 : 1,
          }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        />
      </motion.div>
      <span className="flex items-center gap-1">
        <Sparkles className="h-3 w-3 text-[#7c3aed]" />
        Labs
      </span>
    </button>
  );
}
