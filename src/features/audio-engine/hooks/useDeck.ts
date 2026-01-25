"use client";

import { useRef, useState, useCallback, useEffect } from 'react';
import { AudioContextManager } from '../lib/AudioContextManager';
import type { ChannelStripNodes } from './useChannelStrip';

/**
 * Deck State
 */
export interface DeckState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
}

/**
 * useDeck - Hook for managing a single DJ deck
 *
 * Implements the "fire-and-forget" pattern for AudioBufferSourceNode:
 * - To pause: stop the current node and record the pause time
 * - To resume: create a new node starting at the pause time
 *
 * Uses useRef for node storage to prevent React re-renders during playback.
 *
 * @param fileUrl - URL of the audio file to load
 * @param channelStrip - Channel strip nodes to connect to
 * @returns Deck controls and state
 */
export function useDeck(
  fileUrl: string | null,
  channelStrip: ChannelStripNodes | null
) {
  // Audio buffer (decoded audio data)
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  // Current source node (fire-and-forget pattern)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Playback state
  const [state, setState] = useState<DeckState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackRate: 1.0,
  });

  // Track current playback position
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const manager = AudioContextManager.getInstance();
  const audioContext = manager.getContext();

  /**
   * Load audio file and decode to AudioBuffer
   */
  const loadTrack = useCallback(async (url: string) => {
    if (!audioContext) {
      console.error('[useDeck] AudioContext not available');
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${url}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = await audioContext.decodeAudioData(arrayBuffer);

      audioBufferRef.current = buffer;
      setState((prev) => ({
        ...prev,
        duration: buffer.duration,
      }));
    } catch (error) {
      console.error('[useDeck] Failed to load track:', error);
      throw error;
    }
  }, [audioContext]);

  // Load track when fileUrl changes
  useEffect(() => {
    if (fileUrl) {
      loadTrack(fileUrl);
    } else {
      audioBufferRef.current = null;
      setState((prev) => ({ ...prev, duration: 0, currentTime: 0 }));
    }
  }, [fileUrl, loadTrack]);

  /**
   * Update current time using requestAnimationFrame (bypasses React)
   */
  const updateCurrentTime = useCallback(() => {
    if (!audioContext || !state.isPlaying) {
      return;
    }

    const elapsed = audioContext.currentTime - startTimeRef.current;
    const newTime = pauseTimeRef.current + elapsed * state.playbackRate;

    // Update DOM directly (not React state) for 60fps updates
    // This prevents render thrashing
    if (newTime >= state.duration) {
      // Track finished
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: prev.duration,
      }));
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      return;
    }

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
  }, [audioContext, state.isPlaying, state.duration, state.playbackRate]);

  /**
   * Play the track
   */
  const play = useCallback(() => {
    if (!audioContext || !audioBufferRef.current || !channelStrip) {
      return;
    }

    // Stop existing source if playing
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }

    // Create new source node (fire-and-forget pattern)
    const source = audioContext.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.playbackRate.value = state.playbackRate;

    // Connect: Source → Channel Strip → Master Bus → Destination
    // Note: Channel strip panner is already connected to MasterBus in useChannelStrip
    source.connect(channelStrip.trimGain);

    // Start playback
    const startOffset = pauseTimeRef.current;
    source.start(0, startOffset);

    sourceNodeRef.current = source;
    startTimeRef.current = audioContext.currentTime - startOffset / state.playbackRate;

    setState((prev) => ({ ...prev, isPlaying: true }));

    // Start animation loop for current time updates
    animationFrameRef.current = requestAnimationFrame(updateCurrentTime);

    // Handle track end
    source.onended = () => {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: prev.duration,
      }));
      pauseTimeRef.current = 0;
      sourceNodeRef.current = null;
    };
  }, [audioContext, channelStrip, state.playbackRate, updateCurrentTime]);

  /**
   * Pause the track
   */
  const pause = useCallback(() => {
    if (!sourceNodeRef.current || !audioContext) {
      return;
    }

    // Calculate current playback position
    const elapsed = audioContext.currentTime - startTimeRef.current;
    pauseTimeRef.current += elapsed * state.playbackRate;

    // Stop the source node
    sourceNodeRef.current.stop();
    sourceNodeRef.current = null;

    // Cancel animation loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isPlaying: false,
      currentTime: pauseTimeRef.current,
    }));
  }, [audioContext, state.playbackRate]);

  /**
   * Seek to a specific time
   */
  const seek = useCallback((time: number) => {
    const wasPlaying = state.isPlaying;

    // Pause if playing
    if (wasPlaying) {
      pause();
    }

    // Update pause time
    pauseTimeRef.current = Math.max(0, Math.min(time, state.duration));

    setState((prev) => ({
      ...prev,
      currentTime: pauseTimeRef.current,
    }));

    // Resume if was playing
    if (wasPlaying) {
      play();
    }
  }, [state.isPlaying, state.duration, pause, play]);

  /**
   * Set playback rate (pitch/speed)
   */
  const setPlaybackRate = useCallback((rate: number) => {
    const wasPlaying = state.isPlaying;

    if (wasPlaying) {
      pause();
    }

    setState((prev) => ({ ...prev, playbackRate: rate }));

    if (wasPlaying) {
      play();
    }
  }, [state.isPlaying, pause, play]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch {
          // Already stopped
        }
        sourceNodeRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    state,
    // Expose the current decoded buffer for UI components (e.g. waveform).
    // Note: this is a ref value; it updates when the hook rerenders (e.g. when duration is set).
    audioBuffer: audioBufferRef.current,
    play,
    pause,
    seek,
    setPlaybackRate,
    loadTrack,
    isLoaded: audioBufferRef.current !== null,
  };
}
