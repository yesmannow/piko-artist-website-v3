/**
 * Shared types for Essentia.js workers
 */

export type Deletable = { delete?: () => void };

export type EssentiaVector = Deletable & Record<string, unknown>;

export interface RhythmResult extends Deletable {
  bpm?: number;
  ticks?: EssentiaVector;
  danceability?: number;
}

export interface KeyResult extends Deletable {
  key?: string;
  scale?: string;
  strength?: number;
}

export type RmsObjectResult = Deletable & { rms?: number };

export type RmsResult = number | RmsObjectResult;

export interface EssentiaApi {
  arrayToVector: (data: Float32Array) => EssentiaVector;
  vectorToArray?: (vec: EssentiaVector) => number[];
  RhythmExtractor2013: (vec: EssentiaVector, sampleRate?: number) => RhythmResult;
  KeyExtractor: (vec: EssentiaVector, sampleRate?: number) => KeyResult;
  Danceability?: (vec: EssentiaVector) => Deletable & { danceability?: number };
  RMS: (vec: EssentiaVector) => RmsResult;
  delete: (obj: unknown) => void;
}

export interface AnalysisResult {
  bpm: number;
  key: string;
  scale: string;
  energy: number;
  danceability: number;
  beatGrid: number[];
  keyNoteNumber?: number;
  keyFrequencyHz?: number;
}
