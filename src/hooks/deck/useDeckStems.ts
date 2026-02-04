/**
 * useDeckStems Hook
 *
 * Handles stem generation, loading, and management for a deck
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioEngine } from '@/hooks/audio/useAudioEngine';
import { useStore } from '@/store/useStore';
import { useStudioStore } from '@/store/useStudioStore';
import { useStemWorker } from '@/hooks/audio/useStemWorker';
import { decodeStemsToAudioBuffers } from '@/utils/stems/decodeStems';
import type { StemChannels } from '@/workers/stem.types';

interface UseDeckStemsProps {
  deckId: 'A' | 'B';
  trackUrl: string | null | undefined;
  trackId: string | null | undefined;
}

type StemKey = 'vocals' | 'drums' | 'bass' | 'other';
type StemBufferMap = Record<StemKey, AudioBuffer | null>;

// Helper: Decode audio to mono buffer
async function decodeAudioToMono(
  arrayBuffer: ArrayBuffer,
  decodeContextRef: { current: AudioContext | null }
): Promise<Float32Array> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LocalGlobal = globalThis as any;
  const AudioContextCtor = LocalGlobal.AudioContext ?? LocalGlobal.webkitAudioContext;
  if (!AudioContextCtor) {
    throw new Error('AudioContext is not supported in this browser');
  }
  const decodeContext = decodeContextRef.current ?? new AudioContextCtor();
  decodeContextRef.current = decodeContext;
  const decoded = await decodeContext.decodeAudioData(arrayBuffer.slice(0));

  const channels = Math.min(decoded.numberOfChannels, 2);
  const length = decoded.length;
  const mono = new Float32Array(new ArrayBuffer(length * Float32Array.BYTES_PER_ELEMENT));
  for (let ch = 0; ch < channels; ch++) {
    const data = decoded.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      mono[i] += data[i] / channels;
    }
  }
  return mono;
}

// Helper: Convert stem channels to buffer map
function convertStemsToBufferMap(
  stems: StemChannels,
  audioContext: AudioContext
): StemBufferMap {
  const decodedBuffers = decodeStemsToAudioBuffers(stems, audioContext);
  return {
    vocals: decodedBuffers.vocals ?? null,
    drums: decodedBuffers.drums ?? null,
    bass: decodedBuffers.bass ?? null,
    other: decodedBuffers.other ?? null,
  };
}

export function useDeckStems({ deckId, trackUrl, trackId }: UseDeckStemsProps) {
  const { loadStems } = useAudioEngine();
  const deckKey: 'deckA' | 'deckB' = deckId === 'A' ? 'deckA' : 'deckB';
  const deck = useStore((state) => state[deckKey]);
  const stemsForDeck = useStudioStore((state) => state.stems[deckId]);
  const setStems = useStudioStore((state) => state.setStems);
  const markStemsReady = useStudioStore((state) => state.markStemsReady);
  const stemGenerationRequest = useStudioStore((state) => state.stemGenerationRequest);
  const autoStem = useStudioStore((state) => state.autoStem);

  const stemModelUrl = process.env.NEXT_PUBLIC_STEM_MODEL_URL ?? '/models/stems.onnx';
  const {
    init: initStemWorker,
    initializing: stemInitializing,
    error: stemWorkerError,
    separate: separateStems,
  } = useStemWorker(stemModelUrl);

  const [isGeneratingStems, setIsGeneratingStems] = useState(false);
  const [stemError, setStemError] = useState<string | null>(null);
  const decodeContextRef = useRef<AudioContext | null>(null);
  const autoStemRef = useRef(false);

  const hasStems = Object.values(stemsForDeck).some(Boolean);
  const canGenerateStems = Boolean(trackUrl) && !isGeneratingStems && !hasStems && !stemInitializing;

  const handleSplitStems = useCallback(async () => {
    if (!trackUrl) return;
    setStemError(null);
    setIsGeneratingStems(true);

    try {
      await initStemWorker();

      const response = await fetch(trackUrl);
      const arrayBuffer = await response.arrayBuffer();

      const mono = await decodeAudioToMono(arrayBuffer, decodeContextRef);

      const stemJobId = deck.trackKey ?? trackUrl;
      const stems: StemChannels = await separateStems(stemJobId, mono.buffer as ArrayBuffer, 1);

      if (!stems || Object.keys(stems).length === 0) {
        throw new Error('Stem separation returned no data');
      }

      const context = decodeContextRef.current;
      if (!context) {
        throw new Error('AudioContext not available');
      }
      const stemBuffers = convertStemsToBufferMap(stems, context);

      if (Object.values(stemBuffers).some(Boolean)) {
        await loadStems(deckId, stemBuffers);
        setStems(deckId, stemBuffers);
        if (trackId) {
          markStemsReady(trackId, true);
        }
        console.log('[Deck] Stems loaded into audio engine');
      } else {
        console.warn('[Deck] No stem buffers available, skipping loadStems');
      }
    } catch (error) {
      console.error('[Deck] Failed to generate stems:', error);
      setStemError(error instanceof Error ? error.message : 'Stem generation failed');
    } finally {
      setIsGeneratingStems(false);
    }
  }, [
    deck.trackKey,
    deckId,
    initStemWorker,
    loadStems,
    markStemsReady,
    separateStems,
    setStems,
    trackId,
    trackUrl,
  ]);

  // Handle explicit stem generation request
  useEffect(() => {
    if (stemGenerationRequest?.deck !== deckId) return;
    if (canGenerateStems) {
      handleSplitStems();
    }
  }, [canGenerateStems, deckId, handleSplitStems, stemGenerationRequest]);

  // Handle auto-stem when enabled
  useEffect(() => {
    if (!autoStem || !trackUrl || !deck.isLoaded) {
      autoStemRef.current = false;
      return;
    }
    if (autoStemRef.current || hasStems || !canGenerateStems) return;
    autoStemRef.current = true;
    handleSplitStems();
  }, [autoStem, canGenerateStems, deck.isLoaded, handleSplitStems, hasStems, trackUrl]);

  return {
    hasStems,
    canGenerateStems,
    isGeneratingStems,
    stemError,
    stemWorkerError,
    stemInitializing,
    handleSplitStems,
  };
}
