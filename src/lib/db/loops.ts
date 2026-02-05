/**
 * Loop Database Helpers
 *
 * Re-exports types from main database schema.
 * The actual table (trackLoops, TrackLoop) is defined in src/lib/db.ts
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - Performance Pads System
 * @see src/lib/db.ts - PikoDatabase schema
 */

import { db } from '../db';
import type { TrackLoop } from '../db';

export type { TrackLoop };

/**
 * Helper: Get loop for a track
 */
export async function getLoopForTrack(trackKey: string) {
  return await db.trackLoops.get(trackKey);
}

/**
 * Helper: Save loop for a track
 */
export async function saveLoopForTrack(loop: TrackLoop) {
  await db.trackLoops.put({
    ...loop,
    updatedAt: new Date(),
  });
}

/**
 * Helper: Delete loop for a track
 */
export async function deleteLoopForTrack(trackKey: string) {
  await db.trackLoops.delete(trackKey);
}

/**
 * Helper: Clear loop (set enabled = false)
 */
export async function clearLoopForTrack(trackKey: string) {
  const existing = await db.trackLoops.get(trackKey);
  if (existing) {
    await db.trackLoops.put({
      ...existing,
      enabled: false,
      updatedAt: new Date(),
    });
  }
}


