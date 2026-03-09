/**
 * Phase S8: Studio Database (Dexie)
 *
 * Local-first track insights storage for AI-powered match suggestions.
 * Stores BPM, key, energy analysis results with version tracking.
 *
 * Phase V3: AcoustID metadata intelligence — verified track info.
 */

import Dexie, { type EntityTable } from 'dexie';

/**
 * Track insights from analysis
 * Cached locally to avoid re-analysis
 */
export interface TrackInsights {
  trackId: string;           // Primary key
  bpm: number | null;        // Detected BPM (null if analysis failed)
  key: string | null;        // Musical key (e.g., "Am", "C major")
  energy: number | null;     // Energy level 0.0-1.0 (null if failed)
  analyzedAt: number;        // Timestamp of analysis
  algoVersion: number;       // Algorithm version for cache invalidation
  failed?: boolean;          // True if analysis failed (distinguishes null from missing)
  firstBeatOffsetSec?: number | null; // Phase S9: First beat offset for beatgrid alignment
  cachedMatchScore?: number; // Phase 2: Last computed match score (for sorting)
  cachedMatchBadge?: string; // Phase 2: Last computed match badge
}

/**
 * Phase 5: Beatgrid data for quantize and sync features
 * Stores detected beat positions and tempo information
 */
export interface BeatGridData {
  trackKey: string;          // Primary key (normalized track identifier)
  bpm: number;               // Detected tempo
  confidence: number;        // Detection confidence (0-1)
  firstBeatOffset: number;   // Seconds from start to first downbeat
  timeSignature: string;     // e.g., "4/4", "3/4" (stored as string for Dexie)
  beatsJson: string;         // JSON-serialized beat markers array
  detectedAt: number;        // Unix timestamp of detection
  analysisVersion: string;   // Algorithm version for cache invalidation
}

/**
 * Phase V3: AcoustID-verified metadata intelligence
 * Stores verified track info from the AcoustID fingerprinting service
 */
export interface AcoustIDMetadata {
  trackId: string;            // Primary key — matches TrackInsights.trackId
  verifiedTitle: string;      // Title from AcoustID
  verifiedArtist: string;     // Artist from AcoustID
  acoustid_id: string;        // AcoustID fingerprint ID
  confidenceScore: number;    // Match confidence (0.0 to 1.0)
  verifiedAt: number;         // Timestamp of verification
}

/**
 * Studio database class
 * Uses Dexie for IndexedDB with TypeScript support
 */
export class StudioDatabase extends Dexie {
  insights!: EntityTable<TrackInsights, 'trackId'>;
  beatgrids!: EntityTable<BeatGridData, 'trackKey'>;
  metadata!: EntityTable<AcoustIDMetadata, 'trackId'>;

  constructor() {
    super('pikoStudio');

    // Version 1: Initial schema
    this.version(1).stores({
      insights: 'trackId, key, bpm, energy, analyzedAt',
    });

    // Version 2: Phase 5 - Beatgrid storage for quantize and sync
    this.version(2).stores({
      insights: 'trackId, key, bpm, energy, analyzedAt',
      beatgrids: 'trackKey, bpm, confidence, detectedAt',
    });

    // Version 3: Phase V3 - AcoustID metadata intelligence
    this.version(3).stores({
      insights: 'trackId, key, bpm, energy, analyzedAt',
      beatgrids: 'trackKey, bpm, confidence, detectedAt',
      metadata: 'trackId, acoustid_id, confidenceScore, verifiedAt',
    });
  }
}

// Singleton instance
export const studioDb = new StudioDatabase();

// --- Helper Functions ---

/**
 * Get insights for a specific track
 * @param trackId Unique track identifier
 * @returns Track insights or undefined if not found
 */
export async function getInsights(trackId: string): Promise<TrackInsights | undefined> {
  try {
    return await studioDb.insights.get(trackId);
  } catch (error) {
    console.error('[StudioDB] Failed to get insights:', error);
    return undefined;
  }
}

/**
 * Save or update track insights
 * @param insights Track insights to save
 */
export async function saveInsights(insights: TrackInsights): Promise<void> {
  try {
    await studioDb.insights.put(insights);
  } catch (error) {
    console.error('[StudioDB] Failed to save insights:', error);
    throw error;
  }
}

/**
 * Get all insights (for library display)
 * @param limit Optional limit on results
 * @returns Array of track insights
 */
export async function getAllInsights(limit?: number): Promise<TrackInsights[]> {
  try {
    const query = studioDb.insights.toArray();
    if (limit) {
      return (await query).slice(0, limit);
    }
    return await query;
  } catch (error) {
    console.error('[StudioDB] Failed to get all insights:', error);
    return [];
  }
}

/**
 * Get insights by energy range (for match suggestions)
 * @param minEnergy Minimum energy (0.0-1.0)
 * @param maxEnergy Maximum energy (0.0-1.0)
 * @returns Tracks within energy range
 */
export async function getInsightsByEnergy(
  minEnergy: number,
  maxEnergy: number
): Promise<TrackInsights[]> {
  try {
    return await studioDb.insights
      .where('energy')
      .between(minEnergy, maxEnergy, true, true)
      .toArray();
  } catch (error) {
    console.error('[StudioDB] Failed to get insights by energy:', error);
    return [];
  }
}

