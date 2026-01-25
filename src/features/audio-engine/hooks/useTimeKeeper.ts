"use client";

import { useEffect, useRef, useState } from 'react';
import { AudioContextManager } from '../lib/AudioContextManager';

/**
 * TimeKeeper Hook - Manages metronome and beat synchronization
 *
 * Loads the TimeKeeper AudioWorklet and provides BPM sync for decks.
 */
export interface BeatEvent {
  type: 'beat';
  beatNumber: number;
  timestamp: number;
  bpm: number;
}

export function useTimeKeeper(bpm: number = 120) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<BeatEvent | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const onBeatCallbackRef = useRef<((beat: BeatEvent) => void) | null>(null);

  useEffect(() => {
    const manager = AudioContextManager.getInstance();
    const audioContext = manager.getContext();

    if (!audioContext) {
      return;
    }

    // Load the AudioWorklet module
    const workletUrl = '/worklets/timekeeper-processor.js';

    audioContext.audioWorklet
      .addModule(workletUrl)
      .then(() => {
        setIsLoaded(true);

        // Create the worklet node
        const node = new AudioWorkletNode(audioContext, 'timekeeper-processor', {
          parameterData: {
            bpm: bpm,
          },
        });

        // Listen for beat events
        node.port.onmessage = (event) => {
          const data = event.data;
          if (data.type === 'beat') {
            setCurrentBeat(data);
            onBeatCallbackRef.current?.(data);
          }
        };

        // Connect to a silent destination (processor doesn't need audio output)
        // We just need it running for timing
        const silentGain = audioContext.createGain();
        silentGain.gain.value = 0;
        node.connect(silentGain);
        silentGain.connect(audioContext.destination);

        workletNodeRef.current = node;
      })
      .catch((error) => {
        console.error('[useTimeKeeper] Failed to load worklet:', error);
      });

    // Cleanup
    return () => {
      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect();
        workletNodeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // bpm is intentionally excluded - initial value is set here, updates handled in separate effect below
  }, []);

  // Update BPM when it changes
  useEffect(() => {
    if (workletNodeRef.current && isLoaded) {
      workletNodeRef.current.parameters.get('bpm')?.setValueAtTime(bpm, 0);
    }
  }, [bpm, isLoaded]);

  /**
   * Subscribe to beat events
   */
  const onBeat = (callback: (beat: BeatEvent) => void) => {
    onBeatCallbackRef.current = callback;
  };

  return {
    isLoaded,
    currentBeat,
    onBeat,
  };
}
