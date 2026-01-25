/**
 * analysis.worker.ts - Web Worker for Essentia.js Audio Analysis
 * 
 * Phase VI: Advanced Signal Processing
 * 
 * This worker performs computationally intensive Music Information Retrieval (MIR) tasks
 * in a separate thread to prevent blocking the main UI thread. It handles:
 * - BPM detection (RhythmExtractor2013)
 * - Musical key detection (KeyExtractor)
 * - RMS energy analysis
 * 
 * Critical: All Essentia C++ objects must be manually deleted to prevent memory leaks.
 */

import { EssentiaWASM } from 'essentia.js';

// Analysis result structure
export interface AnalysisResult {
  bpm: number;
  key: string;
  energy: number;
  confidence?: number;
}

// Message types for worker communication
export interface AnalysisMessage {
  type: 'analyze';
  audioData: Float32Array;
  sampleRate: number;
}

export interface WorkerMessage {
  type: string;
  audioData?: Float32Array;
  sampleRate?: number;
  [key: string]: unknown;
}

// Initialize Essentia instance
let essentia: EssentiaWASM | null = null;

/**
 * Initialize Essentia.js WASM module
 */
async function initEssentia(): Promise<void> {
  if (!essentia) {
    const { EssentiaWASM } = await import('essentia.js');
    essentia = new EssentiaWASM();
    console.log('[AnalysisWorker] Essentia.js initialized');
  }
}

/**
 * Perform audio analysis using Essentia.js
 * 
 * @param audioData - Float32Array of audio samples (mono)
 * @param sampleRate - Sample rate of the audio (e.g., 44100)
 * @returns Analysis results
 */
function analyzeAudio(audioData: Float32Array, sampleRate: number): AnalysisResult {
  if (!essentia) {
    throw new Error('Essentia not initialized');
  }

  // Convert Float32Array to Essentia vector
  // CRITICAL: This creates a C++ object that must be manually deleted
  const audioVector = essentia.arrayToVector(audioData);

  try {
    // 1. BPM Detection using RhythmExtractor2013
    // This is the most accurate rhythm extraction algorithm in Essentia
    const rhythmExtractor = essentia.RhythmExtractor2013(audioVector, sampleRate);
    const bpm = rhythmExtractor.bpm;
    const confidence = rhythmExtractor.confidence || 0;
    
    // Delete the result object to free C++ memory
    essentia.delete(rhythmExtractor);

    // 2. Key Detection
    // Extract the predominant musical key (e.g., "C major", "A minor")
    const keyExtractor = essentia.KeyExtractor(audioVector, sampleRate);
    const key = keyExtractor.key || 'Unknown';
    const scale = keyExtractor.scale || '';
    const keyString = scale ? `${key} ${scale}` : key;
    
    // Delete the key extractor result
    essentia.delete(keyExtractor);

    // 3. RMS Energy Analysis
    // Provides a measure of the overall energy/loudness of the track
    const rms = essentia.RMS(audioVector);
    const energy = rms.rms || 0;
    
    // Delete the RMS result
    essentia.delete(rms);

    // Return analysis results
    return {
      bpm: Math.round(bpm),
      key: keyString,
      energy: energy,
      confidence: confidence,
    };
  } finally {
    // CRITICAL: Delete the audio vector to prevent memory leaks
    // This frees the C++ memory allocated by arrayToVector
    essentia.delete(audioVector);
  }
}

/**
 * Worker message handler
 */
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, audioData, sampleRate } = event.data;

  if (type === 'analyze') {
    if (!audioData || !sampleRate) {
      self.postMessage({
        type: 'error',
        error: 'Missing audioData or sampleRate in analyze message',
      });
      return;
    }

    try {
      // Initialize Essentia if not already done
      await initEssentia();

      // Perform analysis
      const result = analyzeAudio(audioData, sampleRate);

      // Send results back to main thread
      self.postMessage({
        type: 'result',
        result,
      });
    } catch (error) {
      // Send error back to main thread
      self.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
};

// Export for TypeScript type checking
export default null as never;
