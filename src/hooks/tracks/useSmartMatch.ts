/**
 * Phase 2: Smart Match Hook
 *
 * Computes real-time match scores for each library track against the active deck.
 * Uses the existing calculateMatchScore() engine from matchScoring.ts.
 *
 * Returns enriched tracks with matchScore, matchBadge, matchTooltip, matchPercent.
 */

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useStore } from '@/store/useStore';
import { studioDb, type TrackInsights } from '@/db/studioDb';
import { calculateMatchScore, type MatchBadge } from '@/features/insights/matchScoring';
import type { Track } from '@/lib/db';

// Library listing type: extends the core Track with Intelligence-feature identifiers
// (trackKey = canonical slug, trackId = string alias used by the insights store)
interface TrackListingInterface extends Track {
  trackKey?: string;
  trackId?: string;
}

export interface SmartMatchResult {
  matchScore: number;       // 0.0–1.0
  matchPercent: number;     // 0–100 (integer)
  matchBadge: MatchBadge;
  matchTooltip: string;
}

/**
 * Extract Camelot key from key string like "C major (8B)" → "8B"
 * or pass through raw keys like "Am", "C major"
 */
function extractKeyForScoring(key: string | undefined | null): string | null {
  if (!key) return null;
  // Try to extract Camelot notation first
  const camelotMatch = key.match(/\(([0-9]{1,2}[AB])\)/);
  if (camelotMatch) {
    // We have Camelot notation, but matchScoring expects standard notation
    // Extract the human-readable part before the parentheses
    const humanPart = key.replace(/\s*\([^)]*\)\s*$/, '').trim();
    return humanPart || key;
  }
  return key;
}

/**
 * Build TrackInsights from deck state for scoring
 */
function buildDeckInsights(deck: {
  trackData: {
    bpm: number;
    key?: string;
    energy?: number;
    trackKey?: string;
  } | null;
}): TrackInsights | null {
  if (!deck.trackData) return null;

  return {
    trackId: deck.trackData.trackKey || 'active-deck',
    bpm: deck.trackData.bpm || null,
    key: extractKeyForScoring(deck.trackData.key),
    energy: deck.trackData.energy ?? null,
    analyzedAt: Date.now(),
    algoVersion: 1,
  };
}

/**
 * useSmartMatch — real-time match scoring for library tracks
 *
 * @param tracks - Library tracks to score
 * @returns Tracks enriched with match data, plus the active deck insights
 */
export function useSmartMatch(tracks: TrackListingInterface[]) {
  const deckA = useStore((state) => state.deckA);
  const deckB = useStore((state) => state.deckB);

  // Get all cached insights from IndexedDB
  const allInsights = useLiveQuery(
    () => studioDb.insights.toArray(),
    []
  );

  // Build insights map for fast lookup
  const insightsMap = useMemo(() => {
    const map = new Map<string, TrackInsights>();
    if (allInsights) {
      for (const insight of allInsights) {
        map.set(insight.trackId, insight);
      }
    }
    return map;
  }, [allInsights]);

  // Determine active deck (whichever is playing, prefer A)
  const activeDeckInsights = useMemo(() => {
    if (deckA.isPlaying && deckA.trackData) return buildDeckInsights(deckA);
    if (deckB.isPlaying && deckB.trackData) return buildDeckInsights(deckB);
    // If neither playing, use whichever has track data loaded
    if (deckA.trackData) return buildDeckInsights(deckA);
    if (deckB.trackData) return buildDeckInsights(deckB);
    return null;
  }, [deckA, deckB]);

  // Compute match scores for all tracks
  const tracksWithMatch = useMemo(() => {
    if (!activeDeckInsights) {
      // No active deck — return tracks without match data
      return tracks.map(track => ({
        ...track,
        matchScore: undefined as number | undefined,
        matchPercent: undefined as number | undefined,
        matchBadge: undefined as MatchBadge | undefined,
        matchTooltip: undefined as string | undefined,
      }));
    }

    return tracks.map(track => {
      // Build candidate insights from the track
      // First check studioDb insights cache
      const cachedInsights = insightsMap.get(track.trackKey ?? '') || insightsMap.get(track.trackId ?? '');

      const candidateInsights: TrackInsights = cachedInsights || {
        trackId: track.trackKey || track.trackId || String(track.id ?? ''),
        bpm: track.bpm ? Number(track.bpm) : null,
        key: extractKeyForScoring(track.key),
        energy: track.energy ? Number(track.energy) : null,
        analyzedAt: 0,
        algoVersion: 1,
      };

      // If we have inline data but no cached insights, use inline data
      if (!cachedInsights) {
        candidateInsights.bpm = track.bpm ? Number(track.bpm) : null;
        candidateInsights.key = extractKeyForScoring(track.key);
        candidateInsights.energy = track.energy ? Number(track.energy) : null;
      }

      const result = calculateMatchScore(activeDeckInsights, candidateInsights);

      return {
        ...track,
        matchScore: result.score,
        matchPercent: Math.round(result.score * 100),
        matchBadge: result.badge,
        matchTooltip: result.tooltip,
        // Also set isCompatible for backward compat with existing styling
        isCompatible: result.badge === 'PERFECT',
      };
    });
  }, [tracks, activeDeckInsights, insightsMap]);

  return {
    tracksWithMatch,
    activeDeckInsights,
    hasActiveDeck: activeDeckInsights !== null,
  };
}
