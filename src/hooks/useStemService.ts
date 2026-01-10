"use client";

import { useState, useEffect, useCallback } from 'react';
import { getStemService, type SeparationProgress, type SeparatedStems } from '@/engine/StemService';

/**
 * useStemService - React hook for stem separation
 *
 * Phase 8A: Wraps StemService singleton for React components
 *
 * Features:
 * - Automatic service initialization
 * - Progress tracking
 * - Error handling
 * - Cancellation support
 */
export function useStemService() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<SeparationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stems, setStems] = useState<SeparatedStems | null>(null);

  // Initialize service on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const initService = async () => {
      try {
        const service = getStemService();
        if (service.state === 'uninitialized') {
          await service.initialize();
        }
        setIsInitialized(true);
      } catch (err) {
        console.error('[useStemService] Failed to initialize:', err);
        setError(err instanceof Error ? err.message : 'Initialization failed');
      }
    };

    initService();
  }, []);

  /**
   * Separate audio buffer into stems
   */
  const separate = useCallback(
    async (audioBuffer: AudioBuffer, cacheKey?: string) => {
      if (!isInitialized) {
        throw new Error('StemService not initialized');
      }

      setIsProcessing(true);
      setProgress({ progress: 0, stage: 'Initializing...' });
      setError(null);

      try {
        const service = getStemService();
        const result = await service.separate(
          audioBuffer,
          (progressUpdate) => {
            setProgress(progressUpdate);
          },
          cacheKey
        );

        setStems(result);
        setIsProcessing(false);
        setProgress(null);
        return result;
      } catch (err) {
        setIsProcessing(false);
        setProgress(null);

        if (err instanceof Error && err.message === 'Cancelled') {
          // User cancelled, don't set error
          return null;
        }

        const errorMessage = err instanceof Error ? err.message : 'Separation failed';
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  /**
   * Cancel current separation
   */
  const cancel = useCallback(async () => {
    try {
      const service = getStemService();
      await service.cancel();
      setIsProcessing(false);
      setProgress(null);
    } catch (err) {
      console.error('[useStemService] Cancel error:', err);
    }
  }, []);

  /**
   * Clear cached stems
   */
  const clearCache = useCallback(() => {
    const service = getStemService();
    service.clearCache();
    setStems(null);
  }, []);

  return {
    isInitialized,
    isProcessing,
    progress,
    error,
    stems,
    separate,
    cancel,
    clearCache,
  };
}
