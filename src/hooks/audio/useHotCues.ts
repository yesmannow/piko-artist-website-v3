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
  const cueEngineRef = useRef<CueEngine>(new CueEngine());

  // Update player reference when it changes
  useEffect(() => {
    if (player) {
      cueEngineRef.current.setPlayer(player as any);
    }
  }, [player]);

  // Load cues from Dexie when track changes
  useEffect(() => {
    if (!trackKey) {
      setCues([]);
      cueEngineRef.current.clearAll();
      return;
    }

    const loadCues = async () => {
      try {
        const trackCues = await db.trackCues.get(trackKey);
        if (trackCues?.cues) {
          setCues(trackCues.cues);

          // Load cues into engine
          cueEngineRef.current.clearAll();
          trackCues.cues.forEach((cue) => {
            cueEngineRef.current.setCue(cue.slot + 1, cue.timeSec); // slot 0-7 -> cue 1-8
          });
        } else {
          setCues([]);
          cueEngineRef.current.clearAll();
        }
      } catch (error) {
        console.error('[useHotCues] Failed to load cues:', error);
        setCues([]);
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

