/**
 * AnalysisWorker.ts - Web Worker for Essentia
 *
 * Handles audio analysis using Essentia.js for BPM, Key detection, and Energy levels.
 * Runs in a separate thread to avoid blocking the main UI.
 *
 * Phase II: Core Architecture
 */

import { freqToMidi } from '@/lib/utils/audioMath';

/**
 * Analysis result interface
 */
export interface AnalysisResult {
  bpm: number;
  key: string;
  energy: number;
  danceability?: number;
  peaks?: number[];
  keyNoteNumber?: number;
  keyFrequencyHz?: number;
}

const SEMITONE_FROM_A: Record<string, number> = {
  C: -9,
  'C#': -8,
  Db: -8,
  D: -7,
  'D#': -6,
  Eb: -6,
  E: -5,
  F: -4,
  'F#': -3,
  Gb: -3,
  G: -2,
  'G#': -1,
  Ab: -1,
  A: 0,
  'A#': 1,
  Bb: 1,
  B: 2,
};

const keyToFrequency = (key: string) => {
  const match = key.trim().match(/^([A-G])([#b]?)/i);
  if (!match) return null;
  const note = `${match[1].toUpperCase()}${match[2] || ''}`;
  const semitone = SEMITONE_FROM_A[note];
  if (semitone === undefined) return null;
  return 440 * Math.pow(2, semitone / 12);
};

/**
 * AnalysisWorker
 * Wrapper for Essentia.js analysis in a Web Worker context
 */
export class AnalysisWorker {
  private worker: Worker | null = null;

  /**
   * Initialize the analysis worker
   */
  public async init(): Promise<void> {
    // TODO: Implement Web Worker initialization
    // This will load Essentia.js WASM module in a worker thread
    console.log('AnalysisWorker init - TODO: Implement Essentia.js worker');
  }

  /**
   * Analyze audio buffer for BPM, Key, Energy
   */
  public async analyze(audioBuffer: AudioBuffer): Promise<AnalysisResult> {
    // TODO: Implement actual Essentia.js analysis
    // For now, return mock data
    console.log('Analyzing audio buffer...', audioBuffer.duration);

    const key = 'Am';
    const keyFrequencyHz = keyToFrequency(key);
    const keyNoteNumber =
      keyFrequencyHz && keyFrequencyHz > 0
        ? Math.round(freqToMidi(keyFrequencyHz))
        : undefined;

    return {
      bpm: 140,
      key,
      energy: 0.75,
      danceability: 0.8,
      keyFrequencyHz: keyFrequencyHz ?? undefined,
      keyNoteNumber,
    };
  }

  /**
   * Cleanup and terminate worker
   */
  public dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
