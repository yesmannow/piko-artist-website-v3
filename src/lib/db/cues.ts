/**
 * Hot Cue Database Helpers
 *
 * Re-exports types from main database schema.
 * The actual tables (trackCues, TrackCue, TrackCues) are defined in src/lib/db.ts
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - Performance Pads System
 * @see src/lib/db.ts - PikoDatabase schema
 */

import { db } from '../db';
import type { TrackCue, TrackCues } from '../db';

export type { TrackCue, TrackCues };
export { db };

/**
 * Helper: Get all cues for a track
 */
export async function getCuesForTrack(trackKey: string): Promise<TrackCues | undefined> {
  return await db.trackCues.get(trackKey);
}

/**
 * Helper: Save cues for a track
 */
export async function saveCuesForTrack(trackKey: string, cues: TrackCue[]): Promise<void> {
  await db.trackCues.put({
    trackKey,
    cues,
    updatedAt: new Date(),
  });
}

/**
 * Helper: Update a single cue
 */
export async function updateSingleCue(
  trackKey: string,
  slot: number,
  cueData: Partial<TrackCue>
): Promise<void> {
  const existing = await db.trackCues.get(trackKey);
  const cues = existing?.cues || [];

  const cueIndex = cues.findIndex((c) => c.slot === slot);
  if (cueIndex >= 0) {
    cues[cueIndex] = { ...cues[cueIndex], ...cueData };
  } else {
    cues.push({ slot, timeSec: 0, ...cueData } as TrackCue);
  }

  await saveCuesForTrack(trackKey, cues);
}

/**
 * Helper: Delete all cues for a track
 */
export async function deleteCuesForTrack(trackKey: string): Promise<void> {
  await db.trackCues.delete(trackKey);
}

/**
 * Helper: Delete a single cue by slot
 */
export async function deleteSingleCue(trackKey: string, slot: number): Promise<void> {
  const existing = await db.trackCues.get(trackKey);
  if (!existing) return;

  const cues = existing.cues.filter((c) => c.slot !== slot);
  await saveCuesForTrack(trackKey, cues);
}



