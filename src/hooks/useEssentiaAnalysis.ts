"use client";

/**
 * useEssentiaAnalysis Hook
 *
 * Manages Essentia.js worker lifecycle and provides analysis function
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface AnalysisResult {
  bpm: number;
  key: string;
  energy: number;
  danceability?: number;
  scale?: string;
  beatGrid?: number[];
}

interface UseEssentiaAnalysisReturn {
  analyzeTrack: (audioBuffer: AudioBuffer, trackId: string) => Promise<AnalysisResult | null>;
  isAnalyzing: boolean;
  error: string | null;
}

export function useEssentiaAnalysis(): UseEssentiaAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Initialize worker
  useEffect(() => {
    if (typeof globalThis.window === 'undefined') return;

    const initWorker = async () => {
      try {
        const worker = new Worker(
          new URL('../workers/essentia.worker.ts', import.meta.url),
          { type: 'module' }
        );

        workerRef.current = worker;

        // Handle worker errors
        worker.onerror = (e) => {
          console.error('[useEssentiaAnalysis] Worker error:', e);
          setError('Worker error occurred');
          setIsAnalyzing(false);
        };
      } catch (err) {
        console.error('[useEssentiaAnalysis] Failed to create worker:', err);
        setError('Failed to initialize analysis worker');
      }
    };

    void initWorker();

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const analyzeTrack = useCallback(
    async (audioBuffer: AudioBuffer, trackId: string): Promise<AnalysisResult | null> => {
      if (!workerRef.current) {
        setError('Worker not initialized');
        return null;
      }

      setIsAnalyzing(true);
      setError(null);

      return new Promise((resolve) => {
        const worker = workerRef.current!;

        // Handle response
        const handleMessage = (e: MessageEvent) => {
          if (e.data.trackId === trackId) {
            worker.removeEventListener('message', handleMessage);
            setIsAnalyzing(false);

            if (e.data.error) {
              setError(e.data.error);
              resolve(null);
            } else {
              resolve({
                bpm: e.data.bpm,
                key: e.data.key,
                energy: e.data.energy,
                danceability: e.data.danceability,
              });
            }
          }
        };

        worker.addEventListener('message', handleMessage);

        // Extract channel data and send to worker
        // We can't transfer AudioBuffer directly, so extract Float32Array
        const channelData = audioBuffer.getChannelData(0);

        worker.postMessage({
          audioBuffer: channelData, // Send Float32Array instead
          trackId,
          sampleRate: audioBuffer.sampleRate,
        }, [channelData.buffer]); // Transfer ownership for performance

        // Timeout after 30 seconds
        setTimeout(() => {
          worker.removeEventListener('message', handleMessage);
          setIsAnalyzing(false);
          setError('Analysis timeout');
          resolve(null);
        }, 30000);
      });
    },
    []
  );

  return {
    analyzeTrack,
    isAnalyzing,
    error,
  };
}
