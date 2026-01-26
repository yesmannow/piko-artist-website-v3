/**
 * Essentia.js Worker for Audio Analysis
 * 
 * Performs BPM, key, and energy analysis using Essentia.js in a Web Worker
 * Prevents UI blocking during analysis
 */

import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.web.js';
import Essentia from 'essentia.js/dist/essentia.js-core.es.js';

let essentiaInstance: Essentia | null = null;
const wasmCandidates = [
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ESSENTIA_WASM_URL : undefined,
  typeof self !== 'undefined' ? `${self.location.origin}/wasm/essentia-wasm.web.wasm` : undefined,
].filter(Boolean) as string[];

// Initialize Essentia.js
async function initEssentia() {
  if (essentiaInstance) return;
  if (typeof crossOriginIsolated !== 'undefined' && !crossOriginIsolated) {
    self.postMessage({
      type: 'error',
      message: 'Essentia analysis requires COOP/COEP (crossOriginIsolated). Please enable security headers.',
    });
    return;
  }

  try {
    let lastError: unknown;

    for (const candidate of wasmCandidates) {
      try {
        const wasm = await EssentiaWASM({
          locateFile: (path: string) => (path.endsWith('.wasm') ? candidate : path),
        });
        essentiaInstance = new Essentia(wasm);
        console.log('[EssentiaWorker] Essentia.js initialized from', candidate);
        return;
      } catch (error) {
        lastError = error;
        console.warn('[EssentiaWorker] Failed to load Essentia WASM from', candidate, error);
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Failed to initialize Essentia.js');
  } catch (error) {
    console.error('[EssentiaWorker] Failed to initialize Essentia:', error);
    throw error;
  }
}

// Handle messages from main thread
self.onmessage = async (e: MessageEvent) => {
  const { audioBuffer, trackId, sampleRate } = e.data;

  try {
    // Initialize if needed
    if (!essentiaInstance) {
      await initEssentia();
    }
    if (!essentiaInstance) {
      throw new Error('Essentia failed to initialize');
    }

    // Convert AudioBuffer to Float32Array
    // AudioBuffer is transferred, so we need to extract the data
    let audioData: Float32Array;
    if (audioBuffer instanceof AudioBuffer) {
      audioData = audioBuffer.getChannelData(0); // Use first channel (mono)
    } else if (audioBuffer instanceof Float32Array) {
      audioData = audioBuffer;
    } else {
      throw new Error('Invalid audioBuffer format');
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
    self.postMessage({
      trackId,
      bpm: Math.round(bpm * 10) / 10, // Round to 1 decimal
      key: keyString,
      energy: Math.round(energy * 100) / 100, // Round to 2 decimals
      danceability: Math.round(danceability * 100) / 100,
    });
  } catch (error) {
    console.error('[EssentiaWorker] Analysis error:', error);
    self.postMessage({
      trackId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
