"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getBeatGridService,
  type BeatGridData,
} from "@/engine/BeatGridService";

/**
 * useBeatGrid - React hook for beat grid analysis
 *
 * Phase 9A: Wraps BeatGridService for React components
 *
 * Features:
 * - Automatic service initialization
 * - Beat grid analysis for audio buffers
 * - Caching support
 */
export function useBeatGrid() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [beatGridData, setBeatGridData] = useState<BeatGridData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize service on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const initService = async () => {
      try {
        const service = getBeatGridService();
        if (service.state === "uninitialized") {
          await service.initialize();
        }
        setIsInitialized(true);
      } catch (err) {
        console.error("[useBeatGrid] Failed to initialize:", err);
        setError(err instanceof Error ? err.message : "Initialization failed");
      }
    };

    initService();
  }, []);

  /**
   * Analyze beat grid for an audio buffer
   */
  const analyze = useCallback(
    async (audioBuffer: AudioBuffer, cacheKey?: string) => {
      if (!isInitialized) {
        throw new Error("BeatGridService not initialized");
      }

      setIsAnalyzing(true);
      setError(null);

      try {
        const service = getBeatGridService();
        const result = await service.analyze(audioBuffer, cacheKey);

        setBeatGridData(result);
        setIsAnalyzing(false);
        return result;
      } catch (err) {
        setIsAnalyzing(false);
        const errorMessage =
          err instanceof Error ? err.message : "Analysis failed";
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized],
  );

  /**
   * Get cached beat grid data
   */
  const getCached = useCallback((cacheKey: string) => {
    const service = getBeatGridService();
    const cached = service.getCached(cacheKey);
    if (cached) {
      setBeatGridData(cached);
    }
    return cached;
  }, []);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    const service = getBeatGridService();
    service.clearCache();
    setBeatGridData(null);
  }, []);

  return {
    isInitialized,
    isAnalyzing,
    beatGridData,
    error,
    analyze,
    getCached,
    clearCache,
  };
}
