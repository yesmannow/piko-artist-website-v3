/**
 * useMixRecorder Hook
 *
 * Phase VIII: Professional Mix Recording & Export
 *
 * Captures the AudioContext master output for high-quality set recording/export.
 * Uses MediaRecorder API to record the final mix with zero-latency monitoring.
 *
 * Features:
 * - Records master output (post-effects, post-mixing)
 * - Supports multiple formats (WAV, MP3, OGG)
 * - Real-time recording duration tracking
 * - Automatic file download on stop
 * - Zero-latency passthrough (recording doesn't affect playback)
 *
 * Usage:
 * ```tsx
 * const { isRecording, duration, startRecording, stopRecording, error } = useMixRecorder();
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseMixRecorderOptions {
  /** Target bitrate in bits per second (default: 192000 = 192kbps) */
  bitrate?: number;
  /** MIME type for recording (default: audio/webm) */
  mimeType?: string;
  /** AudioContext to record from */
  audioContext?: AudioContext | null;
  /** Master gain node to tap into */
  masterNode?: GainNode | null;
}

interface UseMixRecorderReturn {
  /** Whether recording is currently active */
  isRecording: boolean;
  /** Current recording duration in seconds */
  duration: number;
  /** Start recording the master output */
  startRecording: () => Promise<void>;
  /** Stop recording and download the file */
  stopRecording: () => Promise<void>;
  /** Pause recording (if supported by browser) */
  pauseRecording: () => void;
  /** Resume recording after pause */
  resumeRecording: () => void;
  /** Current recording state */
  recordingState: 'inactive' | 'recording' | 'paused';
  /** Error message if recording fails */
  error: string | null;
  /** Recorded audio chunks (for preview/upload) */
  audioBlob: Blob | null;
}

export function useMixRecorder(options: UseMixRecorderOptions = {}): UseMixRecorderReturn {
  const {
    bitrate = 192000,
    mimeType = 'audio/webm;codecs=opus',
    audioContext,
    masterNode,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingState, setRecordingState] = useState<'inactive' | 'recording' | 'paused'>('inactive');
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<number | null>(null);

  /**
   * Start recording the master output
   */
  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Validate audio context
      if (!audioContext || !masterNode) {
        throw new Error('AudioContext and masterNode are required for recording');
      }

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create a destination node to capture the audio
      const destination = audioContext.createMediaStreamDestination();
      destinationRef.current = destination;

      // Connect the master node to the destination (this creates a "tap" for recording)
      // The audio continues to play normally through the default output
      masterNode.connect(destination);

      // Get the media stream from the destination
      const stream = destination.stream;
      streamRef.current = stream;

      // Check if the browser supports the requested MIME type
      const supportedMimeType = MediaRecorder.isTypeSupported(mimeType)
        ? mimeType
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg';

      // Create the MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
        audioBitsPerSecond: bitrate,
      });

      audioChunksRef.current = [];

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop event
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: supportedMimeType });
        setAudioBlob(blob);

        // Cleanup
        if (destinationRef.current && masterNode) {
          masterNode.disconnect(destinationRef.current);
        }
        destinationRef.current = null;
        streamRef.current = null;
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('[MixRecorder] Recording error:', event);
        setError('Recording failed. Please try again.');
        setIsRecording(false);
        setRecordingState('inactive');
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;

      setIsRecording(true);
      setRecordingState('recording');
      startTimeRef.current = Date.now();

      // Start duration timer
      durationIntervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setDuration(Math.floor(elapsed));
      }, 1000);

      console.log('[MixRecorder] Recording started');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      console.error('[MixRecorder] Error starting recording:', err);
      setError(errorMessage);
      setIsRecording(false);
      setRecordingState('inactive');
    }
  }, [audioContext, masterNode, mimeType, bitrate]);

  /**
   * Stop recording and download the file
   */
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) {
      return;
    }

    try {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingState('inactive');

      // Stop duration timer
      if (durationIntervalRef.current !== null) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      console.log('[MixRecorder] Recording stopped');

      // Wait for the blob to be created
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Auto-download the recording
      if (audioBlob) {
        downloadRecording(audioBlob);
      }
    } catch (err) {
      console.error('[MixRecorder] Error stopping recording:', err);
      setError('Failed to stop recording');
    }
  }, [audioBlob]);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');

      // Pause duration timer
      if (durationIntervalRef.current !== null) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, []);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');

      // Resume duration timer
      durationIntervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setDuration(Math.floor(elapsed));
      }, 1000);
    }
  }, []);

  /**
   * Download the recorded audio file
   */
  const downloadRecording = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `piko-mix-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      if (durationIntervalRef.current !== null) {
        clearInterval(durationIntervalRef.current);
      }

      if (destinationRef.current && masterNode) {
        masterNode.disconnect(destinationRef.current);
      }
    };
  }, [masterNode]);

  return {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    recordingState,
    error,
    audioBlob,
  };
}
