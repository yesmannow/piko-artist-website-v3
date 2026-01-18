"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * useCanvasVideoRecorder - Hook for merging canvas and audio into a single video
 *
 * Uses canvas.captureStream() to combine visual and audio tracks.
 *
 * @param canvasRef - Reference to the canvas element
 * @param audioStream - MediaStream containing audio tracks
 *
 * @example
 * ```tsx
 * const canvasRef = useRef<HTMLCanvasElement>(null);
 * const audioStream = mediaDestination.stream;
 * const { start, stop, exportBlob, isRecording } = useCanvasVideoRecorder(
 *   canvasRef,
 *   audioStream
 * );
 * ```
 */
export function useCanvasVideoRecorder(
  canvasRef: RefObject<HTMLCanvasElement>,
  audioStream: MediaStream | null
) {
  const [isRecording, setIsRecording] = useState(false);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const combinedStreamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (combinedStreamRef.current) {
        combinedStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  const start = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('Canvas not available');
      return;
    }

    if (!audioStream) {
      console.warn('Audio stream not available');
      return;
    }

    if (recorderRef.current?.state === 'recording') {
      console.warn('Already recording');
      return;
    }

    try {
      // Get video stream from canvas
      const canvasStream = canvas.captureStream(30); // 30 FPS

      // Combine video and audio tracks
      const combined = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      combinedStreamRef.current = combined;

      // Determine best MIME type
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }

      // Create MediaRecorder
      const recorder = new MediaRecorder(combined, { mimeType });
      recorderRef.current = recorder;

      // Clear previous chunks
      setChunks([]);

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
        // Stop all tracks
        combined.getTracks().forEach((track) => {
          track.stop();
        });
      };

      // Start recording with timeslice
      recorder.start(100); // 100ms chunks
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start video recording:', error);
      setIsRecording(false);
    }
  }, [canvasRef, audioStream]);

  const stop = useCallback(() => {
    if (!recorderRef.current) {
      return;
    }

    if (recorderRef.current.state === 'inactive') {
      return;
    }

    try {
      recorderRef.current.stop();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
    }
  }, []);

  const exportBlob = useCallback((): Blob | null => {
    if (chunks.length === 0) {
      return null;
    }

    const mimeType = recorderRef.current?.mimeType || 'video/webm';
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
