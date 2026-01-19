"use client";

import { useEffect, useRef } from 'react';
import { AudioContextManager } from '../lib/AudioContextManager';

/**
 * useAudioLoop - Concurrent loop for playhead updates
 *
 * Uses requestAnimationFrame to poll AudioContext.currentTime for sample-accurate
 * playhead position. Updates DOM directly via refs to bypass React render cycles.
 *
 * This prevents render thrashing when updating playhead 60 times per second.
 */
export interface AudioLoopCallbacks {
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onProgressUpdate?: (progress: number) => void; // 0-1
}

export function useAudioLoop(
  isPlaying: boolean,
  startTime: number, // When playback started (AudioContext.currentTime)
  duration: number,
  playbackRate: number = 1.0,
  callbacks?: AudioLoopCallbacks
) {
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying || duration <= 0) {
      // Cancel animation loop when paused
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const manager = AudioContextManager.getInstance();
    const audioContext = manager.getContext();

    if (!audioContext) {
      return;
    }

    // Animation loop
    const update = () => {
      const now = audioContext.currentTime;
      const elapsed = (now - startTime) * playbackRate;
      const currentTime = Math.min(elapsed, duration);
      const progress = duration > 0 ? currentTime / duration : 0;

      // Throttle updates to ~60fps (every ~16ms)
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      if (timeSinceLastUpdate >= 0.016) {
        callbacks?.onTimeUpdate?.(currentTime, duration);
        callbacks?.onProgressUpdate?.(progress);
        lastUpdateTimeRef.current = now;
      }

      // Continue loop if still playing
      if (isPlaying && currentTime < duration) {
        animationFrameRef.current = requestAnimationFrame(update);
      }
    };

    // Start the loop
    animationFrameRef.current = requestAnimationFrame(update);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, startTime, duration, playbackRate, callbacks]);

  return {
    // Expose current time getter for external use
    getCurrentTime: () => {
      const manager = AudioContextManager.getInstance();
      const audioContext = manager.getContext();
      if (!audioContext) return 0;
      const elapsed = (audioContext.currentTime - startTime) * playbackRate;
      return Math.min(elapsed, duration);
    },
  };
}
