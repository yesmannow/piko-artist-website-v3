'use client';

/**
 * useTimelineAudio.ts - Multi-track Timeline Audio Engine
 *
 * Phase 3: Audio Playback for Timeline-based Mixing
 *
 * Architecture:
 * - Uses Tone.js Transport as master timeline clock
 * - Schedules multiple Tone.Player instances on Transport timeline
 * - Each track has independent start time, duration, volume, fades
 * - Syncs playhead position with Transport.seconds
 *
 * Key Differences from 2-Deck Studio:
 * - NO crossfader (multi-track routing instead)
 * - NO live sync/beatmatching (pre-arranged timeline)
 * - Export-focused (not live performance)
 * - Timeline-based scheduling (not deck-based)
 */

import { useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { useTimelineStore } from './useTimelineStore';
import type { TimelineTrack } from './useTimelineStore';

type PlayerInstance = {
  player: Tone.Player;
  volume: Tone.Volume;
  fadeIn: Tone.Gain; // For fade-in/out envelopes
  channel: Tone.Channel;
};

type PlayerMap = Map<string, PlayerInstance>; // trackKey -> PlayerInstance

export interface TimelineAudioControls {
  initAudio: () => Promise<void>;
  isReady: boolean;
  loadTrack: (track: TimelineTrack, audioUrl: string) => Promise<void>;
  unloadTrack: (trackKey: string) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (timeInSeconds: number) => void;
  getPlaybackPosition: () => number;
  setTrackVolume: (trackKey: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
}

let engineSingleton: {
  players: PlayerMap;
  masterBus: Tone.Gain | null;
  limiter: Tone.Limiter | null;
  isInitialized: boolean;
  animationFrameId: number | null;
} | null = null;

/**
 * Multi-track timeline audio engine hook
 */
export function useTimelineAudio(): TimelineAudioControls {
  const { playhead, isPlaying, setPlayhead, setIsPlaying } = useTimelineStore();

  const playersRef = useRef<PlayerMap>(new Map());
  const masterBusRef = useRef<Tone.Gain | null>(null);
  const limiterRef = useRef<Tone.Limiter | null>(null);
  const isInitializedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const isReadyRef = useRef(false);

  // Initialize singleton on first mount
  useEffect(() => {
    if (!engineSingleton) {
      engineSingleton = {
        players: new Map(),
        masterBus: null,
        limiter: null,
        isInitialized: false,
        animationFrameId: null,
      };
    }
    playersRef.current = engineSingleton.players;
    masterBusRef.current = engineSingleton.masterBus;
    limiterRef.current = engineSingleton.limiter;
    isInitializedRef.current = engineSingleton.isInitialized;
    isReadyRef.current = engineSingleton.isInitialized;
  }, []);

  /**
   * Initialize Tone.js audio context and master bus
   * Must be called from user interaction (browser autoplay policy)
   */
  const initAudio = useCallback(async () => {
    if (isInitializedRef.current) {
      console.log('[TimelineAudio] Already initialized');
      return;
    }

    try {
      console.log('[TimelineAudio] Initializing audio context...');

      // Start Tone.js audio context
      await Tone.start();
      console.log('[TimelineAudio] Audio context started:', Tone.context.state);

      // Create master bus chain: Master Gain -> Limiter -> Destination
      const masterBus = new Tone.Gain(0.8).toDestination();
      const limiter = new Tone.Limiter(-0.5).connect(masterBus);

      masterBusRef.current = masterBus;
      limiterRef.current = limiter;

      if (engineSingleton) {
        engineSingleton.masterBus = masterBus;
        engineSingleton.limiter = limiter;
        engineSingleton.isInitialized = true;
      }

      // Configure Transport for timeline mode
      Tone.Transport.cancel(0); // Clear any scheduled events
      Tone.Transport.position = 0; // Start at beginning
      Tone.Transport.loop = false; // No looping (linear timeline)
      Tone.Transport.bpm.value = 120; // Default tempo (not critical for timeline mode)

      isInitializedRef.current = true;
      isReadyRef.current = true;

      console.log('[TimelineAudio] Initialization complete ✅');
    } catch (error) {
      console.error('[TimelineAudio] Initialization failed:', error);
      throw error;
    }
  }, []);

  /**
   * Load a track and create audio routing
   */
  const loadTrack = useCallback(async (track: TimelineTrack, audioUrl: string) => {
    if (!isInitializedRef.current) {
      console.warn('[TimelineAudio] Cannot load track - engine not initialized');
      return;
    }

    try {
      console.log(`[TimelineAudio] Loading track: ${track.trackKey} from ${audioUrl}`);

      // Check if track already loaded
      if (playersRef.current.has(track.trackKey)) {
        console.log(`[TimelineAudio] Track ${track.trackKey} already loaded, skipping`);
        return;
      }

      // Create audio chain: Player -> Volume -> FadeGain -> Channel -> Limiter
      const player = new Tone.Player({
        url: audioUrl,
        onload: () => {
          console.log(`[TimelineAudio] Track loaded: ${track.trackKey} (${player.buffer.duration}s)`);
        },
        onerror: (error) => {
          console.error(`[TimelineAudio] Failed to load ${track.trackKey}:`, error);
        },
      });

      const volume = new Tone.Volume(Tone.gainToDb(track.volume)).connect(limiterRef.current!);
      const fadeGain = new Tone.Gain(1).connect(volume);
      const channel = new Tone.Channel({ volume: 0, pan: 0 }).connect(fadeGain);

      player.connect(channel);

      // Store player instance
      const instance: PlayerInstance = {
        player,
        volume,
        fadeIn: fadeGain,
        channel,
      };

      playersRef.current.set(track.trackKey, instance);

      console.log(`[TimelineAudio] Track ${track.trackKey} loaded and routed ✅`);
    } catch (error) {
      console.error(`[TimelineAudio] Error loading track ${track.trackKey}:`, error);
      throw error;
    }
  }, []);

  /**
   * Unload a track and dispose audio resources
   */
  const unloadTrack = useCallback((trackKey: string) => {
    const instance = playersRef.current.get(trackKey);
    if (!instance) {
      return;
    }

    console.log(`[TimelineAudio] Unloading track: ${trackKey}`);

    // Stop player if playing
    if (instance.player.state === 'started') {
      instance.player.stop();
    }

    // Dispose audio nodes
    instance.player.dispose();
    instance.volume.dispose();
    instance.fadeIn.dispose();
    instance.channel.dispose();

    playersRef.current.delete(trackKey);
    console.log(`[TimelineAudio] Track ${trackKey} unloaded ✅`);
  }, []);

  /**
   * Schedule and start playback from current playhead position
   */
  const play = useCallback(() => {
    if (!isInitializedRef.current) {
      console.warn('[TimelineAudio] Cannot play - engine not initialized');
      return;
    }

    console.log(`[TimelineAudio] Starting playback from ${playhead.toFixed(2)}s`);

    const tracks = useTimelineStore.getState().tracks;
    const currentTime = playhead;

    // Schedule each track based on its timeline position
    tracks.forEach((track) => {
      const instance = playersRef.current.get(track.trackKey);
      if (!instance) {
        console.warn(`[TimelineAudio] Track ${track.trackKey} not loaded, skipping`);
        return;
      }

      const trackStartTime = track.startTime;
      const trackEndTime = track.startTime + track.duration;

      // Only play tracks that overlap with current playhead
      if (currentTime >= trackStartTime && currentTime < trackEndTime) {
        const offsetIntoTrack = currentTime - trackStartTime;

        // Apply fade-in if within fade zone
        if (offsetIntoTrack < track.fadeIn) {
          const fadeProgress = offsetIntoTrack / track.fadeIn;
          instance.fadeIn.gain.value = fadeProgress;
          // Ramp up over remaining fade time
          instance.fadeIn.gain.linearRampToValueAtTime(1, Tone.now() + (track.fadeIn - offsetIntoTrack));
        } else if (currentTime > trackEndTime - track.fadeOut) {
          // Apply fade-out if within fade zone
          const timeUntilEnd = trackEndTime - currentTime;
          const fadeProgress = timeUntilEnd / track.fadeOut;
          instance.fadeIn.gain.value = fadeProgress;
          instance.fadeIn.gain.linearRampToValueAtTime(0, Tone.now() + timeUntilEnd);
        } else {
          instance.fadeIn.gain.value = 1;
        }

        // Start playback at correct offset
        instance.player.start(Tone.now(), offsetIntoTrack);

        console.log(`[TimelineAudio] Started ${track.trackKey} at offset ${offsetIntoTrack.toFixed(2)}s`);
      } else if (currentTime < trackStartTime) {
        // Schedule future playback
        const delayUntilStart = trackStartTime - currentTime;

        // Apply fade-in envelope
        instance.fadeIn.gain.setValueAtTime(0, Tone.now() + delayUntilStart);
        instance.fadeIn.gain.linearRampToValueAtTime(1, Tone.now() + delayUntilStart + track.fadeIn);

        // Schedule fade-out
        const fadeOutStartTime = delayUntilStart + track.duration - track.fadeOut;
        instance.fadeIn.gain.setValueAtTime(1, Tone.now() + fadeOutStartTime);
        instance.fadeIn.gain.linearRampToValueAtTime(0, Tone.now() + delayUntilStart + track.duration);

        instance.player.start(Tone.now() + delayUntilStart);

        console.log(`[TimelineAudio] Scheduled ${track.trackKey} to start in ${delayUntilStart.toFixed(2)}s`);
      }
    });

    // Start Transport
    Tone.Transport.start();
    setIsPlaying(true);

    // Start playhead sync loop
    startPlayheadSync();
  }, [playhead, setIsPlaying]);

  /**
   * Pause playback (stop Transport but keep position)
   */
  const pause = useCallback(() => {
    console.log('[TimelineAudio] Pausing playback');

    // Stop all players
    playersRef.current.forEach((instance) => {
      if (instance.player.state === 'started') {
        instance.player.stop();
      }
    });

    Tone.Transport.pause();
    setIsPlaying(false);

    // Stop playhead sync
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      if (engineSingleton) {
        engineSingleton.animationFrameId = null;
      }
    }
  }, [setIsPlaying]);

  /**
   * Stop playback and reset to beginning
   */
  const stop = useCallback(() => {
    console.log('[TimelineAudio] Stopping playback');

    // Stop all players
    playersRef.current.forEach((instance) => {
      if (instance.player.state === 'started') {
        instance.player.stop();
      }
      // Reset fade gain
      instance.fadeIn.gain.cancelScheduledValues(0);
      instance.fadeIn.gain.value = 1;
    });

    Tone.Transport.stop();
    Tone.Transport.position = 0;
    setPlayhead(0);
    setIsPlaying(false);

    // Stop playhead sync
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      if (engineSingleton) {
        engineSingleton.animationFrameId = null;
      }
    }
  }, [setPlayhead, setIsPlaying]);

  /**
   * Seek to a specific time position
   */
  const seekTo = useCallback((timeInSeconds: number) => {
    console.log(`[TimelineAudio] Seeking to ${timeInSeconds.toFixed(2)}s`);

    const wasPlaying = isPlaying;

    // Stop all players
    playersRef.current.forEach((instance) => {
      if (instance.player.state === 'started') {
        instance.player.stop();
      }
      instance.fadeIn.gain.cancelScheduledValues(0);
      instance.fadeIn.gain.value = 1;
    });

    // Update Transport position
    Tone.Transport.seconds = timeInSeconds;
    setPlayhead(timeInSeconds);

    // Resume playback if was playing
    if (wasPlaying) {
      // Small delay to avoid glitches
      setTimeout(() => play(), 10);
    }
  }, [isPlaying, play, setPlayhead]);

  /**
   * Get current playback position from Transport
   */
  const getPlaybackPosition = useCallback((): number => {
    return Tone.Transport.seconds;
  }, []);

  /**
   * Set volume for a specific track
   */
  const setTrackVolume = useCallback((trackKey: string, volume: number) => {
    const instance = playersRef.current.get(trackKey);
    if (!instance) {
      console.warn(`[TimelineAudio] Cannot set volume - track ${trackKey} not loaded`);
      return;
    }

    const dbValue = Tone.gainToDb(volume);
    instance.volume.volume.value = dbValue;
  }, []);

  /**
   * Set master output volume
   */
  const setMasterVolume = useCallback((volume: number) => {
    if (!masterBusRef.current) {
      return;
    }

    masterBusRef.current.gain.value = volume;
  }, []);

  /**
   * Sync playhead position with Tone.Transport (60fps)
   */
  const startPlayheadSync = useCallback(() => {
    const syncLoop = () => {
      if (Tone.Transport.state === 'started') {
        const currentSeconds = Tone.Transport.seconds;
        setPlayhead(currentSeconds);

        // Check if we've reached the end of the timeline
        const totalDuration = useTimelineStore.getState().getTotalDuration();
        if (currentSeconds >= totalDuration) {
          stop();
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(syncLoop);
      if (engineSingleton) {
        engineSingleton.animationFrameId = animationFrameRef.current;
      }
    };

    syncLoop();
  }, [setPlayhead, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only cleanup if this is the last instance
      // (In production, Timeline component should be singleton)
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    initAudio,
    isReady: isReadyRef.current,
    loadTrack,
    unloadTrack,
    play,
    pause,
    stop,
    seekTo,
    getPlaybackPosition,
    setTrackVolume,
    setMasterVolume,
  };
}
