"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Tooltip } from "./Tooltip";
import { useMIDIStore, type MIDIAction } from "@/store/useMIDIStore";
import { Radio } from "lucide-react";

interface FaderProps {
  value: number; // 0 to 1
  onChange: (value: number) => void;
  label?: string;
  height?: number;
  helpText?: string;
  midiAction?: MIDIAction; // MIDI action for this fader
}

/**
 * Fader with Elastic Boundaries and MIDI Learn Support
 *
 * When user drags to 0% or 100%, visual elements "stretch" 5px past the limit
 * and snap back to simulate rubber gaskets.
 */
export function Fader({
  value,
  onChange,
  label,
  height = 200,
  helpText,
  midiAction,
}: FaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const faderRef = useRef<HTMLDivElement>(null);
  const { learnMode, startLearn, mappings } = useMIDIStore();

  // Motion values for elastic boundaries
  const rawPosition = useMotionValue((1 - value) * height);
  const springPosition = useSpring(rawPosition, {
    stiffness: 300,
    damping: 30,
    restDelta: 0.01,
  });

  // Calculate elastic stretch when at boundaries
  const displayPosition = useTransform(springPosition, (pos) => {
    const clamped = Math.max(0, Math.min(height, pos));
    const stretch = pos - clamped;
    // Limit stretch to 5px
    const limitedStretch = Math.max(-5, Math.min(5, stretch));
    return clamped + limitedStretch;
  });

  // Update raw position when value prop changes (but not while dragging)
  useEffect(() => {
    if (!isDragging) {
      rawPosition.set((1 - value) * height);
    }
  }, [value, height, isDragging, rawPosition]);

  // Check if this fader has a MIDI mapping
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

    const updateValue = (clientY: number) => {
      if (!faderRef.current) return;
      const rect = faderRef.current.getBoundingClientRect();
      const y = clientY - rect.top;

      // Allow stretching past boundaries during drag
      rawPosition.set(y - 12); // Offset by half cap height

      // Calculate actual value (clamped) for onChange
      const newValue = 1 - Math.max(0, Math.min(1, y / rect.height));
      onChange(newValue);
    };

    const handleMouseMove = (e: MouseEvent) => {
      updateValue(e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateValue(e.touches[0].clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Snap back to clamped position
      const currentPos = rawPosition.get();
      const clampedPos = Math.max(0, Math.min(height, currentPos));
      rawPosition.set(clampedPos);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      // Snap back to clamped position
      const currentPos = rawPosition.get();
      const clampedPos = Math.max(0, Math.min(height, currentPos));
      rawPosition.set(clampedPos);
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
  }, [isDragging, onChange, height, rawPosition]);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const faderContent = (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        {label && (
          <span className="text-xs font-barlow uppercase text-gray-400 tracking-wider">
            {label}
          </span>
        )}
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
          height,
          width: isMobile ? 50 : 40,
          touchAction: "none",
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
          {/* Groove lines */}
          <div
            className={`absolute inset-x-0 top-0 h-px ${hasMIDIMapping ? "bg-cyan-400/50" : "bg-gray-700"}`}
          />
          <div
            className={`absolute inset-x-0 top-1/2 h-px ${hasMIDIMapping ? "bg-cyan-400/50" : "bg-gray-700"}`}
          />
          <div
            className={`absolute inset-x-0 bottom-0 h-px ${hasMIDIMapping ? "bg-cyan-400/50" : "bg-gray-700"}`}
          />
        </div>

        {/* Fader cap with elastic boundaries */}
        <motion.div
          className={`absolute left-1/2 -translate-x-1/2 rounded-sm shadow-lg cursor-grab active:cursor-grabbing touch-manipulation border transition-all ${
            hasMIDIMapping
              ? "bg-cyan-600 border-cyan-400 shadow-cyan-500/50"
              : "bg-[#2a2a2a] border-gray-600"
          }`}
          style={{
            top: displayPosition,
            width: isMobile ? 44 : 32,
            height: isMobile ? 20 : 24,
            minWidth: isMobile ? 44 : 32,
            minHeight: isMobile ? 20 : 24,
            boxShadow: hasMIDIMapping
              ? "0 0 15px rgba(6, 182, 212, 0.4), 0 0 30px rgba(6, 182, 212, 0.2)"
              : "0 0 5px rgba(0,0,0,0.5)",
          }}
          whileHover={!isMobile ? { scale: 1.05 } : {}}
          whileTap={{ scale: 0.95 }}
        >
          {/* Cap detail lines */}
          <div
            className={`absolute inset-x-1 top-1 h-px ${hasMIDIMapping ? "bg-cyan-300" : "bg-gray-500"}`}
          />
          <div
            className={`absolute inset-x-1 bottom-1 h-px ${hasMIDIMapping ? "bg-cyan-300" : "bg-gray-500"}`}
          />
        </motion.div>
      </div>
    </div>
  );

  if (helpText) {
    return <Tooltip content={helpText}>{faderContent}</Tooltip>;
  }

  return faderContent;
}
