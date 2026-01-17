"use client";

import { useState, useCallback } from "react";
import {
  getKeyService,
  type KeyAnalysisResult,
} from "@/engine/rt/analysis/KeyService";

/**
 * useKey - React hook for key detection
 *
 * Phase 9C: Provides key analysis state and methods
 */
export function useKey() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [keyData, setKeyData] = useState<KeyAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (
      audioBuffer: AudioBuffer,
      cacheKey?: string,
    ): Promise<KeyAnalysisResult> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const keyService = getKeyService();

        // Ensure service is initialized
        if (keyService.state === "uninitialized") {
          await keyService.initialize();
        }

        const result = await keyService.analyzeKey(audioBuffer, cacheKey);
        setKeyData(result);

        if (!result.available && result.error) {
          setError(result.error);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Key analysis failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [],
  );

  const getCached = useCallback(
    (cacheKey: string): KeyAnalysisResult | null => {
      const keyService = getKeyService();
      return keyService.getCached(cacheKey);
    },
    [],
  );

  return {
    isAnalyzing,
    keyData,
    error,
    analyze,
    getCached,
  };
}
