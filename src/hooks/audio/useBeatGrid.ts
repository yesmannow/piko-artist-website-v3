/**
 * Phase 5 Batch 2: useBeatGrid Hook
 *
 * Manages beatgrid detection and storage for a deck.
 * Auto-detects beatgrid when track loads, stores in Dexie.
 *
 * Features:
 * - Auto-detection on track load
 * - Dexie persistence with trackKey
 * - Cache invalidation based on analysis version
 * - Loading and error states
 * - Manual re-analysis trigger
 *
 * Architecture:
 * - Uses Tone.js Player for audio analysis
 * - trackKey normalization for storage
 * - Background analysis (non-blocking)
 */

import { useState, useEffect, useCallback } from "react";
import { detectBeatGrid } from "@/lib/audio/beatDetection";
import type { BeatGridData } from "@/lib/audio/beatDetection";
import { getBeatGrid, saveBeatGrid } from "@/db/studioDb";
import { deriveTrackKey } from "@/lib/trackKey";
import type { Track } from "@/lib/db";

interface UseBeatGridReturn {
  beatGrid: BeatGridData | null;
  isLoading: boolean;
  error: string | null;
  detect: () => Promise<void>;
  confidence: number;
}

/**
 * Hook to manage beatgrid detection and storage for a deck
 *
 * @param trackData Current track data
 * @param player Tone.Player instance (optional, for auto-detection)
 * @returns Beatgrid data, loading state, and detection function
 */
export function useBeatGrid(
  trackData: Track | null,
  player: unknown // Tone.Player (using unknown to avoid Tone import in hook)
): UseBeatGridReturn {
  const [beatGrid, setBeatGrid] = useState<BeatGridData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackKey = trackData ? deriveTrackKey(trackData) : null;

  /**
   * Detect beatgrid for current track
   */
  const detect = useCallback(async () => {
    if (!trackData || !trackKey) {
      setError("No track loaded");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Detect beatgrid using audio source
      const detectedGrid = await detectBeatGrid(
        trackData.url || "",
        {
          url: trackData.url,
          title: trackData.title,
        }
      );

      // Save to Dexie (convert beats array to JSON string and timeSignature to string)
      await saveBeatGrid({
        trackKey: detectedGrid.trackKey,
        bpm: detectedGrid.bpm,
        confidence: detectedGrid.confidence,
        firstBeatOffset: detectedGrid.firstBeatOffset,
        timeSignature: `${detectedGrid.timeSignature[0]}/${detectedGrid.timeSignature[1]}`,
        beatsJson: JSON.stringify(detectedGrid.beats),
        detectedAt: detectedGrid.detectedAt,
        analysisVersion: detectedGrid.analysisVersion,
      });

      // Update state with original beats array
      setBeatGrid(detectedGrid);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Detection failed";
      setError(errorMessage);
      console.error("[useBeatGrid] Detection error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [trackData, trackKey]);

  /**
   * Load beatgrid from cache on track change
   */
  useEffect(() => {
    if (!trackKey) {
      setBeatGrid(null);
      return;
    }

    let cancelled = false;

    const loadBeatGrid = async () => {
      try {
        const cached = await getBeatGrid(trackKey);

        if (cancelled) return;

        if (cached) {
          // Deserialize beats array from JSON and parse timeSignature
          const beatsArray = JSON.parse(cached.beatsJson);
          const [beats, unit] = cached.timeSignature.split('/').map(Number);
          setBeatGrid({
            trackKey: cached.trackKey,
            bpm: cached.bpm,
            confidence: cached.confidence,
            firstBeatOffset: cached.firstBeatOffset,
            timeSignature: [beats, unit],
            beats: beatsArray,
            detectedAt: cached.detectedAt,
            analysisVersion: cached.analysisVersion,
          });
          setError(null);
        } else if (player) {
          // No cached beatgrid, trigger auto-detection only if player available
          detect();
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[useBeatGrid] Load error:", err);
          setError("Failed to load beatgrid");
        }
      }
    };

    loadBeatGrid();

    return () => {
      cancelled = true;
    };
  }, [trackKey, player, detect]);

  return {
    beatGrid,
    isLoading,
    error,
    detect,
    confidence: beatGrid?.confidence ?? 0,
  };
}
