'use client';

import React, { useEffect } from 'react';
import { useSlicer } from '@/hooks/audio/useSlicer';
import { motion } from 'framer-motion';

/**
 * SlicerPads - Beat Slicer Pads
 *
 * Divides current 8-beat region into 8 slices for rhythmic triggering.
 * - Auto-activates on mount (8-beat region from current position)
 * - Each pad triggers its slice
 * - Visual feedback shows slice boundaries
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - Performance Pads System
 */
interface SlicerPadsProps {
  deckId: 'A' | 'B';
  trackKey?: string;
  player?: unknown; // Tone.Player
  bpm?: number;
}

const SLICE_COLOR = '#a855f7'; // purple

export function SlicerPads({ deckId, trackKey, player, bpm }: SlicerPadsProps) {
  const { sliceInfo, isActive, activateSlicer, triggerSlice } = useSlicer(
    deckId,
    player,
    bpm
  );

  // Auto-activate slicer when component mounts
  useEffect(() => {
    if (player && bpm && !isActive) {
      activateSlicer(8); // 8-beat region
    }
  }, [player, bpm, isActive, activateSlicer]);

  const handleSliceClick = (sliceNum: number) => {
    triggerSlice(sliceNum);
  };

  const formatSliceTime = (start: number): string => {
    const mins = Math.floor(start / 60);
    const secs = Math.floor(start % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-4 gap-2 p-2">
      {Array.from({ length: 8 }).map((_, index) => {
        const slice = sliceInfo[index];
        const hasSlice = Boolean(slice && slice.start >= 0);

        return (
          <motion.button
            key={index}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleSliceClick(index)}
            disabled={!hasSlice}
            className="relative aspect-square rounded-lg font-bold text-white transition-all disabled:opacity-30"
            style={{
              backgroundColor: hasSlice ? SLICE_COLOR : '#2a2a2a',
              boxShadow: hasSlice
                ? `0 0 20px ${SLICE_COLOR}40`
                : '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex h-full flex-col items-center justify-center gap-1">
              <span className="text-xs opacity-70">
                {index + 1}
              </span>
              {hasSlice && slice && (
                <span className="text-[10px] font-normal opacity-90">
                  {formatSliceTime(slice.start)}
                </span>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
