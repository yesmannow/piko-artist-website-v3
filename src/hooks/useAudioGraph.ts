"use client";

import { useRef, useEffect } from "react";
import { useAudioStore } from "@/stores/useAudioStore";

/**
 * useAudioGraph - Hook for setting up the audio processing graph
 *
 * Creates and wires together the audio nodes:
 * - MasterGain -> DynamicsCompressor (Limiter) -> Analyser -> destination
 * - AudioWorkletNode for sidechain processing (ready for connection)
 *
 * The AudioContext is managed by the Zustand store (Singleton pattern).
 * This hook sets up the processing chain and provides frequency data for visualization.
 *
 * @returns {Object} - Audio graph utilities
 * @returns {Function} getFrequencyData - Returns Uint8Array for visualizer
 * @returns {AudioNode} masterGainNode - Master gain node for volume control
 * @returns {AudioWorkletNode} sidechainNode - Sidechain processor node
 * @returns {AnalyserNode} analyserNode - Analyser for frequency data
 */
export function useAudioGraph() {
  const { audioContext, isReady } = useAudioStore();

  // Audio node refs
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const limiterRef = useRef<DynamicsCompressorNode | null>(null);
  const sidechainNodeRef = useRef<AudioWorkletNode | null>(null);

  // Initialize audio graph when context is ready
  useEffect(() => {
    if (!audioContext || !isReady) {
      return;
    }

    try {
      // 1. Create Master Gain Node (Volume Control)
      const masterGain = audioContext.createGain();
      masterGain.gain.value = 1.0; // Full volume by default
      masterGainRef.current = masterGain;

      // 2. Create Dynamics Compressor (Limiter)
      // Prevents clipping and provides professional mastering
      const limiter = audioContext.createDynamicsCompressor();
      limiter.threshold.value = -24; // dB threshold
      limiter.knee.value = 30; // Soft knee
      limiter.ratio.value = 12; // High ratio for limiting
      limiter.attack.value = 0.003; // Fast attack
      limiter.release.value = 0.25; // Smooth release
      limiterRef.current = limiter;

      // 3. Create Analyser Node (for visualizer)
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048; // Higher resolution for better visualization
      analyser.smoothingTimeConstant = 0.8; // Smooth transitions
      analyserRef.current = analyser;

      // 4. Create AudioWorkletNode for sidechain processing
      // This runs on the audio thread (not main thread) for zero-latency DSP
      // Note: AudioWorklet may fail if worklet module isn't loaded yet - make it optional
      try {
        const sidechainNode = new AudioWorkletNode(audioContext, "sidechain-processor", {
          numberOfInputs: 2, // Music input + Trigger input
          numberOfOutputs: 1, // Processed output
          channelCount: 2, // Stereo
        });

        // Set default sidechain parameters
        sidechainNode.parameters.get("threshold")!.value = 0.5;
        sidechainNode.parameters.get("ratio")!.value = 4.0;
        sidechainNode.parameters.get("release")!.value = 0.1;
        sidechainNodeRef.current = sidechainNode;
      } catch (workletError) {
        // AudioWorklet may not be available or module not loaded yet
        // This is non-critical - the audio graph will still work without sidechain
        console.warn("[useAudioGraph] AudioWorklet not available, continuing without sidechain:", workletError);
        sidechainNodeRef.current = null;
      }

      // 5. Wire the audio graph:
      // MasterGain -> Limiter -> Analyser -> destination
      masterGain.connect(limiter);
      limiter.connect(analyser);
      analyser.connect(audioContext.destination);

      // Note: Sidechain node is created but not connected yet
      // It will be connected when decks are set up (music -> sidechain -> masterGain)

    } catch (error) {
      console.error("[useAudioGraph] Failed to create audio graph:", error);
    }

    // Cleanup: Disconnect all nodes on unmount
    // Note: We don't close the AudioContext (it persists in the store)
    return () => {
      if (masterGainRef.current) {
        masterGainRef.current.disconnect();
        masterGainRef.current = null;
      }
      if (limiterRef.current) {
        limiterRef.current.disconnect();
        limiterRef.current = null;
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      if (sidechainNodeRef.current) {
        sidechainNodeRef.current.disconnect();
        sidechainNodeRef.current = null;
      }
    };
  }, [audioContext, isReady]);

  /**
   * getFrequencyData - Returns frequency data for visualization
   *
   * Returns a Uint8Array where each value represents the amplitude
   * of a frequency bin (0-255). This is used by visualizers to display
   * audio-reactive graphics.
   *
   * @returns {Uint8Array | null} - Frequency data array or null if not ready
   */
  const getFrequencyData = (): Uint8Array | null => {
    if (!analyserRef.current) {
      return null;
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    return dataArray;
  };

  /**
   * stopWithTapeEffect - Physics-based tape stop
   *
   * Simulates the deceleration of a physical turntable by using
   * an exponential deceleration curve instead of instant stop.
   *
   * This creates a professional "analog weight" feel to the digital interface.
   *
   * @param sourceNode - The AudioBufferSourceNode to stop
   * @param duration - Deceleration duration in seconds (default: 0.8s)
   */
  const stopWithTapeEffect = (
    sourceNode: AudioBufferSourceNode,
    duration: number = 0.8
  ) => {
    if (!audioContext || !sourceNode.playbackRate) {
      return;
    }

    const currentTime = audioContext.currentTime;
      const _currentRate = sourceNode.playbackRate.value;

    // Exponential deceleration to near-zero (0.001 to avoid division by zero)
    // This creates the smooth "tape stop" feel
    sourceNode.playbackRate.exponentialRampToValueAtTime(
      0.001,
      currentTime + duration
    );

    // Stop the source after deceleration completes
    setTimeout(() => {
      try {
        sourceNode.stop();
      } catch {
        // Source may already be stopped
      }
    }, duration * 1000);
  };

  return {
    getFrequencyData,
    masterGainNode: masterGainRef.current,
    sidechainNode: sidechainNodeRef.current,
    analyserNode: analyserRef.current,
    stopWithTapeEffect,
    isReady: isReady && analyserRef.current !== null,
  };
}

