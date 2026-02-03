/**
 * PikoDatabase - IndexedDB Layer via Dexie.js
 *
 * Phase VII: Intelligent Library & Cloud Ecosystem
 * Phase IX: AI Insights & Smart Metadata
 *
 * This is the single source of truth for the TrackLibrary component.
 *
 * Architecture:
 * - Stores tracks fetched from Cloudflare R2
 * - Caches BPM/Key/Energy analysis data from Essentia.js
 * - Maps local artwork to remote audio
 * - Enables instant app loading on subsequent visits
 * - NO SUPABASE - 100% local-first with IndexedDB
 */

import Dexie, { type Table } from 'dexie';

export interface Track {
  id?: number; // Auto-incremented primary key
  url: string; // Unique - R2 object URL
  title: string;
  artist: string;
  bpm?: number; // Detected BPM (Rhythm Extraction)
  key?: string; // Musical key with Camelot notation (e.g., "C major (8B)")
  energy?: number; // Energy level 0.0-1.0 (Phase IX)
  artwork: string; // Local image path
  analysisData?: string; // JSON stringified analysis (waveform, stems, confidence, etc.)
  dateAdded: Date;
  status: 'unanalyzed' | 'analyzing' | 'analyzed' | 'error';
  genre?: string;
  mood?: string;
  duration?: number; // In seconds
  fileSize?: number; // In bytes
  stemUrls?: string[]; // Array of stem URLs if available
}

export class PikoDatabase extends Dexie {
  tracks!: Table<Track, number>;

  constructor() {
    super('PikoDJ');

    // Version 2: Added energy field for Phase IX
    this.version(2).stores({
      tracks: '++id, url, title, artist, bpm, key, energy, status, dateAdded, genre, mood'
    }).upgrade(tx => {
      // Migrate existing records to add energy field
      return tx.table('tracks').toCollection().modify(track => {
        if (track.energy === undefined) {
          track.energy = 0.5; // Default medium energy
        }
      });
    });

    // Keep version 1 for backwards compatibility
    this.version(1).stores({
      tracks: '++id, url, title, artist, bpm, key, status, dateAdded, genre, mood'
    });
  }
}

// Singleton instance
export const db = new PikoDatabase();

/**
 * Helper: Check if a track exists by URL
 */
export async function trackExists(url: string): Promise<boolean> {
  const count = await db.tracks.where('url').equals(url).count();
  return count > 0;
}

/**
 * Helper: Get or create a track
 */
export async function getOrCreateTrack(trackData: Omit<Track, 'id'>): Promise<Track> {
  const existing = await db.tracks.where('url').equals(trackData.url).first();

  if (existing) {
    return existing;
  }

  const id = await db.tracks.add(trackData);
  const newTrack = await db.tracks.get(id);

  if (!newTrack) {
    throw new Error('Failed to create track');
  }

  return newTrack;
}

/**
 * Helper: Update track analysis data
 */
export async function updateTrackAnalysis(
  url: string,
  analysisData: { bpm?: number; key?: string; analysisData?: string }
): Promise<void> {
  await db.tracks.where('url').equals(url).modify({
    ...analysisData,
    status: 'analyzed'
  });
}

/**
 * Helper: Bulk import tracks (for initial sync)
 */
export async function bulkImportTracks(tracks: Omit<Track, 'id'>[]): Promise<number> {
  const newTracks = [];

  for (const track of tracks) {
    const exists = await trackExists(track.url);
    if (!exists) {
      newTracks.push(track);
    }
  }

  if (newTracks.length === 0) {
    return 0;
  }

  await db.tracks.bulkAdd(newTracks);
  return newTracks.length;
}

/**
 * Helper: Search tracks
 */
export async function searchTracks(query: string): Promise<Track[]> {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return db.tracks.toArray();
  }

  return db.tracks
    .filter(track =>
      track.title.toLowerCase().includes(normalizedQuery) ||
      track.artist.toLowerCase().includes(normalizedQuery) ||
      track.genre?.toLowerCase().includes(normalizedQuery) ||
      track.mood?.toLowerCase().includes(normalizedQuery)
    )
    .toArray();
}

/**
 * Helper: Get tracks by status
 */
export async function getTracksByStatus(status: Track['status']): Promise<Track[]> {
  return db.tracks.where('status').equals(status).toArray();
}

/**
 * Helper: Clear all tracks (for debugging)
 */
export async function clearAllTracks(): Promise<void> {
  await db.tracks.clear();
}

/**
 * Helper: Get database stats
 */
export async function getDatabaseStats() {
  const total = await db.tracks.count();
  const analyzed = await db.tracks.where('status').equals('analyzed').count();
  const unanalyzed = await db.tracks.where('status').equals('unanalyzed').count();
  const analyzing = await db.tracks.where('status').equals('analyzing').count();

  return {
    total,
    analyzed,
    unanalyzed,
    analyzing,
    percentAnalyzed: total > 0 ? Math.round((analyzed / total) * 100) : 0
  };
}
