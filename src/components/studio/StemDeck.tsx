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
 * StemDeck - High-fidelity analog console fader for stem control
 *
 * Provides professional tactile interface for interacting with AI-separated tracks.
 * Features luxury analog console aesthetic with brushed gold accents and clean labels.
 *
 * Visual feedback: When muted, holographic deck should dim (handled by parent).
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
        className="relative bg-[#111111] border-2 border-[#E0E0E0]/20 p-4 font-mono text-xs min-h-[140px] flex flex-col gap-3"
        style={{
          // Matte Powder-Coated Black with brushed metal texture
          background: `
            linear-gradient(135deg, #111111 0%, #0a0a0a 100%),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(224, 224, 224, 0.02) 2px,
              rgba(224, 224, 224, 0.02) 4px
            )
          `,
          boxShadow: isSolo
            ? "0 0 20px rgba(255, 215, 0, 0.4), inset 0 0 15px rgba(255, 215, 0, 0.1), 4px 4px 0px rgba(0,0,0,1)"
            : "inset 0 0 20px rgba(0,0,0,0.5), 4px 4px 0px rgba(0,0,0,1)",
        }}
      >
        {/* Industrial Screw Heads - Top Corners */}
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#E0E0E0] border border-black" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#E0E0E0] border border-black" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
        {/* Industrial Screw Heads - Bottom Corners */}
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#E0E0E0] border border-black" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#E0E0E0] border border-black" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
        {/* Header: White Stenciled Spray Paint Label */}
        <div className="flex items-center justify-between">
          <span
            className="uppercase tracking-[0.15em] font-black text-sm"
            style={{
              color: isMuted ? "#666" : isSolo ? "#FFD700" : "#FFFFFF",
              fontFamily: "var(--font-lexend), system-ui, sans-serif",
              fontStyle: "italic",
              textShadow: "2px 2px 0px rgba(0,0,0,0.8), -1px -1px 0px rgba(0,0,0,0.5)",
              letterSpacing: "0.1em",
            }}
          >
            {label}
          </span>

          <div className="flex items-center gap-2">
            {/* Solo Button - Industrial Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSolo();
              }}
              className={`p-2 border-2 border-[#E0E0E0]/30 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center ${
                isSolo
                  ? "bg-[#FFD700] text-black border-[#FFD700]"
                  : "bg-[#1a1a1a] text-[#E0E0E0]/60 hover:text-[#FFD700] hover:border-[#FFD700]/50"
              }`}
              style={{
                boxShadow: isSolo ? "0 0 10px rgba(255, 215, 0, 0.5), inset 0 0 5px rgba(0,0,0,0.3)" : "inset 0 0 5px rgba(0,0,0,0.5)",
              }}
              aria-label={`Solo ${label}`}
            >
              <Radio className="w-4 h-4" />
            </button>

            {/* Mute Button - Industrial Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMute();
              }}
              className={`p-2 border-2 border-[#E0E0E0]/30 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center ${
                isMuted
                  ? "bg-red-700 text-white border-red-700"
                  : "bg-[#1a1a1a] text-[#E0E0E0]/60 hover:text-[#FFD700] hover:border-[#FFD700]/50"
              }`}
              style={{
                boxShadow: isMuted ? "0 0 10px rgba(220, 38, 38, 0.5), inset 0 0 5px rgba(0,0,0,0.3)" : "inset 0 0 5px rgba(0,0,0,0.5)",
              }}
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

        {/* Volume Fader - Industrial Knurled Metal Cap */}
        <div className="flex-1 flex flex-col justify-center">
          <label className="text-[#E0E0E0]/60 text-[10px] mb-2 uppercase tracking-[0.2em] font-mono font-bold">
            VOLUME
          </label>
          <div className="relative">
            {/* Bright Chrome Slot for Fader Track */}
            <div
              className="absolute inset-0 h-2 bg-[#E0E0E0] opacity-20"
              style={{
                clipPath: "polygon(0% 0%, 100% 0%, 95% 100%, 5% 100%)",
                boxShadow: "inset 0 0 10px rgba(224, 224, 224, 0.3)",
              }}
            />
            {/* Fader Track Background */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-2 appearance-none cursor-pointer relative z-10"
              style={{
                background: `linear-gradient(to right, #FFD700 0%, #FFD700 ${volume * 100}%, rgba(255, 215, 0, 0.2) ${volume * 100}%, rgba(255, 215, 0, 0.2) 100%)`,
              }}
            />
            {/* Knurled Metal Fader Cap (Chrome sides, Rubber top) */}
            <style jsx>{`
              input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 20px;
                height: 24px;
                background: linear-gradient(to bottom, #E0E0E0 0%, #E0E0E0 60%, #1a1a1a 60%, #1a1a1a 100%);
                cursor: pointer;
                box-shadow:
                  0 0 0 1px rgba(0,0,0,0.8),
                  0 2px 4px rgba(0,0,0,0.6),
                  inset 0 0 8px rgba(224, 224, 224, 0.3),
                  inset 0 12px 0 rgba(0,0,0,0.4);
                border: none;
                /* Knurled texture effect */
                background-image: repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 2px,
                  rgba(0,0,0,0.3) 2px,
                  rgba(0,0,0,0.3) 3px
                );
              }
              input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 24px;
                background: linear-gradient(to bottom, #E0E0E0 0%, #E0E0E0 60%, #1a1a1a 60%, #1a1a1a 100%);
                cursor: pointer;
                box-shadow:
                  0 0 0 1px rgba(0,0,0,0.8),
                  0 2px 4px rgba(0,0,0,0.6),
                  inset 0 0 8px rgba(224, 224, 224, 0.3),
                  inset 0 12px 0 rgba(0,0,0,0.4);
                border: none;
              }
            `}</style>
          </div>
          <div className="text-[#E0E0E0]/60 text-[10px] mt-1 text-right font-mono font-bold">
            {Math.round(volume * 100)}%
          </div>
        </div>

        {/* Safety Yellow LED Strip Indicator (Active Stems) */}
        {!isMuted && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD700]"
            style={{
              boxShadow: "0 0 10px rgba(255, 215, 0, 0.8), inset 0 0 5px rgba(255, 215, 0, 0.5)",
              opacity: isSolo ? 1.0 : 0.6,
            }}
          />
        )}

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

