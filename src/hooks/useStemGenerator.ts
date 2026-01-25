"use client";

/**
 * useStemGenerator Hook
 * 
 * Manages stem generation state and polling logic for AudioShake
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { requestStems, checkStatus } from '@/lib/audioshake';

interface StemUrls {
  vocals: string;
  drums: string;
  bass: string;
  other: string;
}

interface UseStemGeneratorReturn {
  generateStems: (trackUrl: string, trackId: string) => Promise<StemUrls | null>;
  isProcessing: boolean;
  progress: number; // 0-100
  error: string | null;
  cancel: () => void;
  isConfigured: boolean;
}

export function useStemGenerator(): UseStemGeneratorReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(() => {
    // Prefer public env at build time; fall back to private if exposed; treat placeholder as not configured
    const key = process.env.NEXT_PUBLIC_AUDIOSHAKE_API_KEY || process.env.AUDIOSHAKE_API_KEY;
    return Boolean(key && key !== 'your_audioshake_key' && key !== 'CHANGEME_AUDIOSHAKE_API_KEY');
  });
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cancelledRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsProcessing(false);
    setProgress(0);
  }, []);

  const generateStems = useCallback(
    async (trackUrl: string, trackId: string): Promise<StemUrls | null> => {
      if (!isConfigured) {
        setError('AudioShake API key not configured. Please add AUDIOSHAKE_API_KEY to your .env.local file.');
        return null;
      }

      cancelledRef.current = false;
      setIsProcessing(true);
      setProgress(0);
      setError(null);

      try {
        // Request stem separation
        const taskId = await requestStems(trackUrl, trackId);
        setProgress(10);

        // Poll for status
        return new Promise((resolve) => {
          let pollCount = 0;
          const maxPolls = 120; // 10 minutes max (120 * 5 seconds)

          pollingIntervalRef.current = setInterval(async () => {
            if (cancelledRef.current) {
              clearInterval(pollingIntervalRef.current!);
              pollingIntervalRef.current = null;
              setIsProcessing(false);
              setProgress(0);
              resolve(null);
              return;
            }

            pollCount++;
            const progressPercent = Math.min(10 + (pollCount / maxPolls) * 80, 90);
            setProgress(progressPercent);

            try {
              const status = await checkStatus(taskId);

              if (status.status === 'completed' && status.stems) {
                clearInterval(pollingIntervalRef.current!);
                pollingIntervalRef.current = null;
                setIsProcessing(false);
                setProgress(100);

                // Verify all stems are available
                const { vocals, drums, bass, other } = status.stems;
                if (vocals && drums && bass && other) {
                  resolve({
                    vocals,
                    drums,
                    bass,
                    other,
                  });
                } else {
                  setError('Some stems are missing');
                  resolve(null);
                }
              } else if (status.status === 'failed') {
                clearInterval(pollingIntervalRef.current!);
                pollingIntervalRef.current = null;
                setIsProcessing(false);
                setProgress(0);
                setError('Stem separation failed');
                resolve(null);
              } else if (pollCount >= maxPolls) {
                clearInterval(pollingIntervalRef.current!);
                pollingIntervalRef.current = null;
                setIsProcessing(false);
                setProgress(0);
                setError('Stem separation timeout');
                resolve(null);
              }
            } catch (statusError) {
              console.error('[useStemGenerator] Status check error:', statusError);
              // Continue polling on error
            }
          }, 5000); // Poll every 5 seconds
        });
      } catch (err) {
        setIsProcessing(false);
        setProgress(0);
        const errorMessage = err instanceof Error ? err.message : 'Failed to request stems';
        
        // Check if it's a configuration error
        if (errorMessage.includes('not configured') || errorMessage.includes('AUDIOSHAKE_API_KEY')) {
          setIsConfigured(false);
          setError('AudioShake API key not configured. Please add AUDIOSHAKE_API_KEY to your .env.local file.');
        } else {
          setError(errorMessage);
        }
        
        return null;
      }
    },
    [isConfigured]
  );

  return {
    generateStems,
    isProcessing,
    progress,
    error,
    cancel,
    isConfigured,
  };
}
