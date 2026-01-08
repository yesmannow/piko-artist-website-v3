"use client";

import { useRef } from 'react';
import { useDrag } from '@use-gesture/react';
import { useAudioStore } from '@/store/useAudioStore';
import { getAudioEngine } from '@/engine/AudioEngine';
import { triggerHaptic, HAPTIC_PATTERNS } from '@/utils/haptics';

interface ScrubLayerProps {
  deckId: string;
}

/**
 * PHASE 5: Scrub Layer for Waveform Seeking
 * 
 * Transparent touch layer over waveform that allows seeking by dragging.
 * Maps X position to track time and calls AudioEngine.seek().
 */
export const ScrubLayer = ({ deckId }: ScrubLayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const deckState = useAudioStore((state) => state.decks[deckId]);

  // Drag gesture handler for scrubbing
  const bind = useDrag(
    ({ xy: [x], first, last, tap }) => {
      if (!containerRef.current || !deckState.duration) return;

      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = x - rect.left;
      const progress = Math.max(0, Math.min(1, relativeX / rect.width));
      const seekTime = progress * deckState.duration;

      // Haptic feedback on touch start
      if (first) {
        triggerHaptic(HAPTIC_PATTERNS.CLICK);
      }

      // Seek to position
      try {
        const engine = getAudioEngine();
        engine.seek(deckId, seekTime);
      } catch (error) {
        console.warn('Seek failed:', error);
      }

      // Haptic feedback on release
      if (last) {
        triggerHaptic(HAPTIC_PATTERNS.CLICK);
      }
    },
    {
      filterTaps: false, // Allow taps to seek
      pointer: { touch: true },
    }
  );

  return (
    <div
      ref={containerRef}
      {...bind()}
      className="absolute inset-0 z-10 cursor-pointer touch-none"
      style={{ touchAction: 'none' }}
    />
  );
};
