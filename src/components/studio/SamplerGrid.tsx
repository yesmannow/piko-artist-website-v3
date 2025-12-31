"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAudioStore } from "@/stores/useAudioStore";
import { useHaptic } from "@/hooks/useHaptic";

interface SamplerPad {
  id: string;
  label: string;
  src: string;
  color: string;
}

/**
 * SamplerGrid - Syndicate Sampler Bank (2x4 Grid)
 *
 * V3 Urban Syndicate: Industrial one-shot sampler with 8 pads
 * Maps to dedicated SamplerGainNode for < 10ms latency triggering.
 *
 * Assets:
 * - piko-tag.mp3 (Voice Tag)
 * - industrial-clap.wav (Clap)
 * - air-horn-v3.wav (Air Horn)
 * - deep-808-impact.wav (808)
 * - Additional 4 pads for expansion
 */
export function SamplerGrid() {
  const { audioContext } = useAudioStore();
  const triggerHaptic = useHaptic();
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const samplerGainRef = useRef<GainNode | null>(null);
  const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const sourceNodesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());

  // Initialize sampler gain node
  useEffect(() => {
    if (!audioContext) return;

    const samplerGain = audioContext.createGain();
    samplerGain.gain.value = 1.0;
    samplerGain.connect(audioContext.destination);
    samplerGainRef.current = samplerGain;

    return () => {
      samplerGain.disconnect();
    };
  }, [audioContext]);

  // Sampler pads configuration
  const pads: SamplerPad[] = [
    { id: "tag", label: "TAG", src: "/audio/samples/piko-tag.mp3", color: "#FFD700" },
    { id: "clap", label: "CLAP", src: "/audio/samples/industrial-clap.wav", color: "#E0E0E0" },
    { id: "horn", label: "HORN", src: "/audio/samples/air-horn-v3.wav", color: "#FFD700" },
    { id: "808", label: "808", src: "/audio/samples/deep-808-impact.wav", color: "#E0E0E0" },
    { id: "kick", label: "KICK", src: "/audio/samples/kick-drum-426037.mp3", color: "#E0E0E0" },
    { id: "snare", label: "SNARE", src: "/audio/samples/tr909-snare-drum-241413.mp3", color: "#E0E0E0" },
    { id: "shaker", label: "SHAKER", src: "/audio/samples/shaker-drum-434902.mp3", color: "#E0E0E0" },
    { id: "tom", label: "TOM", src: "/audio/samples/tom-2-85124.mp3", color: "#E0E0E0" },
  ];

  /**
   * Load audio buffer for a pad
   */
  const loadBuffer = useCallback(
    async (pad: SamplerPad): Promise<AudioBuffer | null> => {
      if (!audioContext) return null;

      // Check cache first
      if (bufferCacheRef.current.has(pad.id)) {
        return bufferCacheRef.current.get(pad.id)!;
      }

      try {
        const response = await fetch(pad.src);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Cache the buffer
        bufferCacheRef.current.set(pad.id, audioBuffer);
        return audioBuffer;
      } catch (error) {
        console.error(`[SamplerGrid] Failed to load ${pad.label}:`, error);
        return null;
      }
    },
    [audioContext]
  );

  /**
   * Trigger sampler pad with < 10ms latency
   */
  const triggerPad = useCallback(
    async (pad: SamplerPad) => {
      if (!audioContext || !samplerGainRef.current) return;

      // Stop any existing playback of this pad
      const existingSource = sourceNodesRef.current.get(pad.id);
      if (existingSource) {
        try {
          existingSource.stop();
        } catch {
          // Already stopped
        }
        sourceNodesRef.current.delete(pad.id);
      }

      // Load buffer if not cached
      const buffer = await loadBuffer(pad);
      if (!buffer) return;

      // Create new source node
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(samplerGainRef.current);

      // Trigger with immediate start (0ms latency)
      source.start(0);

      // Track source node
      sourceNodesRef.current.set(pad.id, source);

      // Update playing state
      setIsPlaying((prev) => ({ ...prev, [pad.id]: true }));

      // Trigger haptic feedback
      triggerHaptic(10);

      // Clean up when finished
      source.onended = () => {
        sourceNodesRef.current.delete(pad.id);
        setIsPlaying((prev) => ({ ...prev, [pad.id]: false }));
      };
    },
    [audioContext, loadBuffer, triggerHaptic]
  );

  return (
    <div className="bg-[#111] border-4 border-[#E0E0E0] p-4">
      <h3
        className="text-sm font-black italic uppercase text-[#FFD700] mb-4"
        style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
      >
        SAMPLER_BANK
      </h3>

      {/* 2x4 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {pads.map((pad) => (
          <motion.button
            key={pad.id}
            onClick={() => triggerPad(pad)}
            className={`
              relative aspect-square bg-[#050505] border-2 border-[#E0E0E0]/30
              flex items-center justify-center
              transition-all
              ${isPlaying[pad.id] ? "border-[#FFD700] bg-[#FFD700]/10" : "hover:border-[#E0E0E0]/60"}
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              boxShadow: isPlaying[pad.id]
                ? "0 0 12px rgba(255, 215, 0, 0.5), inset 0 0 8px rgba(255, 215, 0, 0.1)"
                : "inset 0 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            {/* Label */}
            <span
              className="text-xs font-mono font-bold uppercase"
              style={{ color: isPlaying[pad.id] ? pad.color : "#E0E0E0" }}
            >
              {pad.label}
            </span>

            {/* Active Pulse Indicator */}
            {isPlaying[pad.id] && (
              <motion.div
                className="absolute inset-0 border-2"
                style={{ borderColor: pad.color }}
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.3, repeat: Infinity }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

