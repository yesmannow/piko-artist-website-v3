"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export type { SeparatedStems };
import { useStudioMonitor } from "@/components/ui/StudioMonitor";

interface SeparatedStems {
  vocals: AudioBuffer;
  drums: AudioBuffer;
  bass: AudioBuffer;
  other: AudioBuffer;
}

/**
 * useSignalCracker - Hook for WASM-based AI stem separation
 *
 * Manages the Web Worker that processes audio files using WebAssembly
 * to isolate stems (vocals, drums, bass, other) in real-time.
 *
 * Features:
 * - Background processing via Web Worker
 * - Real-time progress updates to StudioMonitor
 * - Zero-latency WASM inference
 * - Professional studio operation telemetry
 */
export function useSignalCracker() {
  const workerRef = useRef<Worker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { addLog } = useStudioMonitor();

  // Initialize worker
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const worker = new Worker("/worklets/v3-separator-worker.js");
      workerRef.current = worker;

      // Handle worker messages
      worker.onmessage = (event) => {
        const { type, message, progress: msgProgress } = event.data;

        switch (type) {
          case "READY":
            addLog(message);
            break;

          case "STATUS":
            if (message) {
              addLog(message);
            }
            break;

          case "PROGRESS":
            if (msgProgress !== undefined) {
              setProgress(msgProgress);
            }
            if (message) {
              addLog(message);
            }
            break;

          case "COMPLETE":
            setIsProcessing(false);
            setProgress(100);
            if (message) {
              addLog(message);
            }
            break;

          case "ERROR":
            setIsProcessing(false);
            setProgress(0);
            if (message) {
              addLog(message);
            }
            break;
        }
      };

      worker.onerror = (error) => {
        console.error("[useSignalCracker] Worker error:", error);
        addLog(`STUDIO_CORE: Worker error - ${error.message}`);
        setIsProcessing(false);
        setProgress(0);
      };
    } catch (error) {
      console.error("[useSignalCracker] Failed to create worker:", error);
      addLog(`STUDIO_CORE: Failed to initialize signal cracker worker`);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [addLog]);

  /**
   * Process audio file for stem separation
   */
  const processAudio = useCallback(
    async (audioBuffer: AudioBuffer): Promise<SeparatedStems | null> => {
      if (!workerRef.current || isProcessing) {
        return null;
      }

      setIsProcessing(true);
      setProgress(0);

      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error("Worker not initialized"));
          return;
        }

        // Set up one-time completion handler
        const handleComplete = (event: MessageEvent) => {
          if (event.data.type === "COMPLETE") {
            workerRef.current?.removeEventListener("message", handleComplete);
            resolve(event.data.stems);
          } else if (event.data.type === "ERROR") {
            workerRef.current?.removeEventListener("message", handleComplete);
            reject(new Error(event.data.message));
          }
        };

        workerRef.current.addEventListener("message", handleComplete);

        // Send audio data to worker using Zero-Copy Transfer
        // OPTIMIZATION: Use Transferable objects to move ownership instead of copying
        // This prevents doubling RAM usage (critical for 50MB+ audio files)
        const channelData = audioBuffer.getChannelData(0); // Mono for now
        const audioData = new Float32Array(channelData);

        // Zero-copy transfer: Pass buffer in transfer list to move ownership
        // After this call, audioData.buffer is detached and cannot be used in main thread
        // The worker now owns the memory, preventing duplication
        workerRef.current.postMessage(
          {
            type: "PROCESS_AUDIO",
            data: {
              audioBuffer: audioData.buffer,
              sampleRate: audioBuffer.sampleRate,
              numberOfChannels: audioBuffer.numberOfChannels,
              length: audioBuffer.length,
            },
          },
          [audioData.buffer] // Transfer list: moves ownership, zero-copy
        );
      });
    },
    [isProcessing]
  );

  /**
   * Cancel current processing
   */
  const cancel = useCallback(() => {
    if (workerRef.current && isProcessing) {
      workerRef.current.postMessage({ type: "CANCEL" });
      setIsProcessing(false);
      setProgress(0);
    }
  }, [isProcessing]);

  // Expose separated stems state
  const [separatedStems, setSeparatedStems] = useState<SeparatedStems | null>(null);

  // Update stems when processing completes - listen to all worker messages
  useEffect(() => {
    if (!workerRef.current) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "COMPLETE" && event.data.stems) {
        setSeparatedStems(event.data.stems);
      }
    };

    workerRef.current.addEventListener("message", handleMessage);

    return () => {
      workerRef.current?.removeEventListener("message", handleMessage);
    };
  }, []);

  return {
    processAudio,
    cancel,
    isProcessing,
    progress,
    separatedStems,
  };
}

