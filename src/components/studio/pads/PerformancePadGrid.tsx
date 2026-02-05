'use client';

import React from 'react';
import { usePadStore } from '@/store/usePadStore';
import { PadModeSelector } from './PadModeSelector';
import { HotCuePads } from './HotCuePads';
import { LoopPads } from './LoopPads';
import { SlicerPads } from './SlicerPads';
import { BeatJumpPads } from './BeatJumpPads';

/**
 * PerformancePadGrid - Main Performance Pad Controller
 *
 * Displays mode selector and mode-specific 8-pad grid.
 * Switches between Hot Cue, Loop, Slicer, and Beat Jump modes.
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - Performance Pads System
 */
interface PerformancePadGridProps {
  deckId: 'A' | 'B';
  trackKey?: string;
  player?: unknown; // Tone.Player from useAudioEngine
  bpm?: number;
}

export function PerformancePadGrid({
  deckId,
  trackKey,
  player,
  bpm,
}: PerformancePadGridProps) {
  const mode = usePadStore((state) => state.getMode(deckId));

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-black/40 p-3 backdrop-blur-sm">
      {/* Mode Selector */}
      <PadModeSelector deckId={deckId} />

      {/* Mode-Specific Pad Grid */}
      <div className="min-h-[200px]">
        {mode === 'hotCue' && (
          <HotCuePads
            deckId={deckId}
            trackKey={trackKey}
            player={player}
          />
        )}
        {mode === 'loop' && (
          <LoopPads
            deckId={deckId}
            trackKey={trackKey}
            player={player}
            bpm={bpm}
          />
        )}
        {mode === 'slicer' && (
          <SlicerPads
            deckId={deckId}
            trackKey={trackKey}
            player={player}
            bpm={bpm}
          />
        )}
        {mode === 'beatJump' && (
          <BeatJumpPads
            deckId={deckId}
            player={player}
            bpm={bpm}
          />
        )}
      </div>
    </div>
  );
}
