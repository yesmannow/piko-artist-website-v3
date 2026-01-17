/**
 * PHASE 3: iOS Audio Keep-Alive Utility
 *
 * Implements a silent audio loop to prevent iOS from suspending audio playback.
 * This is the "silent loop hack" that keeps the audio context alive.
 *
 * Required for:
 * - Continuous audio playback on iOS Safari
 * - Preventing audio interruption when screen locks
 * - Maintaining low-latency audio engine
 *
 * Usage:
 * ```tsx
 * const silentLoop = useSilentAudioLoop(audioContext);
 *
 * // Start silent loop when audio session begins
 * silentLoop.start();
 *
 * // Stop when session ends
 * silentLoop.stop();
 * ```
 */

import { useRef, useCallback, useEffect } from "react";

interface SilentAudioLoopReturn {
  start: () => void;
  stop: () => void;
  isPlaying: boolean;
}

/**
 * Hook to create and manage a silent audio loop for iOS
 */
export function useSilentAudioLoop(
  audioContext?: AudioContext | null,
): SilentAudioLoopReturn {
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const isPlayingRef = useRef(false);

  /**
   * Start the silent audio loop
   */
  const start = useCallback(() => {
    if (!audioContext || isPlayingRef.current) {
      return;
    }

    try {
      // Create a silent oscillator (extremely low volume)
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Set volume to effectively silent but not zero (iOS needs actual signal)
      gainNode.gain.value = 0.001; // -60dB, effectively silent

      // Use a very low frequency to minimize CPU usage
      oscillator.frequency.value = 20; // 20Hz, below human hearing range
      oscillator.type = "sine";

      // Connect: oscillator -> gain -> destination
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Start the oscillator
      oscillator.start();

      // Store references
      oscillatorRef.current = oscillator;
      gainRef.current = gainNode;
      isPlayingRef.current = true;

      console.log("[iOS Keep-Alive] Silent audio loop started");
    } catch (error) {
      console.warn("[iOS Keep-Alive] Failed to start silent loop:", error);
    }
  }, [audioContext]);

  /**
   * Stop the silent audio loop
   */
  const stop = useCallback(() => {
    if (!oscillatorRef.current || !isPlayingRef.current) {
      return;
    }

    try {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      gainRef.current?.disconnect();

      oscillatorRef.current = null;
      gainRef.current = null;
      isPlayingRef.current = false;

      console.log("[iOS Keep-Alive] Silent audio loop stopped");
    } catch (error) {
      console.warn("[iOS Keep-Alive] Failed to stop silent loop:", error);
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    start,
    stop,
    isPlaying: isPlayingRef.current,
  };
}

/**
 * Alternative: Create a silent audio buffer loop
 * This version uses a buffer source instead of oscillator
 */
export function createSilentBufferLoop(
  audioContext: AudioContext,
): AudioBufferSourceNode | null {
  try {
    // Create a 1-second silent buffer
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, sampleRate, sampleRate);

    // Fill with near-zero values (not completely zero for iOS)
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = 0.0001; // Very quiet
    }

    // Create buffer source
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Create gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.001; // -60dB

    // Connect and start
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start();

    console.log("[iOS Keep-Alive] Silent buffer loop started");

    return source;
  } catch (error) {
    console.warn(
      "[iOS Keep-Alive] Failed to create silent buffer loop:",
      error,
    );
    return null;
  }
}
