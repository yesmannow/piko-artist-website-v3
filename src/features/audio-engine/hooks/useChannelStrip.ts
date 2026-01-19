"use client";

import { useRef, useEffect } from 'react';
import { AudioContextManager } from '../lib/AudioContextManager';
import { MasterBus } from '../lib/MasterBus';
import { createAnalysers } from '../lib/AnalyserManager';

/**
 * Channel Strip Node References
 *
 * Represents a complete DJ mixer channel strip with:
 * - Source node (AudioBufferSourceNode - created per track)
 * - Gain (Trim control)
 * - 3-band EQ (Low-shelf, Peaking, High-shelf)
 * - Stereo Panner (Balance)
 * - Output to master bus
 */
export interface ChannelStripNodes {
  // Source is created per track, so we don't store it here
  trimGain: GainNode;
  lowFilter: BiquadFilterNode;
  midFilter: BiquadFilterNode;
  highFilter: BiquadFilterNode;
  panner: StereoPannerNode;
  // Analyser nodes for visualization
  pflAnalyser: AnalyserNode; // Pre-Fader Listen (before trim gain)
  postFaderAnalyser: AnalyserNode; // Post-Fader (after panner)
}

/**
 * createChannelStrip - Factory function to create a channel strip
 *
 * Creates and connects all nodes in the correct order:
 * Source → Trim Gain → Low EQ → Mid EQ → High EQ → Panner → (output)
 *
 * @param audioContext - The AudioContext to create nodes in
 * @returns ChannelStripNodes with all node references
 */
export function createChannelStrip(audioContext: AudioContext): ChannelStripNodes {
  // 1. Trim Gain (Volume control)
  const trimGain = audioContext.createGain();
  trimGain.gain.value = 1.0; // Default: unity gain

  // 2. Low-shelf Filter (Bass)
  const lowFilter = audioContext.createBiquadFilter();
  lowFilter.type = 'lowshelf';
  lowFilter.frequency.value = 200; // Hz
  lowFilter.gain.value = 0; // Default: no boost/cut

  // 3. Peaking Filter (Mid)
  const midFilter = audioContext.createBiquadFilter();
  midFilter.type = 'peaking';
  midFilter.frequency.value = 1000; // Hz
  midFilter.Q.value = 1.0;
  midFilter.gain.value = 0; // Default: no boost/cut

  // 4. High-shelf Filter (Treble)
  const highFilter = audioContext.createBiquadFilter();
  highFilter.type = 'highshelf';
  highFilter.frequency.value = 5000; // Hz
  highFilter.gain.value = 0; // Default: no boost/cut

  // 5. Stereo Panner (Balance)
  const panner = audioContext.createStereoPanner();
  panner.pan.value = 0; // Default: center

  // 6. Create analyser nodes
  const analysers = createAnalysers(audioContext);

  // Connect the chain: Trim → Low → Mid → High → Panner
  trimGain.connect(lowFilter);
  lowFilter.connect(midFilter);
  midFilter.connect(highFilter);
  highFilter.connect(panner);

  // Connect analysers:
  // PFL: Tap before trim gain (for cue monitoring)
  trimGain.connect(analysers.pfl);
  // Post-Fader: Tap after panner (for main output visualization)
  panner.connect(analysers.postFader);

  return {
    trimGain,
    lowFilter,
    midFilter,
    highFilter,
    panner,
    pflAnalyser: analysers.pfl,
    postFaderAnalyser: analysers.postFader,
  };
}

/**
 * useChannelStrip - Hook to create and manage a channel strip
 *
 * @param deckId - Optional identifier for the deck (e.g., 'A', 'B')
 * @returns ChannelStripNodes or null if AudioContext not available
 */
export function useChannelStrip(deckId?: string) {
  const stripRef = useRef<ChannelStripNodes | null>(null);

  useEffect(() => {
    const manager = AudioContextManager.getInstance();
    const audioContext = manager.getContext();

    if (!audioContext) {
      console.warn('[useChannelStrip] AudioContext not available');
      return;
    }

    // Create the channel strip
    stripRef.current = createChannelStrip(audioContext);

    // Connect to Master Bus instead of directly to destination
    const masterBus = MasterBus.getInstance();
    const masterInput = masterBus.getInput();
    if (masterInput && stripRef.current) {
      stripRef.current.panner.connect(masterInput);
    }

    // Cleanup: disconnect all nodes
    return () => {
      if (stripRef.current) {
        const { trimGain, lowFilter, midFilter, highFilter, panner, pflAnalyser, postFaderAnalyser } = stripRef.current;

        // Disconnect analysers
        pflAnalyser.disconnect();
        postFaderAnalyser.disconnect();

        // Disconnect in reverse order
        panner.disconnect();
        highFilter.disconnect();
        midFilter.disconnect();
        lowFilter.disconnect();
        trimGain.disconnect();

        stripRef.current = null;
      }
    };
  }, [deckId]);

  return stripRef.current;
}
