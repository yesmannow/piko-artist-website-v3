"use client";

import { useEffect, useRef } from "react";
import { useStudioStore } from "../stores/useStudioStore";
import { studioRealtimeStore } from "../stores/studioRealtimeStore";
import { StudioEngine } from "../lib/StudioEngine";
import { TimelineEngine } from "../lib/TimelineEngine";

/**
 * useStudioClock (Studio heartbeat)
 *
 * Drives a 60fps UI loop without forcing React re-renders.
 * - Uses `AudioContext` time indirectly via `AudioEngine.getPositionSeconds()` for sample-accurate sync.
 * - Updates `studioRealtimeStore` for any consumers that need the latest playhead time.
 * - Calls the provided callback each frame (ideal for Canvas drawing).
 */
export function useStudioClock(callback: (timeSeconds: number, beat: number) => void) {
  const frameRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);

  // Keep latest callback without restarting the loop.
  callbackRef.current = callback;

  useEffect(() => {
    const engine = StudioEngine.getInstance();
    const timeline = TimelineEngine.getInstance();

    const loop = () => {
      const { bpm, isPlaying, timelineIsPlaying } = useStudioStore.getState();

      // Keep store flag in sync if TimelineEngine has stopped internally.
      if (timelineIsPlaying && !timeline.getIsPlaying()) {
        useStudioStore.setState({ timelineIsPlaying: false });
      }

      const t = timelineIsPlaying ? timeline.getPositionSeconds() : engine.getActivePositionSeconds();
      const beat = (t * bpm) / 60;

      // Vanilla store update (high-frequency safe; consumers should not over-subscribe).
      studioRealtimeStore.setState({
        playheadSeconds: t,
        beat,
        bpm,
        isPlaying: timelineIsPlaying ? true : isPlaying,
        // Metering is wired later via AudioWorklet; keep stable default for now.
        masterRms: studioRealtimeStore.getState().masterRms,
      });

      callbackRef.current(t, beat);
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);
}

