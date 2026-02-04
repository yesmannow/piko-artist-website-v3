/**
 * Phase S11.3 Part 4 - Per-Track Hot Cues Hook
 *
 * Manages hot cues stored in IndexedDB by trackKey.
 * Cues persist across deck changes, page reloads, and URL variants.
 */

import { useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/db';
import type { TrackCue, TrackCues } from '@/lib/db';

export interface CueSlot {
  slot: number; // 0-7
  timeSec: number | null;
  label?: string;
  color?: string;
}

const DEFAULT_CUE_COLORS = [
  '#ff4444', // Red
  '#ff8844', // Orange
  '#ffcc44', // Yellow
  '#44ff44', // Green
  '#44ccff', // Cyan
  '#4488ff', // Blue
  '#8844ff', // Purple
  '#ff44ff', // Magenta
];

/**
 * Hook to manage hot cues for a track
 *
 * @param trackKey - Canonical track identifier (from deriveTrackKey)
 * @returns Cue slots, set/clear/jump functions, loading state
 */
export function useTrackCues(trackKey: string | null) {
  const [cueSlots, setCueSlots] = useState<CueSlot[]>(
    Array.from({ length: 8 }, (_, i) => ({
      slot: i,
      timeSec: null,
      color: DEFAULT_CUE_COLORS[i],
    }))
  );
  const [isLoading, setIsLoading] = useState(false);

  // Load cues from Dexie when trackKey changes
  useEffect(() => {
    const defaultSlots = Array.from({ length: 8 }, (_, i) => ({
      slot: i,
      timeSec: null as number | null,
      color: DEFAULT_CUE_COLORS[i],
    }));

    if (!trackKey) {
      // Reset to empty cues when no track
      setCueSlots(defaultSlots);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    db.trackCues
      .get(trackKey)
      .then((savedCues) => {
        if (savedCues) {
          // Merge saved cues with default slots
          const merged = defaultSlots.map((defaultCue) => {
            const saved = savedCues.cues.find((c) => c.slot === defaultCue.slot);
            return saved
              ? {
                  slot: defaultCue.slot,
                  timeSec: saved.timeSec,
                  label: saved.label,
                  color: saved.color ?? defaultCue.color,
                }
              : defaultCue;
          });
          setCueSlots(merged);
        } else {
          // No saved cues, use defaults
          setCueSlots(defaultSlots);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[useTrackCues] Failed to load cues:', err);
        // Fallback to empty cues on error
        setCueSlots(defaultSlots);
        setIsLoading(false);
      });
  }, [trackKey]);

  /**
   * Set a cue point at a specific time
   */
  const setCue = useCallback(
    async (slot: number, timeSec: number, label?: string) => {
      if (!trackKey || slot < 0 || slot > 7) return;

      // Update local state immediately
      setCueSlots((prev) =>
        prev.map((cue) =>
          cue.slot === slot
            ? { ...cue, timeSec, label: label ?? cue.label }
            : cue
        )
      );

      // Persist to Dexie
      try {
        const existing = await db.trackCues.get(trackKey);
        const cues: TrackCue[] = existing?.cues ?? [];

        // Update or add cue
        const index = cues.findIndex((c) => c.slot === slot);
        const newCue: TrackCue = {
          slot,
          timeSec,
          label,
          color: DEFAULT_CUE_COLORS[slot],
        };

        if (index >= 0) {
          cues[index] = newCue;
        } else {
          cues.push(newCue);
        }

        const entry: TrackCues = {
          trackKey,
          cues,
          updatedAt: new Date(),
        };

        await db.trackCues.put(entry);
      } catch (err) {
        console.error('[useTrackCues] Failed to save cue:', err);
      }
    },
    [trackKey]
  );

  /**
   * Clear a cue point
   */
  const clearCue = useCallback(
    async (slot: number) => {
      if (!trackKey || slot < 0 || slot > 7) return;

      // Update local state
      setCueSlots((prev) =>
        prev.map((cue) =>
          cue.slot === slot
            ? { ...cue, timeSec: null, label: undefined }
            : cue
        )
      );

      // Persist to Dexie
      try {
        const existing = await db.trackCues.get(trackKey);
        if (!existing) return;

        const cues = existing.cues.filter((c) => c.slot !== slot);

        if (cues.length === 0) {
          // No cues left, delete entry
          await db.trackCues.delete(trackKey);
        } else {
          const entry: TrackCues = {
            trackKey,
            cues,
            updatedAt: new Date(),
          };
          await db.trackCues.put(entry);
        }
      } catch (err) {
        console.error('[useTrackCues] Failed to clear cue:', err);
      }
    },
    [trackKey]
  );

  /**
   * Clear all cues for the current track
   */
  const clearAllCues = useCallback(async () => {
    if (!trackKey) return;

    // Update local state
    setCueSlots((prev) =>
      prev.map((cue) => ({ ...cue, timeSec: null, label: undefined }))
    );

    // Delete from Dexie
    try {
      await db.trackCues.delete(trackKey);
    } catch (err) {
      console.error('[useTrackCues] Failed to clear all cues:', err);
    }
  }, [trackKey]);

  return {
    cueSlots,
    isLoading,
    setCue,
    clearCue,
    clearAllCues,
  };
}
