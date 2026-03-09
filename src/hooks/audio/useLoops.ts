import { useState, useEffect, useCallback, useRef } from 'react';
import { LoopEngine } from '@/audio/performance/LoopEngine';
import { db } from '@/lib/db';
import type { TrackLoop } from '@/lib/db';

/**
 * useLoops - Loop Management Hook
 *
 * Manages loop regions with Tone.js playback and Dexie persistence.
 *
 * @param deckId - Deck identifier ('A' or 'B')
 * @param trackKey - Canonical track identifier
 * @param player - Tone.js Player instance
 * @param bpm - Track BPM for beat-based loops
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - Performance Pads System
 */
export function useLoops(
  deckId: 'A' | 'B',
  trackKey?: string,
  player?: unknown, // Tone.Player
  bpm?: number
) {
  const [loop, setLoop] = useState<TrackLoop | null>(null);
  const [prevTrackKey, setPrevTrackKey] = useState(trackKey);
  const loopEngineRef = useRef<LoopEngine>(new LoopEngine());

  // Respond to trackKey changes synchronously during render
  if (trackKey !== prevTrackKey) {
    setPrevTrackKey(trackKey);
    setLoop(null);
  }

  // Update player and BPM when they change
  useEffect(() => {
    if (player) {
      loopEngineRef.current.setPlayer(player as Parameters<LoopEngine['setPlayer']>[0]);
    }
    if (bpm) {
      loopEngineRef.current.setBPM(bpm);
    }
  }, [player, bpm]);

  // Load loop from Dexie when track changes
  useEffect(() => {
    // Always clear engine on track change
    loopEngineRef.current.clearLoop();

    if (!trackKey) return;

    const loadLoop = async () => {
      try {
        const trackLoop = await db.trackLoops.get(trackKey);
        if (trackLoop) {
          setLoop(trackLoop);
          loopEngineRef.current.setLoop(trackLoop.startSec, trackLoop.endSec);
          if (trackLoop.enabled) {
            loopEngineRef.current.enableLoop();
          }
        }
      } catch (error) {
        console.error('[useLoops] Failed to load loop:', error);
      }
    };

    void loadLoop();
  }, [trackKey]);

  // Create a beat loop (4, 8, 16, or 32 beats)
  const createBeatLoop = useCallback(
    async (beats: number) => {
      if (!trackKey) return;

      const { start, end } = loopEngineRef.current.createBeatLoop(beats);
      const newLoop: TrackLoop = {
        trackKey,
        startSec: start,
        endSec: end,
        enabled: true,
        quantized: true,
        updatedAt: new Date(),
      };

      setLoop(newLoop);

      // Persist to Dexie
      try {
        await db.trackLoops.put(newLoop);
      } catch (error) {
        console.error('[useLoops] Failed to save loop:', error);
      }
    },
    [trackKey]
  );

  // Toggle loop on/off
  const toggleLoop = useCallback(async () => {
    if (!loop || !trackKey) return;

    const isEnabled = loopEngineRef.current.toggleLoop();
    const updatedLoop = { ...loop, enabled: isEnabled, updatedAt: new Date() };
    setLoop(updatedLoop);

    try {
      await db.trackLoops.put(updatedLoop);
    } catch (error) {
      console.error('[useLoops] Failed to update loop:', error);
    }
  }, [loop, trackKey]);

  // Clear the loop
  const clearLoop = useCallback(async () => {
    if (!trackKey) return;

    loopEngineRef.current.clearLoop();
    setLoop(null);

    try {
      await db.trackLoops.delete(trackKey);
    } catch (error) {
      console.error('[useLoops] Failed to delete loop:', error);
    }
  }, [trackKey]);

  return {
    loop,
    createBeatLoop,
    toggleLoop,
    clearLoop,
  };
}

