'use client';

import React from 'react';
import { useLoops } from '@/hooks/audio/useLoops';
import { motion } from 'framer-motion';

/**
 * LoopPads - Auto-Loop Beat Pads
 *
 * 8 pads for triggering beat-based loops:
 * - Top row: 1/4, 1/2, 1, 2 beat loops
 * - Bottom row: 4, 8, 16, 32 beat loops
 * - Click: Create/toggle loop
 * - Active loop glows
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - Performance Pads System
 */
interface LoopPadsProps {
  deckId: 'A' | 'B';
  trackKey?: string;
  player?: unknown; // Tone.Player
  bpm?: number;
}

const BEAT_LENGTHS = [0.25, 0.5, 1, 2, 4, 8, 16, 32];
const LOOP_COLOR = '#22c55e'; // green

export function LoopPads({ deckId, trackKey, player, bpm }: LoopPadsProps) {
  const { loop, createBeatLoop, toggleLoop, clearLoop } = useLoops(
    deckId,
    trackKey,
    player,
    bpm
  );

  const handleLoopClick = (beats: number) => {
    // If same loop is active, toggle it off
    if (loop && isLoopActive(beats)) {
      void toggleLoop();
    } else {
      // Create new beat loop
      void createBeatLoop(beats);
    }
  };

  const handleClearLoop = (e: React.MouseEvent) => {
    e.preventDefault(); // Right-click
    void clearLoop();
  };

  const isLoopActive = (beats: number): boolean => {
    if (!loop || !bpm) return false;

    const expectedDuration = (60 / bpm) * beats;
    const actualDuration = loop.endSec - loop.startSec;

    // Check if loop duration matches (within 0.1s tolerance)
    return Math.abs(actualDuration - expectedDuration) < 0.1 && loop.enabled;
  };

  return (
    <div className="grid grid-cols-4 gap-2 p-2">
      {BEAT_LENGTHS.map((beats, index) => {
        const isActive = isLoopActive(beats);

        return (
          <motion.button
            key={index}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleLoopClick(beats)}
            onContextMenu={handleClearLoop}
            className="relative aspect-square rounded-lg font-bold text-white transition-all"
            style={{
              backgroundColor: isActive ? LOOP_COLOR : '#2a2a2a',
              boxShadow: isActive
                ? `0 0 20px ${LOOP_COLOR}60`
                : '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex h-full flex-col items-center justify-center gap-1">
              <span className="text-xs opacity-90">
                {beats < 1 ? `1/${1 / beats}` : beats}
              </span>
              <span className="text-[10px] font-normal opacity-60">
                BEAT{beats !== 1 ? 'S' : ''}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
