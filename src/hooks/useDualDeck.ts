"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useAudioStore } from "@/stores/useAudioStore";
import { useAudioGraph } from "@/hooks/useAudioGraph";
import { createConstantPowerSplitter, applyConstantPowerGains } from "@/utils/constantPowerSplitter";

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

  // Deck states
  const [deckA, setDeckA] = useState<DeckState>({
    trackName: null,
    audioBuffer: null,
    sourceNode: null,
    isPlaying: false,
    gain: 1.0,
    playbackRate: 1.0,
  });

  const [deckB, setDeckB] = useState<DeckState>({
    trackName: null,
    audioBuffer: null,
    sourceNode: null,
    isPlaying: false,
    gain: 1.0,
    playbackRate: 1.0,
  });

  // Crossfader position (0.0 = Deck A full, 1.0 = Deck B full, 0.5 = center)
  const [crossfaderPosition, setCrossfaderPosition] = useState(0.5);

  // Initialize constant-power signal splitter
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

        setDeckB((prev) => ({
          ...prev,
          trackName: trackName || "USER UPLOAD",
          audioBuffer,
          sourceNode: null,
          isPlaying: false,
        }));

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
    source.connect(deckAGainRef.current);

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
    source.connect(deckBGainRef.current);

    source.onended = () => {
      setDeckB((prev) => ({
        ...prev,
        isPlaying: false,
        sourceNode: null,
      }));
    };

    source.start(0);
    setDeckB((prev) => ({
      ...prev,
      isPlaying: true,
      sourceNode: source,
    }));
  }, [audioContext, deckB.audioBuffer, deckB.playbackRate, deckB.sourceNode]);

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
  }, [stopDeckB]);

  /**
   * Set crossfader position (0.0 to 1.0)
   * Applies constant-power curve automatically
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
    },
    [audioContext]
  );

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
  };
}

