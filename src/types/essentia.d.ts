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
  export namespace EssentiaWASM {
    const EssentiaWASMInterfaced: (options: { locateFile?: (path: string) => string }) => Promise<{
      EssentiaJs: new () => EssentiaJs;
    }>;
  }

  export type EssentiaJs = {
    arrayToVector(data: Float32Array | number[]): { delete: () => void };
    vectorToArray(vec: { delete: () => void }): number[];
    RhythmExtractor2013(vec: { delete: () => void }): {
      bpm: number;
      ticks?: { delete: () => void };
    };
    KeyExtractor(vec: { delete: () => void }): {
      key: string;
      scale: string;
    };
    Danceability(vec: { delete: () => void }): { danceability: number };
    RMS(vec: { delete: () => void }): { rms: number };
  };
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

declare module 'essentia.js' {
  export class EssentiaWASM {
    constructor();
    arrayToVector(array: Float32Array | number[]): unknown;
    RhythmExtractor2013(signal: unknown, sampleRate: number): {
      bpm: number;
      confidence?: number;
      beats?: number[];
      bpmIntervals?: number[];
    };
    KeyExtractor(signal: unknown, sampleRate: number): {
      key: string;
      scale: string;
      strength?: number;
    };
    RMS(signal: unknown): { rms: number };
    delete(object: unknown): void;
    shutdown(): void;
  }
}
