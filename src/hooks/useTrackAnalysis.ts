/**
 * useTrackAnalysis.ts - Hook for Audio Analysis using Web Workers
 * 
 * Phase VI: Advanced Signal Processing
 * 
 * This hook manages the lifecycle of the Analysis Worker and provides
 * a clean interface for analyzing audio tracks. It handles:
 * - Worker initialization and termination
 * - Audio decoding using OfflineAudioContext (off main thread)
 * - Transferable Objects for zero-copy data transfer
 * - Error handling and cleanup
 */

import { useRef, useCallback, useEffect } from 'react';
import type { AnalysisResult } from '../workers/analysis.worker';

export interface UseTrackAnalysisReturn {
  analyze: (url: string) => Promise<AnalysisResult>;
  isAnalyzing: boolean;
  error: string | null;
}

/**
 * Hook for analyzing audio tracks using Essentia.js in a Web Worker
 * 
 * @returns Analysis controls and state
 */
export const useTrackAnalysis = (): UseTrackAnalysisReturn => {
  const workerRef = useRef<Worker | null>(null);
  const isAnalyzingRef = useRef(false);
  const errorRef = useRef<string | null>(null);

  /**
   * Initialize the Web Worker
   */
  const initWorker = useCallback(() => {
    if (!workerRef.current) {
      // Create worker using Next.js worker loader
      workerRef.current = new Worker(
        new URL('../workers/analysis.worker.ts', import.meta.url),
        { type: 'module' }
      );
      console.log('[useTrackAnalysis] Worker initialized');
    }
    return workerRef.current;
  }, []);

  /**
   * Terminate the Web Worker
   */
  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      console.log('[useTrackAnalysis] Worker terminated');
    }
  }, []);

  /**
   * Decode audio file to AudioBuffer using OfflineAudioContext
   * This runs off the main thread and doesn't block the UI
   * 
   * @param url - URL of the audio file to decode
   * @returns Decoded AudioBuffer
   */
  const decodeAudioFile = useCallback(async (url: string): Promise<AudioBuffer> => {
    // Fetch the audio file
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    // Use OfflineAudioContext for decoding (doesn't block main thread)
    // Create a temporary context just for decoding
    const offlineContext = new OfflineAudioContext({
      numberOfChannels: 2,
      length: 1,
      sampleRate: 44100,
    });

    // Decode the audio data
    const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer);
    
    return audioBuffer;
  }, []);

  /**
   * Convert stereo AudioBuffer to mono Float32Array
   * MIR algorithms typically work better with mono audio
   * 
   * @param audioBuffer - Decoded audio buffer
   * @returns Mono audio data as Float32Array
   */
  const convertToMono = useCallback((audioBuffer: AudioBuffer): Float32Array => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;

    // Get channel data
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

    // Create mono array by averaging channels
    const monoData = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      monoData[i] = (leftChannel[i] + rightChannel[i]) / 2;
    }

    return monoData;
  }, []);

  /**
   * Analyze an audio track
   * 
   * @param url - URL of the audio file to analyze
   * @returns Analysis results (BPM, Key, Energy)
   */
  const analyze = useCallback(async (url: string): Promise<AnalysisResult> => {
    if (isAnalyzingRef.current) {
      throw new Error('Analysis already in progress');
    }

    isAnalyzingRef.current = true;
    errorRef.current = null;

    try {
      console.log('[useTrackAnalysis] Starting analysis for:', url);

      // Initialize worker if not already done
      const worker = initWorker();

      // Decode audio file
      const audioBuffer = await decodeAudioFile(url);
      console.log('[useTrackAnalysis] Audio decoded:', {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
      });

      // Convert to mono
      const monoData = convertToMono(audioBuffer);
      console.log('[useTrackAnalysis] Converted to mono:', monoData.length, 'samples');

      // Send audio data to worker using Transferable Objects
      // This transfers ownership of the ArrayBuffer to the worker
      // with zero-copy performance (critical for large audio files)
      return new Promise<AnalysisResult>((resolve, reject) => {
        // Set up message handler for worker response
        const handleMessage = (event: MessageEvent) => {
          const { type, result, error } = event.data;

          if (type === 'result') {
            console.log('[useTrackAnalysis] Analysis complete:', result);
            worker.removeEventListener('message', handleMessage);
            isAnalyzingRef.current = false;
            resolve(result);
          } else if (type === 'error') {
            console.error('[useTrackAnalysis] Analysis error:', error);
            worker.removeEventListener('message', handleMessage);
            isAnalyzingRef.current = false;
            errorRef.current = error;
            reject(new Error(error));
          }
        };

        worker.addEventListener('message', handleMessage);

        // Send analysis request to worker
        // CRITICAL: Use Transferable Objects to avoid copying large audio buffer
        // The third parameter [monoData.buffer] transfers ownership to the worker
        worker.postMessage(
          {
            type: 'analyze',
            audioData: monoData,
            sampleRate: audioBuffer.sampleRate,
          },
          [monoData.buffer]
        );
      });
    } catch (error) {
      isAnalyzingRef.current = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errorRef.current = errorMessage;
      console.error('[useTrackAnalysis] Error during analysis:', error);
      throw error;
    }
  }, [initWorker, decodeAudioFile, convertToMono]);

  /**
   * Cleanup worker on unmount
   */
  useEffect(() => {
    return () => {
      terminateWorker();
    };
  }, [terminateWorker]);

  return {
    analyze,
    isAnalyzing: isAnalyzingRef.current,
    error: errorRef.current,
  };
};
