/**
 * Phase S8: Track Insights Hook
 *
 * Manages track analysis and match scoring with automatic caching
 */

import { useCallback, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { getInsights } from '@/db/studioDb';
import { calculateMatchScore, type MatchMode } from '@/features/insights/matchScoring';
import type { TrackInsights } from '@/db/studioDb';

const INSIGHTS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_INSIGHTS === 'true';

interface UseTrackInsightsReturn {
  enabled: boolean;
  getMatchScore: (trackId: string, mode?: MatchMode) => Promise<{
    score: number;
    badge: string | null;
    tooltip: string;
  } | null>;
  getTrackInsights: (trackId: string) => Promise<TrackInsights | null>;
}

/**
 * Hook for accessing track insights and match scoring
 *
 * Features:
 * - Feature flag gating (NEXT_PUBLIC_ENABLE_INSIGHTS)
 * - Automatic caching via IndexedDB
 * - Memoized match scoring to avoid UI jank
 * - Graceful degradation when insights unavailable
 */
export function useTrackInsights(): UseTrackInsightsReturn {
  const deckA = useStore((s) => s.deckA);
  const deckB = useStore((s) => s.deckB);

  // Get insights for a specific track
  const getTrackInsights = useCallback(async (trackId: string): Promise<TrackInsights | null> => {
    if (!INSIGHTS_ENABLED) return null;

    try {
      return await getInsights(trackId);
    } catch (err) {
      console.warn('[useTrackInsights] Failed to get insights:', err);
      return null;
    }
  }, []);

  // Calculate match score against the opposite deck's playing track
  const getMatchScore = useCallback(async (
    trackId: string,
    mode: MatchMode = 'energyAware'
  ) => {
    if (!INSIGHTS_ENABLED) return null;

    try {
      // Determine which deck is the "current" reference
      const isOnDeckA = deckA.trackKey === trackId;
      const isOnDeckB = deckB.trackKey === trackId;

      let currentInsights: TrackInsights | null = null;
      let candidateInsights: TrackInsights | null = null;

      if (isOnDeckA && deckB.trackKey) {
        // Scoring for deck A against deck B
        currentInsights = await getInsights(deckB.trackKey);
        candidateInsights = await getInsights(trackId);
      } else if (isOnDeckB && deckA.trackKey) {
        // Scoring for deck B against deck A
        currentInsights = await getInsights(deckA.trackKey);
        candidateInsights = await getInsights(trackId);
      } else {
        // Not loaded on a deck, can't score
        return null;
      }

      if (!currentInsights || !candidateInsights) {
        return null;
      }

      return calculateMatchScore(currentInsights, candidateInsights, mode);
    } catch (err) {
      console.warn('[useTrackInsights] Failed to calculate match score:', err);
      return null;
    }
  }, [deckA.trackKey, deckB.trackKey]);

  return {
    enabled: INSIGHTS_ENABLED,
    getMatchScore,
    getTrackInsights,
  };
}