/**
 * Get insights by key (for harmonic mixing)
 * @param key Musical key (e.g., "Am", "C major")
 * @returns Tracks in the same key
 */
export async function getInsightsByKey(key: string): Promise<TrackInsights[]> {
  try {
    return await studioDb.insights
      .where('key')
      .equals(key)
      .toArray();
  } catch (error) {
    console.error('[StudioDB] Failed to get insights by key:', error);
    return [];
  }
}

/**
 * Delete insights for a track
 * @param trackId Track identifier
 */
export async function deleteInsights(trackId: string): Promise<void> {
  try {
    await studioDb.insights.delete(trackId);
  } catch (error) {
    console.error('[StudioDB] Failed to delete insights:', error);
    throw error;
  }
}

/**
 * Clear all insights (for testing or reset)
 */
export async function clearAllInsights(): Promise<void> {
  try {
    await studioDb.insights.clear();
    console.log('[StudioDB] Cleared all insights');
  } catch (error) {
    console.error('[StudioDB] Failed to clear insights:', error);
    throw error;
  }
}

/**
 * Get database statistics
 * @returns Count of total insights and failed analyses
 */
export async function getInsightsStats(): Promise<{
  total: number;
  failed: number;
  analyzed: number;
}> {
  try {
    const all = await studioDb.insights.toArray();
    const failed = all.filter(i => i.failed).length;
    const analyzed = all.filter(i => !i.failed && i.bpm !== null).length;

    return {
      total: all.length,
      failed,
      analyzed,
    };
  } catch (error) {
    console.error('[StudioDB] Failed to get stats:', error);
    return { total: 0, failed: 0, analyzed: 0 };
  }
}

// --- Phase 5: Beatgrid Functions ---

/**
 * Get beatgrid for a specific track
 * @param trackKey Normalized track identifier
 * @returns Beatgrid data or undefined if not found
 */
export async function getBeatGrid(trackKey: string): Promise<BeatGridData | undefined> {
  try {
    return await studioDb.beatgrids.get(trackKey);
  } catch (error) {
    console.error('[StudioDB] Failed to get beatgrid:', error);
    return undefined;
  }
}

/**
 * Save or update beatgrid data
 * @param beatGrid Beatgrid data to save
 */
export async function saveBeatGrid(beatGrid: BeatGridData): Promise<void> {
  try {
    await studioDb.beatgrids.put(beatGrid);
  } catch (error) {
    console.error('[StudioDB] Failed to save beatgrid:', error);
    throw error;
  }
}

/**
 * Get beatgrids by BPM range (for tempo matching)
 * @param minBPM Minimum BPM
 * @param maxBPM Maximum BPM
 * @returns Beatgrids within BPM range
 */
export async function getBeatGridsByBPM(
  minBPM: number,
  maxBPM: number
): Promise<BeatGridData[]> {
  try {
    return await studioDb.beatgrids
      .where('bpm')
      .between(minBPM, maxBPM, true, true)
      .toArray();
  } catch (error) {
    console.error('[StudioDB] Failed to get beatgrids by BPM:', error);
    return [];
  }
}

/**
 * Delete beatgrid for a track
 * @param trackKey Normalized track identifier
 */
export async function deleteBeatGrid(trackKey: string): Promise<void> {
  try {
    await studioDb.beatgrids.delete(trackKey);
  } catch (error) {
    console.error('[StudioDB] Failed to delete beatgrid:', error);
    throw error;
  }
}

/**
 * Clear all beatgrids (for testing or reset)
 */
export async function clearAllBeatGrids(): Promise<void> {
  try {
    await studioDb.beatgrids.clear();
    console.log('[StudioDB] Cleared all beatgrids');
  } catch (error) {
    console.error('[StudioDB] Failed to clear beatgrids:', error);
    throw error;
  }
}

/**
 * Phase 2: Bulk save match scores for library sorting
 * @param scores Array of { trackId, matchScore, matchBadge }
 */
export async function bulkSaveMatchScores(
  scores: Array<{ trackId: string; matchScore: number; matchBadge: string | null }>
): Promise<void> {
  try {
    await studioDb.transaction('rw', studioDb.insights, async () => {
      for (const { trackId, matchScore, matchBadge } of scores) {
        const existing = await studioDb.insights.get(trackId);
        if (existing) {
          await studioDb.insights.update(trackId, {
            cachedMatchScore: matchScore,
            cachedMatchBadge: matchBadge ?? undefined,
          });
        }
      }
    });
  } catch (error) {
    console.error('[StudioDB] Failed to bulk save match scores:', error);
  }
}

/**
 * Phase V3: Metadata Intelligence Functions
 */

export async function getVerifiedMetadata(trackId: string): Promise<AcoustIDMetadata | undefined> {
  try {
    return await studioDb.metadata.get(trackId);
  } catch (error) {
    console.error('[StudioDB] Failed to get metadata:', error);
    return undefined;
  }
}

export async function saveVerifiedMetadata(metadata: AcoustIDMetadata): Promise<void> {
  try {
    await studioDb.metadata.put(metadata);
  } catch (error) {
    console.error('[StudioDB] Failed to save metadata:', error);
    throw error;
  }
}

