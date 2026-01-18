"use client";

import { motion } from "framer-motion";
import { Volume2, VolumeX, Radio } from "lucide-react";

export type StemType = "vocals" | "drums" | "bass" | "other";

interface StemControlProps {
  type: StemType;
  label: string;
  isMuted: boolean;
  isSolo: boolean;
  onMute: () => void;
  onSolo: () => void;
  color?: string;
}

/**
 * StemControl - Individual stem toggle control
 *
 * Allows users to Mute/Solo individual stems in real-time.
 * Uses Framer Motion for smooth animations matching the
 * "Hacker Terminal" aesthetic.
 */
export function StemControl({
  type,
  label,
  isMuted,
  isSolo,
  onMute,
  onSolo,
  color = "#FFD700", // Safety Yellow
}: StemControlProps) {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        className="px-4 py-3 bg-black/80 backdrop-blur-sm border-2 font-mono text-xs cursor-pointer min-h-[44px] flex items-center justify-between gap-3"
        style={{
          borderColor: isSolo ? color : isMuted ? "#666" : "#333",
          boxShadow: isSolo
            ? `0 0 10px ${color}40`
            : "0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        {/* Label */}
        <span
          className="uppercase tracking-wider font-bold"
          style={{ color: isMuted ? "#666" : isSolo ? color : "#fff" }}
        >
          {label}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Solo Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSolo();
            }}
            className={`p-1.5 rounded transition-colors ${
              isSolo
                ? "bg-white text-black"
                : "bg-transparent text-foreground/60 hover:text-foreground"
            }`}
            aria-label={`Solo ${label}`}
          >
            <Radio className="w-3.5 h-3.5" />
          </button>

          {/* Mute Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMute();
            }}
            className={`p-1.5 rounded transition-colors ${
              isMuted
                ? "bg-red-600 text-white"
                : "bg-transparent text-foreground/60 hover:text-foreground"
            }`}
            aria-label={`Mute ${label}`}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * StemControls - Container for all stem controls
 */
interface StemControlsProps {
  stems: {
    vocals: { isMuted: boolean; isSolo: boolean };
    drums: { isMuted: boolean; isSolo: boolean };
    bass: { isMuted: boolean; isSolo: boolean };
    other: { isMuted: boolean; isSolo: boolean };
  };
  onMute: (type: StemType) => void;
  onSolo: (type: StemType) => void;
}

export function StemControls({ stems, onMute, onSolo }: StemControlsProps) {
  return (
    <motion.div
      className="flex flex-col gap-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <StemControl
        type="vocals"
        label="VOCALS"
        isMuted={stems.vocals.isMuted}
        isSolo={stems.vocals.isSolo}
        onMute={() => onMute("vocals")}
        onSolo={() => onSolo("vocals")}
        color="#00ffff"
      />
      <StemControl
        type="drums"
        label="DRUMS"
        isMuted={stems.drums.isMuted}
        isSolo={stems.drums.isSolo}
        onMute={() => onMute("drums")}
        onSolo={() => onSolo("drums")}
        color="#ff0099"
      />
      <StemControl
        type="bass"
        label="BASS"
        isMuted={stems.bass.isMuted}
        isSolo={stems.bass.isSolo}
        onMute={() => onMute("bass")}
        onSolo={() => onSolo("bass")}
        color="#ff6600"
      />
      <StemControl
        type="other"
        label="OTHER"
        isMuted={stems.other.isMuted}
        isSolo={stems.other.isSolo}
        onMute={() => onMute("other")}
        onSolo={() => onSolo("other")}
        color="#FFD700"
      />
    </motion.div>
  );
}
