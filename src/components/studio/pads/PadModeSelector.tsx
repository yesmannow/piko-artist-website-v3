'use client';

import React from 'react';
import { usePadStore } from '@/store/usePadStore';
import { motion } from 'framer-motion';

/**
 * PadModeSelector - Performance Pad Mode Switcher
 *
 * Switches between different pad modes:
 * - Hot Cue: Set/trigger/delete cue points
 * - Loop: Create beat-based loops
 * - Slicer: Trigger beat slices
 * - Beat Jump: Navigate by beats
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - Performance Pads System
 */
interface PadModeSelectorProps {
  deckId: 'A' | 'B';
}

type PadMode = 'hotCue' | 'loop' | 'slicer' | 'beatJump';

const MODES: Array<{ id: PadMode; label: string; icon: string }> = [
  { id: 'hotCue', label: 'Hot Cue', icon: '●' },
  { id: 'loop', label: 'Loop', icon: '⟲' },
  { id: 'slicer', label: 'Slicer', icon: '▮' },
  { id: 'beatJump', label: 'Jump', icon: '⇄' },
];

const MODE_COLORS: Record<PadMode, string> = {
  hotCue: '#ef4444',
  loop: '#22c55e',
  slicer: '#a855f7',
  beatJump: '#3b82f6',
};

export function PadModeSelector({ deckId }: PadModeSelectorProps) {
  const currentMode = usePadStore((state) => state.getMode(deckId));
  const setMode = usePadStore((state) =>
    deckId === 'A' ? state.setDeckAMode : state.setDeckBMode
  );

  return (
    <div className="flex gap-1 p-2">
      {MODES.map((mode) => {
        const isActive = currentMode === mode.id;
        const color = MODE_COLORS[mode.id];

        return (
          <motion.button
            key={mode.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode(mode.id)}
            className="flex-1 rounded-lg px-3 py-2 font-semibold text-white transition-all"
            style={{
              backgroundColor: isActive ? color : '#2a2a2a',
              opacity: isActive ? 1 : 0.6,
              boxShadow: isActive
                ? `0 0 16px ${color}60`
                : '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg leading-none">{mode.icon}</span>
              <span className="text-[10px] uppercase tracking-wider">
                {mode.label}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
