"use client";

import { useEffect, useRef, useState } from 'react';
import { AudioContextManager } from '../lib/AudioContextManager';

/**
 * useAudioWorklet - Hook for loading and managing AudioWorklet processors
 *
 * Handles the loading of AudioWorklet modules and provides access to worklet nodes.
 * The worklet runs on the audio thread, isolated from the React render cycle.
 */

export function useAudioWorklet(processorName: string = 'meter-processor') {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  useEffect(() => {
    const manager = AudioContextManager.getInstance();
    const audioContext = manager.getContext();

    if (!audioContext) {
      setError(new Error('AudioContext not available'));
      return;
    }

    // Determine the correct worklet URL for dev vs prod
    // In Next.js, public files are served from root
    const workletUrl = `/worklets/${processorName}.js`;

    // Load the AudioWorklet module
    audioContext.audioWorklet
      .addModule(workletUrl)
      .then(() => {
        setIsLoaded(true);
        setError(null);
      })
      .catch((err) => {
        console.error(`[useAudioWorklet] Failed to load worklet ${processorName}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
      });

    // Cleanup: disconnect worklet node if it exists
    return () => {
      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect();
        workletNodeRef.current = null;
      }
    };
  }, [processorName]);

  /**
   * Create an AudioWorkletNode for the loaded processor
   *
   * @param options - Options to pass to the AudioWorkletNode constructor
   * @returns The AudioWorkletNode, or null if not loaded
   */
  const createNode = (options?: AudioWorkletNodeOptions): AudioWorkletNode | null => {
    if (!isLoaded) {
      console.warn('[useAudioWorklet] Worklet not loaded yet');
      return null;
    }

    const manager = AudioContextManager.getInstance();
    const audioContext = manager.getContext();

    if (!audioContext) {
      return null;
    }

    try {
      const node = new AudioWorkletNode(audioContext, processorName, options);
      workletNodeRef.current = node;
      return node;
    } catch (err) {
      console.error('[useAudioWorklet] Failed to create worklet node:', err);
      return null;
    }
  };

  return {
    isLoaded,
    error,
    createNode,
    workletNode: workletNodeRef.current,
  };
}
