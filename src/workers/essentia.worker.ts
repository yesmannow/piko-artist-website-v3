/**
 * Essentia.js Worker for Audio Analysis
 *
 * Performs BPM, key, and energy analysis using Essentia.js in a Web Worker
 * Prevents UI blocking during analysis
 */

import { EssentiaWASM } from 'essentia.js';

let essentiaInstance = null;
let initializationPromise: Promise<void> | null = null;
let isInitialized = false;

// Initialize Essentia.js with proper race condition handling
const initEssentia = async () => {
  if (isInitialized && essentiaInstance) return;
  if (initializationPromise !== null) return initializationPromise;

  initializationPromise = (async () => {
    try {
      const factory = (EssentiaWASM as unknown as {
        EssentiaWASMInterfaced: (options: { locateFile: (path: string) => string }) => Promise<any>;
      }).EssentiaWASMInterfaced;

      const EssentiaWASMModule = await factory({
        locateFile: (path: string) =>
          path.includes('wasm') ? '/wasm/essentia-wasm.web.wasm' : `/wasm/${path}`,
      });

      essentiaInstance = new EssentiaWASMModule.EssentiaJs();
      isInitialized = true;
      console.log('[EssentiaWorker] Initialized successfully');
    } catch (error) {
      console.error('[EssentiaWorker] Initialization failed:', error);
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
};

// Handle messages from main thread
globalThis.onmessage = async (e: MessageEvent) => {
  try {
    await initEssentia();
  } catch (error) {
    globalThis.postMessage({
      type: 'error',
      message: 'Essentia.js initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }

  if (!essentiaInstance) {
    globalThis.postMessage({
      type: 'error',
      message: 'Essentia.js failed to initialize. Cannot process the message.',
    });
    return;
  }

  const { audioBuffer, trackId, sampleRate } = e.data;

  try {
    // Convert AudioBuffer to Float32Array
    // AudioBuffer is transferred, so we need to extract the data
    let audioData: Float32Array;
    if (audioBuffer instanceof AudioBuffer) {
      audioData = audioBuffer.getChannelData(0); // Use first channel (mono)
    } else if (audioBuffer instanceof Float32Array) {
      audioData = audioBuffer;
    } else {
      throw new TypeError('Invalid audioBuffer format');
    }

    // Convert to Essentia vector
    const audioVector = essentiaInstance.arrayToVector(audioData);

    // Perform Rhythm Extraction (BPM)
    const rhythmExtractor = essentiaInstance.RhythmExtractor2013(audioVector, sampleRate);
    const bpm = rhythmExtractor.bpm || 0;
    const danceability = rhythmExtractor.danceability || 0;

    // Clean up rhythm extractor
    essentiaInstance.delete(rhythmExtractor);

    // Perform Key Extraction
    const keyExtractor = essentiaInstance.KeyExtractor(audioVector, sampleRate);
    const key = keyExtractor.key || '';
    const scale = keyExtractor.scale || '';
    const keyString = key && scale ? `${key} ${scale}` : '';

    // Clean up key extractor
    essentiaInstance.delete(keyExtractor);

    // Calculate RMS (energy)
    const rmsResult = essentiaInstance.RMS(audioVector) as { rms?: number } | number;
    const rmsValue = typeof rmsResult === 'number' ? rmsResult : rmsResult?.rms ?? 0;
    const energy = Math.min(1, Math.max(0, rmsValue / 0.3)); // Normalize to 0-1 range

    // Clean up RMS object if applicable
    if (typeof rmsResult === 'object' && rmsResult !== null) {
      essentiaInstance.delete(rmsResult);
    }

    // Clean up audio vector
    essentiaInstance.delete(audioVector);

    // Send results back to main thread
    globalThis.postMessage({
      trackId,
      bpm: Math.round(bpm * 10) / 10, // Round to 1 decimal
      key: keyString,
      energy: Math.round(energy * 100) / 100, // Round to 2 decimals
      danceability: Math.round(danceability * 100) / 100,
    });
  } catch (error) {
    console.error('[EssentiaWorker] Analysis error:', error);
    globalThis.postMessage({
      trackId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
