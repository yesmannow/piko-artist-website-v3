"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface UseMixRecorderReturn {
  isRecording: boolean;
  recordingUrl: string | null;
  recordingBlob: Blob | null;
  recordingDuration: number; // seconds
  start: () => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
  error: string | null;
}

/**
 * Hook for recording the master output of the DJ mixer.
 * Records what the listener hears (post-master FX/limiter).
 *
 * @param audioContext - The WebAudio AudioContext
 * @param masterNode - The audio node that feeds the destination (should be after limiter/FX)
 */
export function useMixRecorder(
  audioContext: AudioContext | null | undefined,
  masterNode: AudioNode | null | undefined
): UseMixRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const mediaDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const connectionRef = useRef<{ disconnect: () => void } | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Determine best supported MIME type
  const getBestMimeType = useCallback((): string | null => {
    if (typeof window === "undefined" || !window.MediaRecorder) {
      return null;
    }

    // Try preferred formats in order
    const formats = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];

    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format)) {
        return format;
      }
    }

    // Fallback: let MediaRecorder choose
    return "";
  }, []);

  // Start recording
  const start = useCallback(async () => {
    if (!audioContext || !masterNode) {
      setError("Audio context or master node not available");
      return;
    }

    // Clear previous recording
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
    }
    setRecordingBlob(null);
    setError(null);
    recordedChunksRef.current = [];

    // Ensure audio context is running
    if (audioContext.state === "suspended") {
      try {
        await audioContext.resume();
      } catch {
        setError("Failed to resume audio context");
        return;
      }
    }

    try {
      // Check MediaRecorder support
      if (!window.MediaRecorder) {
        setError("MediaRecorder is not supported in this browser");
        return;
      }

      // Create or reuse MediaStreamDestination
      if (!mediaDestRef.current) {
        mediaDestRef.current = audioContext.createMediaStreamDestination();
      }

      // Connect master node to recording destination (if not already connected)
      // We track the connection so we can disconnect it later
      if (!connectionRef.current) {
        masterNode.connect(mediaDestRef.current);
        connectionRef.current = {
          disconnect: () => {
            try {
              masterNode.disconnect(mediaDestRef.current!);
            } catch {
              // Ignore if already disconnected
            }
          },
        };
      }

      // Get best MIME type
      const mimeType = getBestMimeType();
      if (mimeType === null) {
        setError("No supported audio recording format found");
        return;
      }

      // Create MediaRecorder
      const stream = mediaDestRef.current.stream;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      // Collect chunks
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // Handle stop
      recorder.onstop = () => {
        const mimeType = getBestMimeType() || "audio/webm";
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordingUrl(url);
        setRecordingBlob(blob);
        setIsRecording(false);
        setRecordingDuration(0);
        startTimeRef.current = null;

        // Clear duration interval
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      };

      // Handle errors
      recorder.onerror = (_event) => {
        setError("Recording error occurred");
        setIsRecording(false);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      };

      // Start recording
      recorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to start recording");
      setIsRecording(false);
    }
  }, [audioContext, masterNode, recordingUrl, getBestMimeType]);

  // Stop recording
  const stop = useCallback(async () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }

    // Clear duration interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Clear recording (revoke URL, reset state)
  const clear = useCallback(() => {
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
    }
    setRecordingBlob(null);
    setError(null);
    recordedChunksRef.current = [];
    setRecordingDuration(0);
  }, [recordingUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop recording if active
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        try {
          recorderRef.current.stop();
        } catch {
          // Ignore errors
        }
      }

      // Clear duration interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      // Revoke object URL
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }

      // Disconnect media destination from master node
      if (connectionRef.current) {
        connectionRef.current.disconnect();
        connectionRef.current = null;
      }

      // Note: We don't destroy mediaDestRef because it's tied to the audio context
      // and will be cleaned up when the context is closed
    };
  }, [recordingUrl]);

  return {
    isRecording,
    recordingUrl,
    recordingBlob,
    recordingDuration,
    start,
    stop,
    clear,
    error,
  };
}

