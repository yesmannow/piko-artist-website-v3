'use client';

import React from 'react';
import { useHotCues } from '@/hooks/audio/useHotCues';
import { motion } from 'framer-motion';

/**
 * HotCuePads - 8-Pad Hot Cue Grid
 *
 * Interactive pad grid for setting, triggering, and deleting hot cue points.
 * - Click empty pad: Set cue at current time
 * - Click filled pad: Jump to cue
 * - Right-click/Long-press: Delete cue
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - Performance Pads System
 */
interface HotCuePadsProps {
  deckId: 'A' | 'B';
  trackKey?: string;
  player?: unknown; // Tone.Player from useAudioEngine
}

const PAD_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
];

export function HotCuePads({ deckId, trackKey, player }: HotCuePadsProps) {
  const { cues, setCue, jumpToCue, deleteCue } = useHotCues(deckId, trackKey, player);

  const handlePadClick = (padNumber: number) => {
    const existingCue = cues.find((c) => c.slot === padNumber);

    if (existingCue) {
      // Jump to existing cue
      void jumpToCue(padNumber);
    } else {
      // Set new cue
      void setCue(padNumber);
    }
  };

  const handlePadRightClick = (padNumber: number, e: React.MouseEvent) => {
    e.preventDefault();
    void deleteCue(padNumber);
  };

  return (
    <div className="grid grid-cols-4 gap-2 p-2">
      {Array.from({ length: 8 }).map((_, index) => {
        const cue = cues.find((c) => c.slot === index);
        const hasCue = Boolean(cue);
        const color = PAD_COLORS[index];

        return (
          <motion.button
            key={index}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handlePadClick(index)}
            onContextMenu={(e) => handlePadRightClick(index, e)}
            className="relative aspect-square rounded-lg font-bold text-white transition-all"
            style={{
              backgroundColor: hasCue ? color : '#2a2a2a',
              boxShadow: hasCue
                ? `0 0 20px ${color}40`
                : '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex h-full flex-col items-center justify-center gap-1">
              <span className="text-xs opacity-70">
                {index + 1}
              </span>
              {hasCue && cue && (
                <span className="text-[10px] font-normal opacity-90">
                  {formatTime(cue.timeSec)}
                </span>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}


