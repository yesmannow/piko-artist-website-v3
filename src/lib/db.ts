import Dexie, { Table } from 'dexie';

export interface Track {
  id?: number;
  title: string;
  artist: string;
  bpm: string;
  key: string;
  duration: string;
  energy: string;
  hasVocal: boolean;
  fileBlob?: Blob;
  artworkUrl?: string;
  createdAt: number;
  // Intelligence / Phase VII fields
  url?: string;
  status?: 'pending' | 'analyzing' | 'ready' | 'error';
  analysisData?: any;
}

// ── Hot-cue schema ──────────────────────────────────────────────────────────

export interface TrackCue {
  slot: number;
  timeSec: number;
  label?: string;
  color?: string;
}

export interface TrackCues {
  trackKey: string;
  cues: TrackCue[];
  updatedAt: Date;
}

// ── Loop schema ──────────────────────────────────────────────────────────────

export interface TrackLoop {
  trackKey: string;
  startSec: number;
  endSec: number;
  enabled: boolean;
  quantized?: boolean;
  updatedAt: Date;
}

// ── Database class ───────────────────────────────────────────────────────────

export class DJDatabase extends Dexie {
  tracks!: Table<Track, number>;
  trackCues!: Table<TrackCues, string>;
  trackLoops!: Table<TrackLoop, string>;

  constructor() {
    super('DJDatabase');
    this.version(1).stores({
      tracks: '++id, title, artist, bpm, key, createdAt',
    });
    // v2 adds url/status indexes and the hot-cue / loop tables
    this.version(2).stores({
      tracks: '++id, title, artist, bpm, key, createdAt, url, status',
      trackCues: 'trackKey, updatedAt',
      trackLoops: 'trackKey, updatedAt',
    });
  }
}

export const db = new DJDatabase();

// ── Helper functions ─────────────────────────────────────────────────────────

/**
 * Bulk-add tracks that don't yet exist in the database.
 * Typically called by the library-sync hook after comparing with the API manifest.
 */
export async function bulkImportTracks(tracks: Omit<Track, 'id'>[]): Promise<void> {
  await db.tracks.bulkAdd(tracks as Track[]);
}

export interface DatabaseStats {
  total: number;
  analyzed: number;
  unanalyzed: number;
  analyzing: number;
  percentAnalyzed: number;
}

/**
 * Returns aggregate statistics about the local track library.
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  const all = await db.tracks.toArray();
  const total = all.length;
  const analyzed = all.filter((t) => t.status === 'ready').length;
  const analyzing = all.filter((t) => t.status === 'analyzing').length;
  const unanalyzed = total - analyzed - analyzing;
  const percentAnalyzed = total > 0 ? Math.round((analyzed / total) * 100) : 0;
  return { total, analyzed, unanalyzed, analyzing, percentAnalyzed };
}

/**
 * Persist analysis results for a track identified by its URL.
 * Automatically sets status to 'ready' after a successful update.
 */
export async function updateTrackAnalysis(
  url: string,
  data: {
    bpm?: number | string;
    key?: string;
    analysisData?: string;
    status?: Track['status'];
  },
): Promise<void> {
  const update: Partial<Track> = {
    status: 'ready',
    ...(data.key !== undefined && { key: data.key }),
    ...(data.analysisData !== undefined && { analysisData: data.analysisData }),
    ...(data.bpm !== undefined && { bpm: String(data.bpm) }),
    ...(data.status !== undefined && { status: data.status }),
  };
  await db.tracks.where('url').equals(url).modify(update);
}
