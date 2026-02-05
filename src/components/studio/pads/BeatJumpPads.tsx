'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';

/**
 * BeatJumpPads - Beat Jump Navigation
 *
 * Navigate track by jumping forward/backward by beat increments.
 * - Top row: Jump backward (32, 16, 8, 4 beats)
 * - Bottom row: Jump forward (4, 8, 16, 32 beats)
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - Performance Pads System
 */
interface BeatJumpPadsProps {
  deckId: 'A' | 'B';
  player?: unknown; // Tone.Player
  bpm?: number;
}

const JUMP_BEATS = [32, 16, 8, 4, 4, 8, 16, 32]; // Back then forward
const JUMP_DIRECTIONS = [-1, -1, -1, -1, 1, 1, 1, 1]; // Negative = backward

export function BeatJumpPads({ deckId, player, bpm }: BeatJumpPadsProps) {
  const handleJump = useCallback((beats: number, direction: number) => {
    if (!player || !bpm) return;

    const tonePlayer = player as any;
    const beatDuration = 60 / bpm;
    const jumpSeconds = beats * beatDuration * direction;

    // Get current position and jump
    const currentTime = tonePlayer.toSeconds?.(tonePlayer.immediate()) ?? 0;
    const newTime = Math.max(0, currentTime + jumpSeconds);

    // Seek to new position
    tonePlayer.seek?.(newTime);
  }, [player, bpm]);

  return (
    <div className="grid grid-cols-4 gap-2 p-2">
      {JUMP_BEATS.map((beats, index) => {
        const direction = JUMP_DIRECTIONS[index];
        const isBackward = direction < 0;
        const color = isBackward ? '#ef4444' : '#3b82f6'; // red for back, blue for forward

        return (
          <motion.button
            key={index}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleJump(beats, direction)}
            className="relative aspect-square rounded-lg font-bold text-white transition-all"
            style={{
              backgroundColor: '#2a2a2a',
              borderWidth: 2,
              borderColor: color,
              boxShadow: `0 0 12px ${color}30`,
            }}
          >
            <div className="flex h-full flex-col items-center justify-center gap-1">
              <span className="text-lg opacity-90">
                {isBackward ? '←' : '→'}
              </span>
              <span className="text-xs font-normal opacity-70">
                {beats}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
