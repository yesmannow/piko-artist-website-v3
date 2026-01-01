"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useAudioStore } from "@/stores/useAudioStore";
import { useAudioGraph } from "@/hooks/useAudioGraph";
import { createConstantPowerSplitter, applyConstantPowerGains } from "@/utils/constantPowerSplitter";

// SessionStorage keys
const STORAGE_KEY_CROSSFADER = "piko_studio_crossfader";
const STORAGE_KEY_DECK_A_TRACK = "piko_studio_deck_a_track";
const STORAGE_KEY_DECK_B_TRACK = "piko_studio_deck_b_track";

export interface DeckState {
  trackName: string | null;
  audioBuffer: AudioBuffer | null;
  sourceNode: AudioBufferSourceNode | null;
  isPlaying: boolean;
  gain: number;
  playbackRate: number;
}

/**
 * useDualDeck - Manages dual-deck audio pipeline
 *
 * Deck A: Site-hosted tracks from public/audio/tracks/
 * Deck B: User-uploaded files
 *
 * Each deck has its own GainNode before connecting to MasterGain,
 * allowing independent volume control and routing.
 *
 * Features:
 * - Independent gain control per deck
 * - Independent playback control
 * - Memory-safe buffer management
 * - AI stem separation support for user uploads
 */
export function useDualDeck() {
  const { audioContext } = useAudioStore();
  const { masterGainNode } = useAudioGraph();

  // Gain nodes for each deck
  const deckAGainRef = useRef<GainNode | null>(null);
  const deckBGainRef = useRef<GainNode | null>(null);

  // Filter nodes for Filter Mode (HPF on outgoing, LPF on incoming)
  const deckAHPFRef = useRef<BiquadFilterNode | null>(null);
  const deckBLPFRef = useRef<BiquadFilterNode | null>(null);

  // Deck states - Hydrate track names from sessionStorage
  const [deckA, setDeckA] = useState<DeckState>(() => {
    const storedTrack = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY_DECK_A_TRACK) : null;
    return {
      trackName: storedTrack,
      audioBuffer: null,
      sourceNode: null,
      isPlaying: false,
      gain: 1.0,
      playbackRate: 1.0,
    };
  });

  const [deckB, setDeckB] = useState<DeckState>(() => {
    const storedTrack = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY_DECK_B_TRACK) : null;
    return {
      trackName: storedTrack,
      audioBuffer: null,
      sourceNode: null,
      isPlaying: false,
      gain: 1.0,
      playbackRate: 1.0,
    };
  });

  // Crossfader position (0.0 = Deck A full, 1.0 = Deck B full, 0.5 = center)
  // Hydrate from sessionStorage on mount
  const [crossfaderPosition, setCrossfaderPosition] = useState(() => {
    if (typeof window === "undefined") return 0.5;
    const stored = sessionStorage.getItem(STORAGE_KEY_CROSSFADER);
    return stored ? parseFloat(stored) : 0.5;
  });

  // Filter Mode state
  const [filterMode, setFilterMode] = useState(false);

  // Slip Mode state - Professional DJ utility
  // When active, maintains a virtual playhead that continues advancing even during scratching/looping
  const [isSlipModeA, setIsSlipModeA] = useState(false);
  const [isSlipModeB, setIsSlipModeB] = useState(false);

  // Virtual playhead timestamps (in seconds) - tracks where the track "should be" playing
  const virtualPlayheadARef = useRef<number>(0);
  const virtualPlayheadBRef = useRef<number>(0);
  const playheadStartTimeARef = useRef<number>(0);
  const playheadStartTimeBRef = useRef<number>(0);
  const lastActualTimeARef = useRef<number>(0);
  const lastActualTimeBRef = useRef<number>(0);

  // Initialize constant-power signal splitter and filter nodes
  useEffect(() => {
    if (!audioContext || !masterGainNode) {
      return;
    }

    // Create constant-power splitter with professional routing
    const { gainNodeA, gainNodeB } = createConstantPowerSplitter(
      audioContext,
      masterGainNode
    );

    deckAGainRef.current = gainNodeA;
    deckBGainRef.current = gainNodeB;

    // Create filter nodes for Filter Mode
    const hpfA = audioContext.createBiquadFilter();
    hpfA.type = "highpass";
    hpfA.frequency.value = 20000; // Start at max (no filtering)
    hpfA.Q.value = 1.0;
    deckAHPFRef.current = hpfA;

    const lpfB = audioContext.createBiquadFilter();
    lpfB.type = "lowpass";
    lpfB.frequency.value = 20; // Start at min (no filtering)
    lpfB.Q.value = 1.0;
    deckBLPFRef.current = lpfB;

    // Apply initial crossfader position (center)
    applyConstantPowerGains(
      gainNodeA,
      gainNodeB,
      crossfaderPosition,
      audioContext
    );

    return () => {
      gainNodeA.disconnect();
      gainNodeB.disconnect();
      hpfA.disconnect();
      lpfB.disconnect();
    };
  }, [audioContext, masterGainNode, crossfaderPosition]);

  /**
   * Load track to Deck A (site-hosted track)
   */
  const loadDeckA = useCallback(
    async (trackPath: string, trackName: string) => {
      if (!audioContext || !deckAGainRef.current) {
        return;
      }

      try {
        // Stop current playback
        if (deckA.sourceNode) {
          deckA.sourceNode.stop();
          deckA.sourceNode.disconnect();
        }

        // Fetch and decode audio
        const response = await fetch(trackPath);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        setDeckA((prev) => ({
          ...prev,
          trackName,
          audioBuffer,
          sourceNode: null,
          isPlaying: false,
        }));

        // Persist to sessionStorage
        if (typeof window !== "undefined") {
          sessionStorage.setItem(STORAGE_KEY_DECK_A_TRACK, trackName);
        }
      } catch (error) {
        console.error("[useDualDeck] Failed to load Deck A:", error);
      }
    },
    [audioContext, deckA.sourceNode]
  );

  /**
   * Load track to Deck B (user upload)
   */
  const loadDeckB = useCallback(
    async (file: File) => {
      if (!audioContext || !deckBGainRef.current) {
        return;
      }

      try {
        // Stop current playback
        if (deckB.sourceNode) {
          deckB.sourceNode.stop();
          deckB.sourceNode.disconnect();
        }

        // Extract track name from filename
        const trackName = file.name
          .replace(/\.[^/.]+$/, "")
          .split(/[-_]/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");

        // Read and decode audio
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const finalTrackName = trackName || "USER UPLOAD";
        setDeckB((prev) => ({
          ...prev,
          trackName: finalTrackName,
          audioBuffer,
          sourceNode: null,
          isPlaying: false,
        }));

        // Persist to sessionStorage
        if (typeof window !== "undefined") {
          sessionStorage.setItem(STORAGE_KEY_DECK_B_TRACK, finalTrackName);
        }

        return audioBuffer; // Return for potential stem separation
      } catch (error) {
        console.error("[useDualDeck] Failed to load Deck B:", error);
        return null;
      }
    },
    [audioContext, deckB.sourceNode]
  );

  /**
   * Play Deck A
   */
  const playDeckA = useCallback(() => {
    if (!audioContext || !deckAGainRef.current || !deckA.audioBuffer) {
      return;
    }

    // Stop if already playing
    if (deckA.sourceNode) {
      deckA.sourceNode.stop();
      deckA.sourceNode.disconnect();
    }

    const source = audioContext.createBufferSource();
    source.buffer = deckA.audioBuffer;
    source.playbackRate.value = deckA.playbackRate;

    // Route through HPF filter if Filter Mode is enabled
    if (filterMode && deckAHPFRef.current) {
      source.connect(deckAHPFRef.current);
      deckAHPFRef.current.connect(deckAGainRef.current);
    } else {
      source.connect(deckAGainRef.current);
    }

    source.onended = () => {
      setDeckA((prev) => ({
        ...prev,
        isPlaying: false,
        sourceNode: null,
      }));
    };

    source.start(0);
    setDeckA((prev) => ({
      ...prev,
      isPlaying: true,
      sourceNode: source,
    }));
  }, [audioContext, deckA.audioBuffer, deckA.playbackRate, deckA.sourceNode]);

  /**
   * Play Deck B
   */
  const playDeckB = useCallback(() => {
    if (!audioContext || !deckBGainRef.current || !deckB.audioBuffer) {
      return;
    }

    // Stop if already playing
    if (deckB.sourceNode) {
      deckB.sourceNode.stop();
      deckB.sourceNode.disconnect();
    }

    const source = audioContext.createBufferSource();
    source.buffer = deckB.audioBuffer;
    source.playbackRate.value = deckB.playbackRate;

    // Route through LPF filter if Filter Mode is enabled
    if (filterMode && deckBLPFRef.current) {
      source.connect(deckBLPFRef.current);
      deckBLPFRef.current.connect(deckBGainRef.current);
    } else {
      source.connect(deckBGainRef.current);
    }

    source.onended = () => {
      setDeckB((prev) => ({
        ...prev,
        isPlaying: false,
        sourceNode: null,
      }));
    };

    source.start(0);

    // Initialize virtual playhead for Slip Mode
    if (isSlipModeB) {
      virtualPlayheadBRef.current = 0;
      playheadStartTimeBRef.current = audioContext.currentTime;
      lastActualTimeBRef.current = 0;
    }

    setDeckB((prev) => ({
      ...prev,
      isPlaying: true,
      sourceNode: source,
    }));
  }, [audioContext, deckB.audioBuffer, deckB.playbackRate, deckB.sourceNode, isSlipModeB]);

  /**
   * Stop Deck A
   */
  const stopDeckA = useCallback(() => {
    if (deckA.sourceNode) {
      deckA.sourceNode.stop();
      deckA.sourceNode.disconnect();
      setDeckA((prev) => ({
        ...prev,
        isPlaying: false,
        sourceNode: null,
      }));
    }
  }, [deckA.sourceNode]);

  /**
   * Stop Deck B
   */
  const stopDeckB = useCallback(() => {
    if (deckB.sourceNode) {
      deckB.sourceNode.stop();
      deckB.sourceNode.disconnect();
      setDeckB((prev) => ({
        ...prev,
        isPlaying: false,
        sourceNode: null,
      }));
    }
  }, [deckB.sourceNode]);

  /**
   * Set gain for Deck A
   */
  const setDeckAGain = useCallback(
    (gain: number) => {
      if (deckAGainRef.current) {
        deckAGainRef.current.gain.value = gain;
        setDeckA((prev) => ({ ...prev, gain }));
      }
    },
    []
  );

  /**
   * Set gain for Deck B
   */
  const setDeckBGain = useCallback(
    (gain: number) => {
      if (deckBGainRef.current) {
        deckBGainRef.current.gain.value = gain;
        setDeckB((prev) => ({ ...prev, gain }));
      }
    },
    []
  );

  /**
   * Clear Deck A buffer (memory cleanup)
   */
  const clearDeckA = useCallback(() => {
    stopDeckA();
    setDeckA({
      trackName: null,
      audioBuffer: null,
      sourceNode: null,
      isPlaying: false,
      gain: 1.0,
      playbackRate: 1.0,
    });

    // Clear sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY_DECK_A_TRACK);
    }
  }, [stopDeckA]);

  /**
   * Clear Deck B buffer (memory cleanup)
   */
  const clearDeckB = useCallback(() => {
    stopDeckB();
    setDeckB({
      trackName: null,
      audioBuffer: null,
      sourceNode: null,
      isPlaying: false,
      gain: 1.0,
      playbackRate: 1.0,
    });

    // Clear sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY_DECK_B_TRACK);
    }
  }, [stopDeckB]);

  /**
   * Set crossfader position (0.0 to 1.0)
   * Applies constant-power curve automatically
   * When Filter Mode is enabled, sweeps HPF on outgoing deck and LPF on incoming deck
   * Persists to sessionStorage for session continuity
   */
  const setCrossfader = useCallback(
    (position: number) => {
      if (!audioContext || !deckAGainRef.current || !deckBGainRef.current) {
        return;
      }

      setCrossfaderPosition(position);
      applyConstantPowerGains(
        deckAGainRef.current,
        deckBGainRef.current,
        position,
        audioContext
      );

      // Apply filter sweeps in Filter Mode
      if (filterMode) {
        const currentTime = audioContext.currentTime;
        const rampTime = 0.02; // Smooth 20ms transitions

        // Deck A (outgoing): HPF sweeps from 20kHz (no filter) to 200Hz (full filter) as position moves to 1.0
        if (deckAHPFRef.current) {
          const hpfFreq = 20000 - position * (20000 - 200); // 20000 -> 200 Hz
          deckAHPFRef.current.frequency.setTargetAtTime(hpfFreq, currentTime, rampTime);
        }

        // Deck B (incoming): LPF sweeps from 20Hz (no filter) to 20kHz (full filter) as position moves to 1.0
        if (deckBLPFRef.current) {
          const lpfFreq = 20 + position * (20000 - 20); // 20 -> 20000 Hz
          deckBLPFRef.current.frequency.setTargetAtTime(lpfFreq, currentTime, rampTime);
        }
      } else {
        // Reset filters to neutral when Filter Mode is off
        if (deckAHPFRef.current) {
          deckAHPFRef.current.frequency.setTargetAtTime(20000, audioContext.currentTime, 0.02);
        }
        if (deckBLPFRef.current) {
          deckBLPFRef.current.frequency.setTargetAtTime(20, audioContext.currentTime, 0.02);
        }
      }

      // Persist to sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem(STORAGE_KEY_CROSSFADER, position.toString());
      }
    },
    [audioContext, filterMode]
  );

  /**
   * Update virtual playhead for Slip Mode
   * Called continuously while playing to track where the track "should be"
   */
  useEffect(() => {
    if (!audioContext || (!isSlipModeA && !isSlipModeB)) return;

    const updatePlayheads = () => {
      const currentTime = audioContext.currentTime;

      // Update Deck A virtual playhead
      if (isSlipModeA && deckA.isPlaying && deckA.audioBuffer) {
        const elapsed = currentTime - playheadStartTimeARef.current;
        virtualPlayheadARef.current = (lastActualTimeARef.current + elapsed * deckA.playbackRate) % deckA.audioBuffer.duration;
      }

      // Update Deck B virtual playhead
      if (isSlipModeB && deckB.isPlaying && deckB.audioBuffer) {
        const elapsed = currentTime - playheadStartTimeBRef.current;
        virtualPlayheadBRef.current = (lastActualTimeBRef.current + elapsed * deckB.playbackRate) % deckB.audioBuffer.duration;
      }
    };

    const interval = setInterval(updatePlayheads, 16); // ~60fps updates
    return () => clearInterval(interval);
  }, [audioContext, isSlipModeA, isSlipModeB, deckA.isPlaying, deckA.audioBuffer, deckA.playbackRate, deckB.isPlaying, deckB.audioBuffer, deckB.playbackRate]);

  /**
   * Seek to virtual playhead (called when releasing scratch/loop in Slip Mode)
   */
  const seekToVirtualPlayheadA = useCallback(() => {
    if (!audioContext || !deckA.sourceNode || !deckA.audioBuffer || !isSlipModeA) return;

    const targetTime = virtualPlayheadARef.current;
    const currentTime = audioContext.currentTime;

    // Stop current playback
    deckA.sourceNode.stop();
    deckA.sourceNode.disconnect();

    // Create new source at virtual playhead position
    const source = audioContext.createBufferSource();
    source.buffer = deckA.audioBuffer;
    source.playbackRate.value = deckA.playbackRate;

    if (filterMode && deckAHPFRef.current) {
      source.connect(deckAHPFRef.current);
      deckAHPFRef.current.connect(deckAGainRef.current);
    } else {
      source.connect(deckAGainRef.current);
    }

    source.onended = () => {
      setDeckA((prev) => ({
        ...prev,
        isPlaying: false,
        sourceNode: null,
      }));
    };

    source.start(0, targetTime);
    lastActualTimeARef.current = targetTime;
    playheadStartTimeARef.current = currentTime;

    setDeckA((prev) => ({
      ...prev,
      sourceNode: source,
    }));
  }, [audioContext, deckA.sourceNode, deckA.audioBuffer, deckA.playbackRate, isSlipModeA, filterMode]);

  const seekToVirtualPlayheadB = useCallback(() => {
    if (!audioContext || !deckB.sourceNode || !deckB.audioBuffer || !isSlipModeB) return;

    const targetTime = virtualPlayheadBRef.current;
    const currentTime = audioContext.currentTime;

    // Stop current playback
    deckB.sourceNode.stop();
    deckB.sourceNode.disconnect();

    // Create new source at virtual playhead position
    const source = audioContext.createBufferSource();
    source.buffer = deckB.audioBuffer;
    source.playbackRate.value = deckB.playbackRate;

    if (filterMode && deckBLPFRef.current) {
      source.connect(deckBLPFRef.current);
      deckBLPFRef.current.connect(deckBGainRef.current);
    } else {
      source.connect(deckBGainRef.current);
    }

    source.onended = () => {
      setDeckB((prev) => ({
        ...prev,
        isPlaying: false,
        sourceNode: null,
      }));
    };

    source.start(0, targetTime);
    lastActualTimeBRef.current = targetTime;
    playheadStartTimeBRef.current = currentTime;

    setDeckB((prev) => ({
      ...prev,
      sourceNode: source,
    }));
  }, [audioContext, deckB.sourceNode, deckB.audioBuffer, deckB.playbackRate, isSlipModeB, filterMode]);

  return {
    deckA,
    deckB,
    loadDeckA,
    loadDeckB,
    playDeckA,
    playDeckB,
    stopDeckA,
    stopDeckB,
    setDeckAGain,
    setDeckBGain,
    clearDeckA,
    clearDeckB,
    crossfaderPosition,
    setCrossfader,
    filterMode,
    setFilterMode,
    isSlipModeA,
    setIsSlipModeA,
    isSlipModeB,
    setIsSlipModeB,
    seekToVirtualPlayheadA,
    seekToVirtualPlayheadB,
    virtualPlayheadA: virtualPlayheadARef.current,
    virtualPlayheadB: virtualPlayheadBRef.current,
  };
}

