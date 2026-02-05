/**
 * Phase 5 Batch 3: Quantize Hook
 *
 * React hook for managing quantize settings and operations.
 * Integrates with beatgrid and provides quantize controls.
 */

import { useState, useCallback, useMemo } from "react";
import type { BeatGridData } from "@/lib/audio/beatDetection";
import {
  QuantizeMode,
  type QuantizeSettings,
  quantizeTime,
  quantizeCue,
  quantizeLoop,
  calculateQuantizeLatency,
  isOnBeat,
  getBeatNumber,
  getBarNumber,
} from "@/lib/audio/quantize";

// ============================================================================
// Hook Interface
// ============================================================================

export interface UseQuantizeReturn {
  // Settings
  settings: QuantizeSettings;
  mode: QuantizeMode;
  strength: number;
  lookahead: boolean;

  // Actions
  setMode: (mode: QuantizeMode) => void;
  setStrength: (strength: number) => void;
  setLookahead: (lookahead: boolean) => void;
  toggleQuantize: () => void;
  cycleMode: () => void; // Cycle through modes (OFF → 1/4 → 1/8 → 1/16 → 1/32)

  // Quantization operations
  quantizeTime: (time: number) => number;
  quantizeCue: (cueTime: number) => number;
  quantizeLoop: (start: number, end: number) => { start: number; end: number; length: number };
  getPlayLatency: (currentTime: number) => number;

  // Status
  isEnabled: boolean;
  isOnBeat: (time: number) => boolean;
  getBeatNumber: (time: number) => number | null;
  getBarNumber: (time: number) => number | null;
}

// ============================================================================
// Default Settings
// ============================================================================

const DEFAULT_SETTINGS: QuantizeSettings = {
  mode: QuantizeMode.OFF,
  strength: 1.0, // 100% snap
  lookahead: false, // Snap to nearest by default
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for quantize settings and operations
 *
 * @param beatGrid Beatgrid data (from useBeatGrid hook)
 * @returns Quantize controls and operations
 */
export function useQuantize(beatGrid: BeatGridData | null): UseQuantizeReturn {
  // State
  const [settings, setSettings] = useState<QuantizeSettings>(DEFAULT_SETTINGS);

  // Actions
  const setMode = useCallback((mode: QuantizeMode) => {
    setSettings((prev) => ({ ...prev, mode }));
  }, []);

  const setStrength = useCallback((strength: number) => {
    const clampedStrength = Math.max(0, Math.min(1, strength));
    setSettings((prev) => ({ ...prev, strength: clampedStrength }));
  }, []);

  const setLookahead = useCallback((lookahead: boolean) => {
    setSettings((prev) => ({ ...prev, lookahead }));
  }, []);

  const toggleQuantize = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      mode: prev.mode === QuantizeMode.OFF ? QuantizeMode.BEAT : QuantizeMode.OFF,
    }));
  }, []);

  const cycleMode = useCallback(() => {
    setSettings((prev) => {
      const modes = [
        QuantizeMode.OFF,
        QuantizeMode.BEAT,
        QuantizeMode.EIGHTH,
        QuantizeMode.SIXTEENTH,
        QuantizeMode.THIRTYSECOND,
      ];
      const currentIndex = modes.indexOf(prev.mode);
      const nextIndex = (currentIndex + 1) % modes.length;
      return { ...prev, mode: modes[nextIndex] };
    });
  }, []);

  // Quantization operations (memoized to prevent re-renders)
  const quantizeTimeOp = useCallback(
    (time: number): number => {
      return quantizeTime(time, beatGrid, settings).quantizedTime;
    },
    [beatGrid, settings]
  );

  const quantizeCueOp = useCallback(
    (cueTime: number): number => {
      return quantizeCue(cueTime, beatGrid, settings);
    },
    [beatGrid, settings]
  );

  const quantizeLoopOp = useCallback(
    (start: number, end: number) => {
      return quantizeLoop(start, end, beatGrid, settings);
    },
    [beatGrid, settings]
  );

  const getPlayLatency = useCallback(
    (currentTime: number): number => {
      return calculateQuantizeLatency(currentTime, beatGrid, settings);
    },
    [beatGrid, settings]
  );

  // Status checks
  const isOnBeatCheck = useCallback(
    (time: number): boolean => {
      return isOnBeat(time, beatGrid);
    },
    [beatGrid]
  );

  const getBeatNumberOp = useCallback(
    (time: number): number | null => {
      return getBeatNumber(time, beatGrid);
    },
    [beatGrid]
  );

  const getBarNumberOp = useCallback(
    (time: number): number | null => {
      return getBarNumber(time, beatGrid);
    },
    [beatGrid]
  );

  // Derived state
  const isEnabled = useMemo(
    () => settings.mode !== QuantizeMode.OFF && settings.strength > 0,
    [settings.mode, settings.strength]
  );

  return {
    // Settings
    settings,
    mode: settings.mode,
    strength: settings.strength,
    lookahead: settings.lookahead,

    // Actions
    setMode,
    setStrength,
    setLookahead,
    toggleQuantize,
    cycleMode,

    // Operations
    quantizeTime: quantizeTimeOp,
    quantizeCue: quantizeCueOp,
    quantizeLoop: quantizeLoopOp,
    getPlayLatency,

    // Status
    isEnabled,
    isOnBeat: isOnBeatCheck,
    getBeatNumber: getBeatNumberOp,
    getBarNumber: getBarNumberOp,
  };
}
