"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface UseVoiceTagReturn {
  micEnabled: boolean;
  isRecording: boolean;
  tagUrl: string | null;
  tagBlob: Blob | null;
  tagDurationMs: number | null;
  level: number; // 0-1 meter level
  error: string | null;
  enableMic: () => Promise<void>;
  disableMic: () => void;
  startTagRecording: () => Promise<void>;
  stopTagRecording: () => Promise<void>;
  clearTag: () => void;
  playTag: () => void;
  stopTagPlayback: () => void;
  setTagVolume: (v: number) => void;
}

/**
 * Hook for recording and playing voice tags from microphone input.
 * Records short voice tags and allows playing them back through the master bus.
 *
 * @param audioContext - The WebAudio AudioContext
 * @param masterNode - The master gain node to route tag audio through
 */
export function useVoiceTag(
  audioContext: AudioContext | null | undefined,
  masterNode: GainNode | null | undefined
): UseVoiceTagReturn {
  const [micEnabled, setMicEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [tagUrl, setTagUrl] = useState<string | null>(null);
  const [tagBlob, setTagBlob] = useState<Blob | null>(null);
  const [tagDurationMs, setTagDurationMs] = useState<number | null>(null);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const recordGainRef = useRef<GainNode | null>(null); // Gain for recording path
  const playbackGainRef = useRef<GainNode | null>(null); // Gain for playback path (separate to avoid feedback)
  const tagDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const tagVolumeRef = useRef<number>(0.7); // Default 70% volume

  // Determine best supported MIME type
  const getBestMimeType = useCallback((): string | null => {
    if (typeof window === "undefined" || !window.MediaRecorder) {
      return null;
    }

    // Try preferred formats in order
    const formats = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
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

  // Level meter update loop (only runs when mic is enabled)
  const updateLevel = useCallback(() => {
    if (!analyserRef.current || !micEnabled) {
      setLevel(0);
      return;
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    // Calculate RMS level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / bufferLength);
    setLevel(Math.min(1, rms * 2)); // Scale and clamp to 0-1

    if (micEnabled) {
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    }
  }, [micEnabled]);

  // Start level meter when mic is enabled
  useEffect(() => {
    if (micEnabled && analyserRef.current) {
      updateLevel();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setLevel(0);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [micEnabled, updateLevel]);

  // Enable microphone
  const enableMic = useCallback(async () => {
    if (!audioContext || !masterNode) {
      setError("Audio context or master node not available");
      return;
    }

    // If already enabled, do nothing
    if (micEnabled) {
      return;
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Ensure audio context is running
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      // Create MediaStreamAudioSourceNode
      const micSource = audioContext.createMediaStreamSource(stream);
      micSourceRef.current = micSource;

      // Create record gain node (for recording path only)
      const recordGain = audioContext.createGain();
      recordGain.gain.value = 1.0; // Full gain for recording
      recordGainRef.current = recordGain;

      // Create playback gain node (for playback path, separate to avoid feedback)
      const playbackGain = audioContext.createGain();
      playbackGain.gain.value = tagVolumeRef.current;
      playbackGainRef.current = playbackGain;

      // Create analyser for level meter
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Create MediaStreamDestination for recording
      const tagDest = audioContext.createMediaStreamDestination();
      tagDestRef.current = tagDest;

      // Route mic -> analyser (for meter)
      micSource.connect(analyser);

      // Route mic -> recordGain -> tagDest (for recording)
      // Note: recordGain is NOT connected to masterGain to avoid feedback
      micSource.connect(recordGain);
      recordGain.connect(tagDest);

      setMicEnabled(true);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to access microphone. Please check permissions.";
      setError(errorMessage);
      setMicEnabled(false);

      // Cleanup on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [audioContext, masterNode, micEnabled]);

  // Disable microphone
  const disableMic = useCallback(() => {
    // Stop recording if active
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        // Ignore errors
      }
    }

    // Stop playback if active
    if (playbackSourceRef.current) {
      try {
        playbackSourceRef.current.stop();
      } catch {
        // Ignore errors
      }
      playbackSourceRef.current = null;
    }

    // Stop all stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Disconnect nodes
    if (micSourceRef.current) {
      try {
        micSourceRef.current.disconnect();
      } catch {
        // Ignore if already disconnected
      }
      micSourceRef.current = null;
    }

    if (recordGainRef.current) {
      try {
        recordGainRef.current.disconnect();
      } catch {
        // Ignore if already disconnected
      }
      recordGainRef.current = null;
    }

    if (playbackGainRef.current) {
      try {
        playbackGainRef.current.disconnect();
      } catch {
        // Ignore if already disconnected
      }
      playbackGainRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        // Ignore if already disconnected
      }
      analyserRef.current = null;
    }

    if (tagDestRef.current) {
      try {
        tagDestRef.current.disconnect();
      } catch {
        // Ignore if already disconnected
      }
      tagDestRef.current = null;
    }

    setMicEnabled(false);
    setIsRecording(false);
    setLevel(0);
  }, []);

  // Start recording tag
  const startTagRecording = useCallback(async () => {
    if (!audioContext || !masterNode) {
      setError("Audio context or master node not available");
      return;
    }

    // Enable mic if not already enabled
    if (!micEnabled) {
      await enableMic();
      // Wait a bit for mic to initialize
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!micEnabled || !tagDestRef.current) {
      setError("Microphone not available");
      return;
    }

    // Check MediaRecorder support
    if (!window.MediaRecorder) {
      setError("MediaRecorder is not supported in this browser");
      return;
    }

    try {
      // Clear previous recording
      if (tagUrl) {
        URL.revokeObjectURL(tagUrl);
        setTagUrl(null);
      }
      setTagBlob(null);
      setTagDurationMs(null);
      setError(null);
      recordedChunksRef.current = [];

      // Get best MIME type
      const mimeType = getBestMimeType();
      if (mimeType === null) {
        setError("No supported audio recording format found");
        return;
      }

      // Create MediaRecorder
      const stream = tagDestRef.current.stream;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      const startTime = Date.now();

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
        const duration = Date.now() - startTime;

        setTagUrl(url);
        setTagBlob(blob);
        setTagDurationMs(duration);
        setIsRecording(false);
      };

      // Handle errors
      recorder.onerror = (_event) => {
        setError("Recording error occurred");
        setIsRecording(false);
      };

      // Start recording
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start recording");
      setIsRecording(false);
    }
  }, [audioContext, masterNode, micEnabled, tagUrl, enableMic, getBestMimeType]);

  // Stop recording tag
  const stopTagRecording = useCallback(async () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }, []);

  // Clear tag
  const clearTag = useCallback(() => {
    // Stop playback if active
    if (playbackSourceRef.current) {
      try {
        playbackSourceRef.current.stop();
      } catch {
        // Ignore errors
      }
      playbackSourceRef.current = null;
    }

    // Disconnect playbackGain from master if connected
    if (playbackGainRef.current && masterNode) {
      try {
        playbackGainRef.current.disconnect(masterNode);
      } catch {
        // Ignore if already disconnected
      }
    }

    if (tagUrl) {
      URL.revokeObjectURL(tagUrl);
    }
    setTagUrl(null);
    setTagBlob(null);
    setTagDurationMs(null);
  }, [tagUrl, masterNode]);

  // Play tag
  const playTag = useCallback(async () => {
    if (!audioContext || !masterNode || !tagBlob) {
      return;
    }

    // Stop any existing playback
    if (playbackSourceRef.current) {
      try {
        playbackSourceRef.current.stop();
      } catch {
        // Ignore errors
      }
      playbackSourceRef.current = null;
    }

    try {
      // Ensure audio context is running
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      // Decode audio blob
      const arrayBuffer = await tagBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Create buffer source
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // Ensure playbackGain exists
      if (!playbackGainRef.current) {
        const playbackGain = audioContext.createGain();
        playbackGain.gain.value = tagVolumeRef.current;
        playbackGainRef.current = playbackGain;
      }

      // Ensure playbackGain is connected to masterNode for playback
      // Disconnect first to avoid duplicate connections
      try {
        playbackGainRef.current.disconnect(masterNode);
      } catch {
        // Not connected, that's fine
      }
      playbackGainRef.current.connect(masterNode);

      // Connect: source -> playbackGain -> masterNode
      source.connect(playbackGainRef.current);

      // Handle end of playback
      source.onended = () => {
        playbackSourceRef.current = null;
        // Optionally disconnect tagGain from master after playback
        // We keep it connected for potential future playback
      };

      playbackSourceRef.current = source;
      source.start(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to play tag");
    }
  }, [audioContext, masterNode, tagBlob]);

  // Stop tag playback
  const stopTagPlayback = useCallback(() => {
    if (playbackSourceRef.current) {
      try {
        playbackSourceRef.current.stop();
      } catch {
        // Ignore errors
      }
      playbackSourceRef.current = null;
    }
  }, []);

  // Set tag volume
  const setTagVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    tagVolumeRef.current = clamped;
    if (playbackGainRef.current) {
      playbackGainRef.current.gain.value = clamped;
    }
  }, []);

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

      // Stop playback if active
      if (playbackSourceRef.current) {
        try {
          playbackSourceRef.current.stop();
        } catch {
          // Ignore errors
        }
      }

      // Stop all stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Revoke object URL
      if (tagUrl) {
        URL.revokeObjectURL(tagUrl);
      }

      // Disconnect nodes
      if (micSourceRef.current) {
        try {
          micSourceRef.current.disconnect();
        } catch {
          // Ignore
        }
      }

      if (recordGainRef.current) {
        try {
          recordGainRef.current.disconnect();
        } catch {
          // Ignore
        }
      }

      if (playbackGainRef.current) {
        try {
          playbackGainRef.current.disconnect();
        } catch {
          // Ignore
        }
      }

      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect();
        } catch {
          // Ignore
        }
      }

      if (tagDestRef.current) {
        try {
          tagDestRef.current.disconnect();
        } catch {
          // Ignore
        }
      }

      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [tagUrl]);

  return {
    micEnabled,
    isRecording,
    tagUrl,
    tagBlob,
    tagDurationMs,
    level,
    error,
    enableMic,
    disableMic,
    startTagRecording,
    stopTagRecording,
    clearTag,
    playTag,
    stopTagPlayback,
    setTagVolume,
  };
}

