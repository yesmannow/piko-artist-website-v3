import { useState, useEffect, useCallback } from 'react';
import { SlicerEngine } from '@/audio/performance/SlicerEngine';

/**
 * useSlicer - Beat Slicer Hook
 *
 * Manages beat slicing for rhythmic pad triggering.
 * Integrates SlicerEngine with React state.
 * Note: Slicer state is ephemeral (not persisted to Dexie).
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - Performance Pads System
 */
export function useSlicer(
  deckId: 'A' | 'B',
  player?: unknown,
  bpm?: number
) {
  const [slicerEngine] = useState(() => new SlicerEngine());
  const [sliceInfo, setSliceInfo] = useState<Array<{ start: number; end: number }>>([]);
  const [isActive, setIsActive] = useState(false);

  // Connect player when available
  useEffect(() => {
    if (player) {
      slicerEngine.setPlayer(player as any);
    }
  }, [player, slicerEngine]);

  // Update BPM when it changes
  useEffect(() => {
    if (bpm) {
      slicerEngine.setBPM(bpm);
    }
  }, [bpm, slicerEngine]);

  // Auto-set slice region based on current position
  const activateSlicer = useCallback((beats: number = 8) => {
    slicerEngine.setSliceRegion(beats);

    // Update slice info for UI
    const info = Array.from({ length: 8 }).map((_, i) =>
      slicerEngine.getSliceInfo(i)
    );
    setSliceInfo(info);
    setIsActive(true);
  }, [slicerEngine]);

  // Trigger a specific slice
  const triggerSlice = useCallback((sliceNum: number) => {
    slicerEngine.triggerSlice(sliceNum);
  }, [slicerEngine]);

  // Deactivate slicer
  const deactivate = useCallback(() => {
    setIsActive(false);
    setSliceInfo([]);
  }, []);

  return {
    sliceInfo,
    isActive,
    activateSlicer,
    triggerSlice,
    deactivate,
  };
}
