"use client";

import { useState, useEffect, useMemo } from "react";
import { useKey } from "./useKey";
import { getKeyService } from "@/engine/rt/analysis/KeyService";
import { areKeysCompatible, compatibleKeys } from "@/utils/camelot";
import type { KeyAnalysisResult } from "@/engine/rt/analysis/KeyService";

/**
 * useTrackKey - Hook for track key data and compatibility
 *
 * Phase 9C: Provides key data for a track and compatibility checking
 */
export function useTrackKey(trackUrl: string | null, cacheKey?: string) {
  const { keyData, analyze, isAnalyzing } = useKey();
  const [localKeyData, setLocalKeyData] = useState<KeyAnalysisResult | null>(
    null,
  );

  // Get cached key if available
  useEffect(() => {
    if (cacheKey && trackUrl) {
      const keyService = getKeyService();
      const cached = keyService.getCached(cacheKey);
      if (cached) {
        setLocalKeyData(cached);
      }
    }
  }, [cacheKey, trackUrl]);

  // Use provided keyData or local cached data
  const trackKey = keyData || localKeyData;

  return {
    keyData: trackKey,
    isAnalyzing,
    analyze,
  };
}

/**
 * useKeyCompatibility - Hook for checking key compatibility
 *
 * Returns compatibility status for tracks relative to a reference key
 */
export function useKeyCompatibility(
  trackKey: string | null,
  referenceKey: string | null,
) {
  const isCompatible = useMemo(() => {
    if (!trackKey || !referenceKey) {
      return false;
    }
    return areKeysCompatible(trackKey, referenceKey);
  }, [trackKey, referenceKey]);

  const compatibleKeysList = useMemo(() => {
    if (!referenceKey) {
      return [];
    }
    return compatibleKeys(referenceKey);
  }, [referenceKey]);

  return {
    isCompatible,
    compatibleKeys: compatibleKeysList,
  };
}
