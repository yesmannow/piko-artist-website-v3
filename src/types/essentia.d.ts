/**
 * Type declarations for essentia.js
 * 
 * Essentia.js is a JavaScript/WebAssembly library for audio and music analysis
 * https://mtg.github.io/essentia.js/
 */

declare module 'essentia.js/dist/essentia-wasm.web.js' {
  export function EssentiaWASM(options?: { locateFile?: (path: string) => string }): Promise<unknown>;
}

declare module 'essentia.js/dist/essentia-wasm.web.wasm?url' {
  const url: string;
  export default url;
}

declare module 'essentia.js' {
  export type EssentiaVector = {
    delete?: () => void;
    [key: string]: unknown;
  };

  export type EssentiaRhythmResult = {
    bpm?: number;
    danceability?: number;
    ticks?: EssentiaVector;
    delete?: () => void;
    [key: string]: unknown;
  };

  export type EssentiaKeyResult = {
    key?: string;
    scale?: string;
    strength?: number;
    delete?: () => void;
    [key: string]: unknown;
  };

  export type EssentiaRmsResult =
    | number
    | {
        rms?: number;
        delete?: () => void;
        [key: string]: unknown;
      };

  export type EssentiaApi = {
    arrayToVector(data: Float32Array | number[]): EssentiaVector;
    vectorToArray?(vec: EssentiaVector): number[];
    RhythmExtractor2013(vector: EssentiaVector, sampleRate?: number): EssentiaRhythmResult;
    KeyExtractor(vector: EssentiaVector, sampleRate?: number): EssentiaKeyResult;
    Danceability?(vector: EssentiaVector): { danceability?: number; delete?: () => void };
    RMS(vector: EssentiaVector): EssentiaRmsResult;
    delete(object: unknown): void;
    [key: string]: unknown;
  };

  export type EssentiaWasmModule = {
    EssentiaJs: EssentiaApi;
    [key: string]: unknown;
  };

  export type EssentiaJsModule = EssentiaWasmModule | EssentiaApi;
}

declare module 'essentia.js/dist/essentia.js-core.es.js' {
  export default class Essentia {
    constructor(wasm: unknown);
    arrayToVector(array: Float32Array | number[]): unknown;
    RhythmExtractor2013(signal: unknown, sampleRate: number): {
      bpm: number;
      confidence?: number;
      beats?: number[];
      bpmIntervals?: number[];
      danceability?: number;
    };
    KeyExtractor(signal: unknown, sampleRate: number): {
      key: string;
      scale: string;
      strength?: number;
    };
    RMS(signal: unknown): { rms?: number } | number;
    delete(object: unknown): void;
    shutdown(): void;
  }
}
