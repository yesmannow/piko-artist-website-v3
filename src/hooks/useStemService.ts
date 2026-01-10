"use client";

import { useState, useEffect, useCallback } from 'react';
import { getStemService, type SeparationProgress, type SeparatedStems, type StemWorkerConfig } from '@/engine/StemService';

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
          // Model source priority:
          // 1. NEXT_PUBLIC_MODEL_URL env var (if set)
          //    - If same-origin path (/models/...), use directly
          //    - If external http(s) URL, route through /api/model proxy
          // 2. Fallback to local /models/demucs_v4_quantized.onnx

          const modelUrl: string | undefined = process.env.NEXT_PUBLIC_MODEL_URL || undefined;
          let finalUrl: string;
          let source: string;

          if (modelUrl) {
            // Check if it's a same-origin path (starts with /)
            if (modelUrl.startsWith('/')) {
              // Same-origin path: use directly
              finalUrl = modelUrl;
              source = 'local path';
            } else if (modelUrl.startsWith('http://') || modelUrl.startsWith('https://')) {
              // External URL: route through same-origin proxy to avoid COEP/CORS issues
              // Encode the URL as query parameter
              const encodedUrl = encodeURIComponent(modelUrl);
              finalUrl = `/api/model?url=${encodedUrl}`;
              source = 'external (proxied)';
            } else {
              // Invalid format, fallback to default
              console.warn('[useStemService] Invalid model URL format, using default');
              finalUrl = '/models/demucs_v4_quantized.onnx';
              source = 'default fallback';
            }
          } else {
            // No env var: use default local path
            finalUrl = '/models/demucs_v4_quantized.onnx';
            source = 'default local';
          }

          // Log which source is being used (dev-only, helps with debugging)
          if (process.env.NODE_ENV === 'development') {
            console.log(`[useStemService] Model source: ${source}`);
            console.log(`[useStemService] Final model URL: ${finalUrl}`);
          }

          const config: StemWorkerConfig | undefined = finalUrl
            ? { modelUrl: finalUrl }
            : undefined;

          await service.initialize(config);
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
