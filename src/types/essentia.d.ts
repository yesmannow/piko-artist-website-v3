/**
 * Type declarations for essentia.js
 * 
 * Essentia.js is a JavaScript/WebAssembly library for audio and music analysis
 * https://mtg.github.io/essentia.js/
 */

declare module 'essentia.js/dist/essentia-wasm.web.js' {
  export function EssentiaWASM(): Promise<any>;
}

declare module 'essentia.js/dist/essentia.js-core.es.js' {
  export default class Essentia {
    constructor(wasm: any);
    arrayToVector(array: Float32Array | number[]): any;
    RhythmExtractor2013(signal: any, sampleRate: number): {
      bpm: number;
      confidence?: number;
      beats?: number[];
      bpmIntervals?: number[];
      danceability?: number;
    };
    KeyExtractor(signal: any, sampleRate: number): {
      key: string;
      scale: string;
      strength?: number;
    };
    RMS(signal: any): number;
    delete(object: any): void;
    shutdown(): void;
  }
}

declare module 'essentia.js' {
  export class EssentiaWASM {
    constructor();
    
    /**
     * Convert JavaScript array to Essentia vector
     */
    arrayToVector(array: Float32Array | number[]): any;
    
    /**
     * Extract rhythm features including BPM
     */
    RhythmExtractor2013(signal: any, sampleRate: number): {
      bpm: number;
      confidence?: number;
      beats?: number[];
      bpmIntervals?: number[];
    };
    
    /**
     * Extract musical key and scale
     */
    KeyExtractor(signal: any, sampleRate: number): {
      key: string;
      scale: string;
      strength?: number;
    };
    
    /**
     * Calculate RMS (Root Mean Square) energy
     */
    RMS(signal: any): {
      rms: number;
    };
    
    /**
     * Delete C++ objects to prevent memory leaks
     */
    delete(object: any): void;
    
    /**
     * Shutdown the WASM module
     */
    shutdown(): void;
  }
}
