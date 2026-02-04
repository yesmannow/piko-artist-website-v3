/**
 * Essentia.js Worker for Audio Analysis
 *
 * Performs BPM, key, and energy analysis using Essentia.js in a Web Worker
 * Prevents UI blocking during analysis
 *
 * IMPORTANT: Uses dynamic import to avoid SSR/build-time WASM loading issues
 */

type Deletable = { delete?: () => void };

type EssentiaVector = Deletable & Record<string, unknown>;

type RhythmResult = Deletable & { bpm?: number; danceability?: number };

type KeyResult = Deletable & { key?: string; scale?: string; strength?: number };

type RmsObjectResult = Deletable & { rms?: number };

type RmsResult = number | RmsObjectResult;

type EssentiaApi = {
  arrayToVector: (data: Float32Array) => EssentiaVector;
  RhythmExtractor2013: (vector: EssentiaVector, sampleRate: number) => RhythmResult;
  KeyExtractor: (vector: EssentiaVector, sampleRate: number) => KeyResult;
  Danceability?: (vector: EssentiaVector) => Deletable & { danceability?: number };
  RMS: (vector: EssentiaVector) => RmsResult;
  delete: (obj: unknown) => void;
};

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

  // Try module.EssentiaJs first (most common case)
  const record = module as Record<string, unknown>;
  if ('EssentiaJs' in record && hasEssentiaApi(record.EssentiaJs)) {
    log.debug('Found API at module.EssentiaJs');
    return record.EssentiaJs as EssentiaApi;
  }

  // Try module.default.EssentiaWASM
  const defaultObj = record.default as Record<string, unknown> | undefined;
  if (defaultObj?.EssentiaWASM && hasEssentiaApi(defaultObj.EssentiaWASM)) {
    log.debug('Found API at module.default.EssentiaWASM');
    return defaultObj.EssentiaWASM as EssentiaApi;
  }

  // Try module.EssentiaWASM
  if (record.EssentiaWASM && hasEssentiaApi(record.EssentiaWASM)) {
    log.debug('Found API at module.EssentiaWASM');
    return record.EssentiaWASM as EssentiaApi;
  }

  // Direct API (rare but possible)
  if (hasEssentiaApi(module)) {
    log.debug('Found API directly on module');
    return module as EssentiaApi;
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

      const module = await import('essentia.js');
      const api = extractEssentiaApi(module);

      if (!api) {
        throw new Error('Could not extract Essentia API from module');
      }

      essentiaInstance = api;
      isInitialized = true;
      log.debug('Initialization successful');

    } catch (error) {
      log.error('Initialization failed:', error);

      // Reset so we can try again on next analysis request
      initializationPromise = null;
      isInitialized = false;

      throw new Error(
        'Essentia.js failed to load. Audio analysis features will be unavailable.'
      );
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
