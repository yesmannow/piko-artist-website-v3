/**
 * Essentia.js Worker for Audio Analysis
 *
 * Performs BPM, key, and energy analysis using Essentia.js in a Web Worker
 * Prevents UI blocking during analysis
 *
 * IMPORTANT: Uses dynamic import to avoid SSR/build-time WASM loading issues
 */

import type {
  Deletable,
  EssentiaVector,
  RhythmResult,
  KeyResult,
  RmsObjectResult,
  RmsResult,
  EssentiaApi
} from './essentia.types';

// Environment-aware logging
const isDev = () =>
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

const log = {
  debug: (...args: unknown[]) => isDev() && console.debug('[EssentiaWorker]', ...args),
  warn: (...args: unknown[]) => console.warn('[EssentiaWorker]', ...args),
  error: (...args: unknown[]) => console.error('[EssentiaWorker]', ...args),
};

const hasEssentiaApi = (candidate: unknown): candidate is EssentiaApi =>
  !!candidate &&
  typeof candidate === 'object' &&
  typeof (candidate as EssentiaApi).arrayToVector === 'function' &&
  typeof (candidate as EssentiaApi).RhythmExtractor2013 === 'function' &&
  typeof (candidate as EssentiaApi).KeyExtractor === 'function' &&
  typeof (candidate as EssentiaApi).RMS === 'function' &&
  typeof (candidate as EssentiaApi).delete === 'function';

const extractEssentiaApi = (module: unknown): EssentiaApi | null => {
  log.debug('Attempting to extract Essentia API');

  if (!module || typeof module !== 'object') {
    log.debug('Module is not an object');
    return null;
  }

  const record = module as Record<string, any>;
  
  // Try various common export patterns for Essentia.js
  const potentialApis = [
    record.EssentiaWASM,
    record.EssentiaJs,
    record.default,
    record.default?.EssentiaWASM,
    record.default?.EssentiaJs,
    module
  ];

  for (const api of potentialApis) {
    if (hasEssentiaApi(api)) {
      log.debug('Found valid Essentia API');
      return api as EssentiaApi;
    }
  }

  log.warn('Could not find Essentia API in any expected location');
  return null;
};

let essentiaInstance: EssentiaApi | null = null;
let initializationPromise: Promise<void> | null = null;
let isInitialized = false;

// Initialize Essentia.js with proper race condition handling
// Uses dynamic import to load WASM only at runtime in the browser
const initEssentia = async () => {
  if (isInitialized && essentiaInstance) {
    log.debug('Already initialized');
    return;
  }

  if (initializationPromise !== null) {
    log.debug('Initialization in progress');
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      log.debug('Starting Essentia.js initialization');

      let api: EssentiaApi | null = null;
      try {
        const essentiaModule = await import('essentia.js');
        api = extractEssentiaApi(essentiaModule);
      } catch (e) {
        log.warn('Primary import failed, trying fallback...', e);
      }

      if (!api) {
        log.warn('Attempting fallback with direct dist imports...');
        try {
          const wasm = await import('essentia.js/dist/essentia-wasm.web.js') as any;
          const core = await import('essentia.js/dist/essentia.js-core.es.js') as any;
          const fallbackApi = core.Essentia ? new core.Essentia(wasm.EssentiaWASM) : (wasm.EssentiaWASM || wasm.EssentiaJs);
          if (hasEssentiaApi(fallbackApi)) {
            api = fallbackApi;
          }
        } catch (e) {
          log.error('Fallback import failed:', e);
        }
      }

      if (!api) {
        throw new Error('Could not extract Essentia API after all attempts');
      }

      essentiaInstance = api;
      isInitialized = true;
      log.debug('Initialization successful');

    } catch (error) {
      log.error('Initialization failed final:', error);
      initializationPromise = null;
      isInitialized = false;
      throw error;
    }
  })();

  return initializationPromise;
};

// Modularize the onmessage function
const handleAudioProcessing = (audioBuffer: AudioBuffer | Float32Array, sampleRate: number) => {
  if (!essentiaInstance) {
    throw new Error('Essentia instance unavailable');
  }

  const audioData = extractAudioData(audioBuffer);
  const audioVector = essentiaInstance.arrayToVector(audioData);

  const rhythmData = extractRhythmData(audioVector, sampleRate);
  const keyData = extractKeyData(audioVector, sampleRate);
  const energyData = extractEnergyData(audioVector);

  essentiaInstance.delete(audioVector);

  return { ...rhythmData, ...keyData, ...energyData };
};

const extractAudioData = (audioBuffer: AudioBuffer | Float32Array): Float32Array => {
  if (audioBuffer instanceof AudioBuffer) {
    return audioBuffer.getChannelData(0);
  } else if (audioBuffer instanceof Float32Array) {
    return audioBuffer;
  }
  throw new TypeError('Invalid audioBuffer format');
};

const extractRhythmData = (audioVector: EssentiaVector, sampleRate: number) => {
  const rhythmExtractor = essentiaInstance.RhythmExtractor2013(audioVector, sampleRate);
  const bpm = rhythmExtractor?.bpm ?? 0;
  const danceability = rhythmExtractor?.danceability ?? 0;
  deleteIfDeletable(rhythmExtractor);
  return { bpm: Math.round(bpm * 10) / 10, danceability: Math.round(danceability * 100) / 100 };
};

const extractKeyData = (audioVector: EssentiaVector, sampleRate: number) => {
  const keyExtractor = essentiaInstance.KeyExtractor(audioVector, sampleRate);
  const key = keyExtractor?.key ?? '';
  const scale = keyExtractor?.scale ?? '';
  const keyString = key && scale ? `${key} ${scale}` : '';
  deleteIfDeletable(keyExtractor);
  return { key: keyString };
};

const extractEnergyData = (audioVector: EssentiaVector) => {
  const rmsResult = essentiaInstance.RMS(audioVector);
  const rmsValue = typeof rmsResult === 'number' ? rmsResult : rmsResult?.rms ?? 0;
  const energy = Math.min(1, Math.max(0, rmsValue / 0.3));
  deleteIfDeletable(rmsResult);
  return { energy: Math.round(energy * 100) / 100 };
};

// Fix deleteIfDeletable to handle RmsResult
const deleteIfDeletable = (obj: Deletable | null | undefined | number) => {
  if (typeof obj === 'number') return; // Numbers are not deletable
  if (obj && typeof obj.delete === 'function') {
    obj.delete();
  } else if (obj) {
    essentiaInstance?.delete(obj);
  }
};

// Message handler
globalThis.self.onmessage = async (event) => {
  const { audioBuffer, sampleRate, trackId, type } = event.data;

  // Handle ping/pong for readiness check
  if (type === 'ping') {
    globalThis.self.postMessage({ type: 'ready' });
    return;
  }

  try {
    await initEssentia();

    if (!essentiaInstance) {
      // Graceful degradation: return default values instead of throwing
      log.error('Essentia unavailable - returning placeholder values');
      globalThis.self.postMessage({
        trackId,
        result: {
          bpm: 0,
          key: '',
          scale: '',
          energy: 0,
        },
        warning: 'Audio analysis unavailable',
      });
      return;
    }

    const result = handleAudioProcessing(audioBuffer, sampleRate);

    globalThis.self.postMessage({
      trackId,
      result,
    });
  } catch (error) {
    log.error('Analysis failed:', error);
    // Non-blocking error response with placeholder values
    globalThis.self.postMessage({
      trackId,
      result: {
        bpm: 0,
        key: '',
        scale: '',
        energy: 0,
      },
      error: error instanceof Error ? error.message : 'Analysis failed',
    });
  }
};
