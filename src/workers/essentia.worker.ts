/**
 * Essentia.js Worker for Audio Analysis
 * 
 * Performs BPM, key, and energy analysis using Essentia.js in a Web Worker
 * Prevents UI blocking during analysis
 */

import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.web.js';
import Essentia from 'essentia.js/dist/essentia.js-core.es.js';

let essentiaInstance: any = null;

// Initialize Essentia.js
async function initEssentia() {
  if (essentiaInstance) return;

  try {
    const wasm = await EssentiaWASM();
    essentiaInstance = new Essentia(wasm);
    console.log('[EssentiaWorker] Essentia.js initialized');
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
    const rms = essentiaInstance.RMS(audioVector);
    const energy = Math.min(1, Math.max(0, rms / 0.3)); // Normalize to 0-1 range

    // Clean up RMS
    essentiaInstance.delete(rms);

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
