"use client";

import { motion } from "framer-motion";
import { Volume2, VolumeX, Radio } from "lucide-react";
import type { StemType } from "@/hooks/useStemRouting";

interface StemDeckProps {
  type: StemType;
  label: string;
  isMuted: boolean;
  isSolo: boolean;
  volume: number;
  isSidechainEnabled?: boolean; // Only for Bass stem
  onMute: () => void;
  onSolo: () => void;
  onVolumeChange: (volume: number) => void;
  onSidechainToggle?: () => void; // Only for Bass stem
  color?: string;
}

/**
 * StemDeck - Individual stem control strip with volume fader
 *
 * Provides tactile interface for interacting with AI-separated tracks.
 * Features "Hacker Terminal" aesthetic with neon borders and monospaced labels.
 *
 * Visual feedback: When muted, scanlines on 3D deck should dim (handled by parent).
 */
export function StemDeck({
  type,
  label,
  isMuted,
  isSolo,
  volume,
  isSidechainEnabled = false,
  onMute,
  onSolo,
  onVolumeChange,
  onSidechainToggle,
  color = "#ccff00",
}: StemDeckProps) {
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
  };

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <div
        className="bg-black/90 backdrop-blur-sm border-2 p-4 font-mono text-xs min-h-[120px] flex flex-col gap-3"
        style={{
          borderColor: isSolo ? color : isMuted ? "#666" : "#333",
          boxShadow: isSolo
            ? `0 0 15px ${color}40, inset 0 0 10px ${color}10`
            : "0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header: Label and Controls */}
        <div className="flex items-center justify-between">
          <span
            className="uppercase tracking-wider font-bold text-sm"
            style={{ color: isMuted ? "#666" : isSolo ? color : "#fff" }}
          >
            {label}
          </span>

          <div className="flex items-center gap-2">
            {/* Solo Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSolo();
              }}
              className={`p-2 rounded transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
                isSolo
                  ? "bg-white text-black"
                  : "bg-transparent text-foreground/60 hover:text-foreground border border-foreground/20"
              }`}
              aria-label={`Solo ${label}`}
            >
              <Radio className="w-4 h-4" />
            </button>

            {/* Mute Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMute();
              }}
              className={`p-2 rounded transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
                isMuted
                  ? "bg-red-600 text-white"
                  : "bg-transparent text-foreground/60 hover:text-foreground border border-foreground/20"
              }`}
              aria-label={`Mute ${label}`}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Volume Fader */}
        <div className="flex-1 flex flex-col justify-center">
          <label className="text-foreground/60 text-xs mb-2 uppercase tracking-wider">
            Volume
          </label>
          <div className="relative">
            {/* Custom styled range input with neon glow */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-foreground/10 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${color} 0%, ${color} ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
            {/* Custom thumb with glow effect */}
            <style jsx>{`
              input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: ${color};
                cursor: pointer;
                box-shadow: 0 0 10px ${color}80, 0 0 20px ${color}40;
                border: 2px solid #000;
              }
              input[type="range"]::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: ${color};
                cursor: pointer;
                box-shadow: 0 0 10px ${color}80, 0 0 20px ${color}40;
                border: 2px solid #000;
              }
            `}</style>
          </div>
          <div className="text-foreground/40 text-xs mt-1 text-right">
            {Math.round(volume * 100)}%
          </div>
        </div>

        {/* Sidechain Toggle (Bass only) */}
        {type === "bass" && onSidechainToggle && (
          <div className="pt-2 border-t border-foreground/10">
            <button
              onClick={onSidechainToggle}
              className={`w-full px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                isSidechainEnabled
                  ? "bg-toxic-lime text-black"
                  : "bg-transparent text-foreground/60 hover:text-foreground border border-foreground/20"
              }`}
            >
              SC {isSidechainEnabled ? "ON" : "OFF"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * StemDeckContainer - Container for all stem decks
 */
interface StemDeckContainerProps {
  stems: {
    vocals: { isMuted: boolean; isSolo: boolean; volume: number };
    drums: { isMuted: boolean; isSolo: boolean; volume: number };
    bass: { isMuted: boolean; isSolo: boolean; volume: number; isSidechainEnabled?: boolean };
    other: { isMuted: boolean; isSolo: boolean; volume: number };
  };
  onMute: (type: StemType) => void;
  onSolo: (type: StemType) => void;
  onVolumeChange: (type: StemType, volume: number) => void;
  onSidechainToggle?: () => void;
}

export function StemDeckContainer({
  stems,
  onMute,
  onSolo,
  onVolumeChange,
  onSidechainToggle,
}: StemDeckContainerProps) {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <StemDeck
        type="vocals"
        label="VOCALS"
        isMuted={stems.vocals.isMuted}
        isSolo={stems.vocals.isSolo}
        volume={stems.vocals.volume}
        onMute={() => onMute("vocals")}
        onSolo={() => onSolo("vocals")}
        onVolumeChange={(vol) => onVolumeChange("vocals", vol)}
        color="#00ffff"
      />
      <StemDeck
        type="drums"
        label="DRUMS"
        isMuted={stems.drums.isMuted}
        isSolo={stems.drums.isSolo}
        volume={stems.drums.volume}
        onMute={() => onMute("drums")}
        onSolo={() => onSolo("drums")}
        onVolumeChange={(vol) => onVolumeChange("drums", vol)}
        color="#ff0099"
      />
      <StemDeck
        type="bass"
        label="BASS"
        isMuted={stems.bass.isMuted}
        isSolo={stems.bass.isSolo}
        volume={stems.bass.volume}
        isSidechainEnabled={stems.bass.isSidechainEnabled}
        onMute={() => onMute("bass")}
        onSolo={() => onSolo("bass")}
        onVolumeChange={(vol) => onVolumeChange("bass", vol)}
        onSidechainToggle={onSidechainToggle}
        color="#ff6600"
      />
      <StemDeck
        type="other"
        label="OTHER"
        isMuted={stems.other.isMuted}
        isSolo={stems.other.isSolo}
        volume={stems.other.volume}
        onMute={() => onMute("other")}
        onSolo={() => onSolo("other")}
        onVolumeChange={(vol) => onVolumeChange("other", vol)}
        color="#ccff00"
      />
    </motion.div>
  );
}

