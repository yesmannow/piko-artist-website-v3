"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useAudioStore } from "@/stores/useAudioStore";
import { useAudioGraph } from "@/hooks/useAudioGraph";
import type { StemBuffers } from "./useStemSeparator";

export type StemType = "vocals" | "drums" | "bass" | "other";

interface StemState {
  isMuted: boolean;
  isSolo: boolean;
  gain: number;
}

/**
 * useStemRouting - Manages audio routing for separated stems
 *
 * Creates individual GainNodes for each stem and handles:
 * - Mute/Solo functionality
 * - Individual volume control
 * - Routing Drum stem to Sidechain input for pumping effect
 * - Connecting all stems to master gain
 *
 * CRITICAL: The Drum stem is routed to the SidechainProcessor's
 * Input 1 (trigger input) to create accurate "pumping" based on
 * actual kick drum hits, not just general bass frequencies.
 */
export function useStemRouting() {
  const { audioContext } = useAudioStore();
  const { masterGainNode, sidechainNode } = useAudioGraph();

  // Gain nodes for each stem
  const vocalsGainRef = useRef<GainNode | null>(null);
  const drumsGainRef = useRef<GainNode | null>(null);
  const bassGainRef = useRef<GainNode | null>(null);
  const otherGainRef = useRef<GainNode | null>(null);

  // Source nodes (for playback)
  const sourceRefs = useRef<{
    vocals: AudioBufferSourceNode | null;
    drums: AudioBufferSourceNode | null;
    bass: AudioBufferSourceNode | null;
    other: AudioBufferSourceNode | null;
  }>({
    vocals: null,
    drums: null,
    bass: null,
    other: null,
  });

  // Stem states
  const [stemStates, setStemStates] = useState<Record<StemType, StemState>>({
    vocals: { isMuted: false, isSolo: false, gain: 1.0 },
    drums: { isMuted: false, isSolo: false, gain: 1.0 },
    bass: { isMuted: false, isSolo: false, gain: 1.0 },
    other: { isMuted: false, isSolo: false, gain: 1.0 },
  });

  // Initialize gain nodes
  useEffect(() => {
    if (!audioContext || !masterGainNode) {
      return;
    }

    // Create gain nodes for each stem
    const vocalsGain = audioContext.createGain();
    const drumsGain = audioContext.createGain();
    const bassGain = audioContext.createGain();
    const otherGain = audioContext.createGain();

    vocalsGain.gain.value = 1.0;
    drumsGain.gain.value = 1.0;
    bassGain.gain.value = 1.0;
    otherGain.gain.value = 1.0;

    vocalsGainRef.current = vocalsGain;
    drumsGainRef.current = drumsGain;
    bassGainRef.current = bassGain;
    otherGainRef.current = otherGain;

    // Connect all stems to master gain
    vocalsGain.connect(masterGainNode);
    drumsGain.connect(masterGainNode);
    bassGain.connect(masterGainNode);
    otherGain.connect(masterGainNode);

    // CRITICAL: Route Drum stem to Sidechain input
    // This creates the "pumping" effect based on actual kick drum hits
    if (sidechainNode) {
      drumsGain.connect(sidechainNode, 0, 1); // Connect to input 1 (trigger input)
    }

    return () => {
      // Cleanup
      vocalsGain.disconnect();
      drumsGain.disconnect();
      bassGain.disconnect();
      otherGain.disconnect();
    };
  }, [audioContext, masterGainNode, sidechainNode]);

  /**
   * Play separated stems
   */
  const playStems = useCallback(
    (stems: StemBuffers) => {
      if (!audioContext || !masterGainNode) {
        return;
      }

      // Stop any existing playback
      Object.values(sourceRefs.current).forEach((source) => {
        if (source) {
          source.stop();
          source.disconnect();
        }
      });

      // Create and play each stem
      const playStem = (
        buffer: AudioBuffer | null,
        gainNode: GainNode | null,
        key: StemType
      ) => {
        if (!buffer || !gainNode) return;

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(gainNode);
        source.start(0);
        sourceRefs.current[key] = source;
      };

      playStem(stems.vocals, vocalsGainRef.current, "vocals");
      playStem(stems.drums, drumsGainRef.current, "drums");
      playStem(stems.bass, bassGainRef.current, "bass");
      playStem(stems.other, otherGainRef.current, "other");
    },
    [audioContext, masterGainNode]
  );

  /**
   * Toggle mute for a stem
   */
  const toggleMute = useCallback((type: StemType) => {
    setStemStates((prev) => {
      const newState = { ...prev };
      newState[type].isMuted = !newState[type].isMuted;

      // Update gain node
      const gainNode = {
        vocals: vocalsGainRef.current,
        drums: drumsGainRef.current,
        bass: bassGainRef.current,
        other: otherGainRef.current,
      }[type];

      if (gainNode) {
        gainNode.gain.value = newState[type].isMuted ? 0 : newState[type].gain;
      }

      return newState;
    });
  }, []);

  /**
   * Toggle solo for a stem
   */
  const toggleSolo = useCallback(
    (type: StemType) => {
      setStemStates((prev) => {
        const newState = { ...prev };
        const wasSolo = newState[type].isSolo;
        newState[type].isSolo = !wasSolo;

        // If soloing this stem, mute all others
        // If unsoloing, restore previous states
        Object.keys(newState).forEach((key) => {
          const stemKey = key as StemType;
          if (stemKey !== type) {
            if (!wasSolo) {
              // Solo mode: mute others
              newState[stemKey].isMuted = true;
            } else {
              // Unsolo mode: restore others
              newState[stemKey].isMuted = false;
            }

            const gainNode = {
              vocals: vocalsGainRef.current,
              drums: drumsGainRef.current,
              bass: bassGainRef.current,
              other: otherGainRef.current,
            }[stemKey];

            if (gainNode) {
              gainNode.gain.value = newState[stemKey].isMuted
                ? 0
                : newState[stemKey].gain;
            }
          }
        });

        return newState;
      });
    },
    []
  );

  return {
    stemStates,
    playStems,
    toggleMute,
    toggleSolo,
  };
}

