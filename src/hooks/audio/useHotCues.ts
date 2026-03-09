import { useState, useEffect, useCallback, useRef } from 'react';
import { CueEngine } from '@/audio/performance/CueEngine';
import { db } from '@/lib/db';
import type { TrackCue } from '@/lib/db';

/**
 * useHotCues - Hot Cue Management Hook
 *
 * Manages hot cue points with Tone.js playback and Dexie persistence.
 *
 * @param deckId - Deck identifier ('A' or 'B')
 * @param trackKey - Canonical track identifier
 * @param player - Tone.js Player instance (from useAudioEngine)
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - Performance Pads System
 */
export function useHotCues(
  deckId: 'A' | 'B',
  trackKey?: string,
  player?: unknown // Tone.Player
) {
  const [cues, setCues] = useState<TrackCue[]>([]);
  const [prevTrackKey, setPrevTrackKey] = useState(trackKey);
  const cueEngineRef = useRef<CueEngine>(new CueEngine());

  // Synchronous state reset for UI responsiveness
  if (trackKey !== prevTrackKey) {
    setPrevTrackKey(trackKey);
    setCues([]);
  }

  // Update player reference when it changes
  useEffect(() => {
    if (player) {
      // Cast to unknown then to specific or just bypass with specific interface if needed
      cueEngineRef.current.setPlayer(player as Parameters<CueEngine['setPlayer']>[0]);
    }
  }, [player]);

  // Load cues and sync engine
  useEffect(() => {
    // Always clear engine on track change
    cueEngineRef.current.clearAll();

    if (!trackKey) return;

    const loadCues = async () => {
      try {
        const trackCues = await db.trackCues.get(trackKey);
        if (trackCues?.cues) {
          setCues(trackCues.cues);
          trackCues.cues.forEach((cue) => {
            cueEngineRef.current.setCue(cue.slot + 1, cue.timeSec);
          });
        }
      } catch (error) {
        console.error('[useHotCues] Failed to load cues:', error);
      }
    };

    void loadCues();
  }, [trackKey]);

  // Set a cue at the current playback position
  const setCue = useCallback(
    async (slotNumber: number) => {
      if (!trackKey) return;

      const currentTime = cueEngineRef.current.getCurrentTime();
      const newCue: TrackCue = {
        slot: slotNumber,
        timeSec: currentTime,
        label: `Cue ${slotNumber + 1}`,
        color: undefined, // Can be customized later
      };

      // Update engine
      cueEngineRef.current.setCue(slotNumber + 1, currentTime);

      // Update state
      const updatedCues = cues.filter((c) => c.slot !== slotNumber);
      updatedCues.push(newCue);
      updatedCues.sort((a, b) => a.slot - b.slot);
      setCues(updatedCues);

      // Persist to Dexie
      try {
        await db.trackCues.put({
          trackKey,
          cues: updatedCues,
          updatedAt: new Date(),
        });
      } catch (error) {
        console.error('[useHotCues] Failed to save cue:', error);
      }
    },
    [trackKey, cues]
  );

  // Jump to a cue point
  const jumpToCue = useCallback((slotNumber: number) => {
    const success = cueEngineRef.current.jumpToCue(slotNumber + 1);
    return success;
  }, []);

  // Delete a cue
  const deleteCue = useCallback(
    async (slotNumber: number) => {
      if (!trackKey) return;

      // Update engine
      cueEngineRef.current.deleteCue(slotNumber + 1);

      // Update state
      const updatedCues = cues.filter((c) => c.slot !== slotNumber);
      setCues(updatedCues);

      // Persist to Dexie
      try {
        await db.trackCues.put({
          trackKey,
          cues: updatedCues,
          updatedAt: new Date(),
        });
      } catch (error) {
        console.error('[useHotCues] Failed to delete cue:', error);
      }
    },
    [trackKey, cues]
  );

  return {
    cues,
    setCue,
    jumpToCue,
    deleteCue,
  };
}

