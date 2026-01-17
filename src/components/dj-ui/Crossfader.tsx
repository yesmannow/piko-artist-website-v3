"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Tooltip } from "./Tooltip";
import { useMIDIStore, type MIDIAction } from "@/store/useMIDIStore";
import { Radio } from "lucide-react";

interface CrossfaderProps {
  value: number; // 0 to 1 (0 = left, 1 = right)
  onChange: (value: number) => void;
  width?: number;
  helpText?: string;
  midiAction?: MIDIAction; // MIDI action for this crossfader
}

export function Crossfader({
  value,
  onChange,
  width = 300,
  helpText,
  midiAction,
}: CrossfaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const faderRef = useRef<HTMLDivElement>(null);
  const { learnMode, startLearn, mappings } = useMIDIStore();

  // Make width responsive
  const responsiveWidth =
    typeof window !== "undefined" && window.innerWidth < 768
      ? Math.min(width, window.innerWidth - 80)
      : width;

  // Check if this crossfader has a MIDI mapping
  const hasMIDIMapping = midiAction
    ? Object.values(mappings).some((m) => m.action === midiAction)
    : false;

  const handleMouseDown = (e: React.MouseEvent) => {
    // If in learn mode and we have a midiAction, start learning
    if (learnMode && midiAction) {
      startLearn(midiAction);
      return;
    }

    setIsDragging(true);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // If in learn mode and we have a midiAction, start learning
    if (learnMode && midiAction) {
      startLearn(midiAction);
      return;
    }

    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const updateValue = (clientX: number) => {
      if (!faderRef.current) return;
      const rect = faderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const newValue = Math.max(0, Math.min(1, x / rect.width));
      onChange(newValue);
    };

    const handleMouseMove = (e: MouseEvent) => {
      updateValue(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateValue(e.touches[0].clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, onChange]);

  const position = value * responsiveWidth;

  const crossfaderContent = (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-barlow uppercase text-gray-400 tracking-wider">
          CROSSFADER
        </span>
        {/* MIDI mapping indicator */}
        {midiAction && (
          <div
            className={`relative flex items-center gap-1 px-2 py-1 rounded text-xs font-mono ${
              hasMIDIMapping
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : learnMode
                  ? "bg-cyan-500 text-black animate-pulse"
                  : "bg-gray-700/50 text-gray-400 border border-gray-600/50"
            }`}
            title={
              hasMIDIMapping
                ? "MIDI mapped"
                : learnMode
                  ? "Click to learn MIDI mapping"
                  : "No MIDI mapping"
            }
          >
            <Radio className="w-3 h-3" />
            <span>
              {hasMIDIMapping ? "MIDI" : learnMode ? "LEARN" : "NO MIDI"}
            </span>
          </div>
        )}
      </div>
      <div
        ref={faderRef}
        className="relative cursor-pointer select-none touch-manipulation"
        style={{
          width: responsiveWidth,
          height:
            typeof window !== "undefined" && window.innerWidth < 768 ? 40 : 30,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Track groove */}
        <div
          className={`absolute inset-0 rounded-sm border transition-all ${
            hasMIDIMapping
              ? "bg-[#0a0a0a] border-cyan-500/50 shadow-lg shadow-cyan-500/20"
              : "bg-[#0a0a0a] border-gray-800"
          }`}
        >
          {/* Center marker */}
          <div
            className={`absolute left-1/2 top-0 bottom-0 w-px ${hasMIDIMapping ? "bg-cyan-400" : "bg-gray-600"}`}
          />
        </div>

        {/* Fader cap */}
        <motion.div
          className={`absolute top-1/2 -translate-y-1/2 rounded-sm shadow-lg cursor-grab active:cursor-grabbing touch-manipulation border transition-all ${
            hasMIDIMapping
              ? "bg-cyan-600 border-cyan-400 shadow-cyan-500/50"
              : "bg-[#2a2a2a] border-gray-600"
          }`}
          style={{
            left:
              position -
              (typeof window !== "undefined" && window.innerWidth < 768
                ? 22
                : 20),
            width:
              typeof window !== "undefined" && window.innerWidth < 768
                ? 44
                : 40,
            height:
              typeof window !== "undefined" && window.innerWidth < 768
                ? 24
                : 24,
            boxShadow: hasMIDIMapping
              ? "0 0 15px rgba(6, 182, 212, 0.4), 0 0 30px rgba(6, 182, 212, 0.2)"
              : "0 0 5px rgba(0,0,0,0.5)",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Cap detail lines */}
          <div
            className={`absolute inset-y-1 left-1 w-px ${hasMIDIMapping ? "bg-cyan-300" : "bg-gray-500"}`}
          />
          <div
            className={`absolute inset-y-1 right-1 w-px ${hasMIDIMapping ? "bg-cyan-300" : "bg-gray-500"}`}
          />
        </motion.div>
      </div>
    </div>
  );

  if (helpText) {
    return <Tooltip content={helpText}>{crossfaderContent}</Tooltip>;
  }

  return crossfaderContent;
}
