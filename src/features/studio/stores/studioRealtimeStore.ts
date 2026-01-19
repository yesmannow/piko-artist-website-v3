import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";
import { useStore } from "zustand";

export interface StudioRealtimeState {
  /**
   * Transport playhead time (seconds) in the current timeline.
   * This is intended for high-frequency updates (RAF driven).
   */
  playheadSeconds: number;

  /** Beat position derived from bpm and playheadSeconds. */
  beat: number;

  /** Cached bpm for beat calculations and canvas labeling. */
  bpm: number;

  /** Mirrors UI transport state (play/pause). */
  isPlaying: boolean;

  /**
   * Master RMS meter (0..1), typically fed from an AudioWorklet meter processor.
   * (May remain 0 until metering is wired.)
   */
  masterRms: number;
}

export const studioRealtimeStore = createStore<StudioRealtimeState>()(
  subscribeWithSelector<StudioRealtimeState>(() => ({
    playheadSeconds: 0,
    beat: 0,
    bpm: 120,
    isPlaying: false as boolean,
    masterRms: 0,
  }))
);

/**
 * React hook for rare subscriptions (avoid for per-frame updates).
 * Canvas code should prefer `studioRealtimeStore.getState()` inside RAF loops.
 */
export function useStudioRealtime<T>(selector: (s: StudioRealtimeState) => T): T {
  return useStore(studioRealtimeStore, selector);
}

