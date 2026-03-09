"use client";

/**
 * Phase 2: Fusion Preview Component
 *
 * A micro-waveform overlay showing predicted transient alignment
 * between the active deck and a candidate track. Appears on hover
 * of high-match tracks (>90%).
 *
 * CSS-only visualization with motion animations.
 */

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface FusionPreviewProps {
  matchPercent: number;
  bpm: number;
  activeBpm: number;
  trackKey?: string;
  activeKey?: string;
}

export function FusionPreview({
  matchPercent,
  bpm,
  activeBpm,
  trackKey,
  activeKey,
}: FusionPreviewProps) {
  const bpmDiff = Math.abs(bpm - activeBpm);
  const bpmAlignmentPct = Math.max(0, Math.min(100, 100 - (bpmDiff / activeBpm) * 100));

  // Generate micro-waveform bars to simulate transient alignment
  const barCount = 16;
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Simulate alignment quality — higher match = more aligned bars
    const phase = (i / barCount) * Math.PI * 4;
    const deckAHeight = Math.abs(Math.sin(phase)) * 0.8 + 0.2;
    const offset = (1 - matchPercent / 100) * 0.5;
    const deckBHeight = Math.abs(Math.sin(phase + offset)) * 0.8 + 0.2;
    return { deckAHeight, deckBHeight };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-10 rounded-lg overflow-hidden pointer-events-none"
      style={{
        background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(147,51,234,0.12) 100%)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Fusion Header */}
      <div className="flex items-center justify-between px-3 pt-2">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
            Fusion Preview
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-lime-400">
          {matchPercent}% Match
        </span>
      </div>

      {/* Micro-Waveform Visualization */}
      <div className="px-3 py-2">
        <div className="flex items-end justify-center gap-[2px] h-8">
          {bars.map((bar, i) => (
            <div key={i} className="flex flex-col items-center gap-[1px]" style={{ width: '3px' }}>
              {/* Deck A waveform (top, cyan) */}
              <motion.div
                className="w-full rounded-sm bg-cyan-400/60"
                initial={{ height: 0 }}
                animate={{ height: bar.deckAHeight * 14 }}
                transition={{ delay: i * 0.02, duration: 0.3 }}
              />
              {/* Deck B waveform (bottom, purple) */}
              <motion.div
                className="w-full rounded-sm bg-purple-400/60"
                initial={{ height: 0 }}
                animate={{ height: bar.deckBHeight * 14 }}
                transition={{ delay: i * 0.02 + 0.05, duration: 0.3 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Alignment Stats */}
      <div className="flex items-center justify-between px-3 pb-2">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-white/50">
            BPM Align: <span className="text-white/80">{bpmAlignmentPct.toFixed(0)}%</span>
          </span>
          {trackKey && activeKey && (
            <span className="text-[9px] font-mono text-white/50">
              Key: <span className="text-lime-400/80">{trackKey}</span>
              {' → '}
              <span className="text-cyan-400/80">{activeKey}</span>
            </span>
          )}
        </div>
        {/* Pulsing alignment dot */}
        <motion.div
          className="w-2 h-2 rounded-full bg-lime-400"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
          }}
        />
      </div>
    </motion.div>
  );
}
