"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useAudioRecorder - Hook for capturing Web Audio output via MediaRecorder
 *
 * Routes audio through MediaStreamDestinationNode and records it.
 *
 * @param audioContext - The AudioContext to use
 * @param sourceNode - The audio node to record (typically masterGain)
 *
 * @example
 * ```tsx
 * const { start, stop, exportBlob, isRecording } = useAudioRecorder(
 *   audioContext,
 *   masterGainNode
 * );
 * ```
 */
export function useAudioRecorder(
  audioContext: AudioContext | null,
  sourceNode: AudioNode | null
) {
  const [isRecording, setIsRecording] = useState(false);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const connectionRef = useRef<boolean>(false);

  // Setup MediaStreamDestination
  useEffect(() => {
    if (!audioContext || !sourceNode) return;

    const dest = audioContext.createMediaStreamDestination();
    mediaDestinationRef.current = dest;

    // Connect source to destination
    sourceNode.connect(dest);
    connectionRef.current = true;

    // Check if MediaRecorder is supported
    if (!MediaRecorder.isTypeSupported('audio/webm')) {
      console.warn('audio/webm not supported, trying audio/mp4');
    }

    // Create MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/mp4';

    try {
      const recorder = new MediaRecorder(dest.stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setChunks((prev) => [...prev, e.data]);
        }
      };

      recorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        setIsRecording(false);
      };

      recorder.onstop = () => {
        setIsRecording(false);
      };
    } catch (error) {
      console.error('Failed to create MediaRecorder:', error);
    }

    return () => {
      // Cleanup: disconnect source from destination
      if (connectionRef.current && sourceNode && dest) {
        try {
          sourceNode.disconnect(dest);
        } catch (e) {
          // Ignore disconnect errors
        }
      }
    };
  }, [audioContext, sourceNode]);

  const start = useCallback(() => {
    if (!mediaRecorderRef.current) {
      console.warn('MediaRecorder not initialized');
      return;
    }

    if (mediaRecorderRef.current.state === 'recording') {
      console.warn('Already recording');
      return;
    }

    // Clear previous chunks
    setChunks([]);
    setIsRecording(true);

    try {
      // Start recording with timeslice for better chunk handling
      mediaRecorderRef.current.start(100); // 100ms chunks
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (!mediaRecorderRef.current) {
      return;
    }

    if (mediaRecorderRef.current.state === 'inactive') {
      return;
    }

    try {
      mediaRecorderRef.current.stop();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
    }
  }, []);

  const exportBlob = useCallback((): Blob | null => {
    if (chunks.length === 0) {
      return null;
    }

    // Determine MIME type from first chunk or default
    const mimeType =
      mediaRecorderRef.current?.mimeType || 'audio/webm';

    return new Blob(chunks, { type: mimeType });
  }, [chunks]);

  const reset = useCallback(() => {
    setChunks([]);
    setIsRecording(false);
  }, []);

  return {
    start,
    stop,
    exportBlob,
    reset,
    isRecording,
    chunks,
  };
}
