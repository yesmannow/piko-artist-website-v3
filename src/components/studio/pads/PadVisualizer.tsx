'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PadVisualizer - Visual Feedback for Pad Triggers
 *
 * Displays visual feedback when pads are triggered.
 * Shows ripple effects and active pad indicators.
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - Performance Pads System
 */
interface PadVisualizerProps {
  deckId: 'A' | 'B';
  activePad?: number | null; // 0-7 for which pad is active
  mode?: 'hotCue' | 'loop' | 'slicer' | 'beatJump';
}

const MODE_COLORS = {
  hotCue: '#ef4444',
  loop: '#22c55e',
  slicer: '#a855f7',
  beatJump: '#3b82f6',
};

export function PadVisualizer({ deckId, activePad, mode = 'hotCue' }: PadVisualizerProps) {
  const [pulses, setPulses] = useState<number[]>([]);

  // Add pulse effect when pad is activated
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Pulse animation requires setState
  useEffect(() => {
    if (activePad === null || activePad === undefined) return;

    const pulseId = Date.now();
    setPulses((prev) => [...prev, pulseId]);

    // Remove pulse after animation
    const timer = setTimeout(() => {
      setPulses((prev) => prev.filter((id) => id !== pulseId));
    }, 600);

    return () => clearTimeout(timer);
  }, [activePad]);

  const color = MODE_COLORS[mode];

  return (
    <div className="relative h-24 overflow-hidden rounded-lg bg-black/20">
      {/* Deck Label */}
      <div className="absolute left-3 top-3 z-10 text-xs font-mono text-white/40">
        DECK {deckId}
      </div>

      {/* Active Pad Indicator */}
      {activePad !== null && activePad !== undefined && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute right-3 top-3 z-10 flex items-center gap-2"
        >
          <span className="text-xs font-mono text-white/60">
            PAD {activePad + 1}
          </span>
          <motion.div
            animate={{
              boxShadow: [`0 0 8px ${color}80`, `0 0 20px ${color}`, `0 0 8px ${color}80`],
            }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
        </motion.div>
      )}

      {/* Ripple Pulses */}
      <AnimatePresence>
        {pulses.map((pulseId) => (
          <motion.div
            key={pulseId}
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 rounded-lg"
            style={{
              background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Background Glow */}
      <motion.div
        animate={{
          opacity: activePad !== null && activePad !== undefined ? [0.1, 0.3, 0.1] : 0.05,
        }}
        transition={{ duration: 1, repeat: Infinity }}
        className="absolute inset-0 rounded-lg"
        style={{
          background: `radial-gradient(circle at center, ${color}20 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}
