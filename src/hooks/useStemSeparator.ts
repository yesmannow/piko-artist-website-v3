"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAudioStore } from "@/stores/useAudioStore";
import { hasSufficientComputePower } from "@/utils/deviceDetection";

export interface StemBuffers {
  vocals: AudioBuffer | null;
  drums: AudioBuffer | null;
  bass: AudioBuffer | null;
  other: AudioBuffer | null;
}

export interface StemSeparatorState {
  isProcessing: boolean;
  isReady: boolean;
  error: string | null;
  stems: StemBuffers;
}

/**
 * useStemSeparator - Hook for AI-powered stem separation
 *
 * Uses Sherpa-ONNX in a Web Worker to separate audio into:
 * - Vocals
 * - Drums
 * - Bass
 * - Other
 *
 * This runs in a separate thread to prevent UI freezing during
 * computationally intensive neural network inference.
 *
 * @returns {Object} - Stem separation utilities and state
 */
export function useStemSeparator() {
  const { audioContext: _audioContext } = useAudioStore();
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<StemSeparatorState>({
    isProcessing: false,
    isReady: false,
    error: null,
    stems: {
      vocals: null,
      drums: null,
      bass: null,
      other: null,
    },
  });

  // Check device capability
  const canProcess = hasSufficientComputePower();

  /**
   * Initialize the stem separation worker
   */
  const initialize = useCallback(async () => {
    if (!canProcess) {
      setState((prev) => ({
        ...prev,
        error: "SYSTEM_ERROR: INSUFFICIENT_COMPUTE_POWER",
      }));
      return;
    }

    if (workerRef.current) {
      return; // Already initialized
    }

    try {
      // Create Web Worker
      const worker = new Worker("/workers/stem-worker.js");
      workerRef.current = worker;

      // Handle worker messages
      worker.onmessage = (e) => {
        const { type, data, error } = e.data;

        switch (type) {
          case "INIT_SUCCESS":
            setState((prev) => ({ ...prev, isReady: true, error: null }));
            break;

          case "SEPARATE_SUCCESS":
            // Convert returned data to AudioBuffers
            // TODO: Handle actual AudioBuffer conversion from worker
            setState((prev) => ({
              ...prev,
              isProcessing: false,
              stems: data.stems || prev.stems,
            }));
            break;

          case "ERROR":
            setState((prev) => ({
              ...prev,
              isProcessing: false,
              error: error || "Unknown error",
            }));
            break;
        }
      };

      worker.onerror = (error) => {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: error.message || "Worker error",
        }));
      };

      // Initialize worker
      worker.postMessage({ type: "INIT" });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialize worker",
      }));
    }
  }, [canProcess]);

  /**
   * Separate audio into stems
   *
   * @param audioBuffer - The audio buffer to separate
   */
  const separate = useCallback(
    async (audioBuffer: AudioBuffer) => {
      if (!workerRef.current || !state.isReady) {
        throw new Error("Stem separator not initialized");
      }

      if (!canProcess) {
        throw new Error("SYSTEM_ERROR: INSUFFICIENT_COMPUTE_POWER");
      }

      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      // Send audio buffer to worker
      // Note: AudioBuffer cannot be transferred directly, so we need to
      // convert it to a format the worker can process (e.g., Float32Array)
      const channelData = [];
      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        channelData.push(audioBuffer.getChannelData(i));
      }

      workerRef.current.postMessage({
        type: "SEPARATE",
        data: {
          audioBuffer: {
            sampleRate: audioBuffer.sampleRate,
            length: audioBuffer.length,
            numberOfChannels: audioBuffer.numberOfChannels,
            channelData: channelData,
          },
        },
      });
    },
    [state.isReady, canProcess],
  );

  // Initialize on mount
  useEffect(() => {
    initialize();

    return () => {
      // Cleanup worker
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "TERMINATE" });
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [initialize]);

  return {
    ...state,
    canProcess,
    separate,
    initialize,
  };
}
