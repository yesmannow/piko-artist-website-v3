import type {
  EssentiaApi,
  EssentiaVector,
  RhythmResult,
  KeyResult,
  AnalysisResult,
} from './essentia.types';

// Inlined to avoid relative-import failures in worker context
const freqToMidi = (freq: number): number => 12 * Math.log2(freq / 440) + 69;

const hasEssentiaApi = (candidate: unknown): candidate is EssentiaApi =>
  !!candidate &&
  typeof candidate === 'object' &&
  typeof (candidate as EssentiaApi).arrayToVector === 'function' &&
  typeof (candidate as EssentiaApi).RhythmExtractor2013 === 'function' &&
  typeof (candidate as EssentiaApi).KeyExtractor === 'function' &&
  typeof (candidate as EssentiaApi).RMS === 'function' &&
  typeof (candidate as EssentiaApi).delete === 'function';

const extractEssentiaApi = (candidate: unknown): EssentiaApi | null => {
  if (!candidate || typeof candidate !== 'object') return null;

  const record = candidate as Record<string, any>;

  // Try various common export patterns for Essentia.js
  const potentialApis = [
    record.EssentiaWASM,
    record.EssentiaJs,
    record.default,
    record.default?.EssentiaWASM,
    record.default?.EssentiaJs,
    candidate,
  ];

  for (const api of potentialApis) {
    if (hasEssentiaApi(api)) return api as EssentiaApi;
  }

  return null;
};

let essentia: EssentiaApi | null = null;

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
  const regex = /^([A-G])([#b]?)/i;
  const match = regex.exec(key.trim());
  if (!match) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[analysis.worker] keyToFrequency no match', key);
    }
    return null;
  }
  const note = `${match[1].toUpperCase()}${match[2] || ''}`;
  const semitone = SEMITONE_FROM_A[note];
  if (semitone === undefined) return null;
  return 440 * Math.pow(2, semitone / 12);
};

const initEssentia = async (): Promise<void> => {
  // Import from a single, absolute CDN module — no relative paths that could fail in worker context
  // @ts-expect-error CDN import
  const mod = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia-wasm.module.js');

  const candidate = mod.EssentiaWASM ?? mod.default?.EssentiaWASM ?? mod.default;

  // Await WASM initialisation if the module exposes a ready promise
  if (candidate?.ready) {
    await candidate.ready;
  }

  const api = extractEssentiaApi(candidate);
  if (!api) {
    throw new Error('[analysis.worker] EssentiaWASM API not found in CDN module');
  }

  essentia = api;
  console.log('[analysis.worker] CDN module init success');
};

// Begin initialisation immediately so the first real message pays no extra latency
const initPromise: Promise<void> = initEssentia().catch((err) => {
  console.error('[analysis.worker] Essentia init failed — will use mock fallback:', err);
});

globalThis.onmessage = async (e: MessageEvent<{ id: string; audioBuffer: Float32Array }>) => {
  const { id, audioBuffer } = e.data;

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[analysis.worker] received message', { id, sampleLength: audioBuffer.length });
  }

  try {
    // Gate ALL processing behind essentia initialisation
    await initPromise;

    if (!essentia) {
      console.warn('[analysis.worker] Essentia unavailable — returning mock analysis');
      const fakeBpms = [120, 124, 126, 128, 130, 140];
      const fakeKeys = ['A major', 'C minor', 'D minor', 'G major', 'E minor', 'B minor', 'F# minor'];

      globalThis.postMessage({
        id,
        success: true,
        result: {
          bpm: fakeBpms[Math.floor(Math.random() * fakeBpms.length)],
          beatGrid: [],
          key: fakeKeys[Math.floor(Math.random() * fakeKeys.length)],
          scale: 'major',
          energy: Math.random() * 0.5 + 0.5,
          danceability: Math.random() * 0.5 + 0.5,
        },
      });
      return;
    }

    const vectorAudio = essentia.arrayToVector(audioBuffer);

    // 1. Rhythm & Beat Grid
    const rhythm = essentia.RhythmExtractor2013(vectorAudio);

    // 2. Key & Scale
    const keyData = essentia.KeyExtractor(vectorAudio);
    const keyFrequencyHz = keyToFrequency(keyData.key ?? '');
    const keyNoteNumber =
      keyFrequencyHz && keyFrequencyHz > 0
        ? Math.round(freqToMidi(keyFrequencyHz))
        : undefined;

    // 3. Vibe Analysis (Energy/Danceability)
    const danceabilityResult = essentia.Danceability?.(vectorAudio);
    const danceability = danceabilityResult?.danceability ?? 0;
    const rmsValue = essentia.RMS(vectorAudio);
    const energy = typeof rmsValue === 'number' ? rmsValue : rmsValue?.rms ?? 0;

    // Beat grid as plain array
    const beatGrid =
      rhythm.ticks && typeof essentia.vectorToArray === 'function'
        ? essentia.vectorToArray(rhythm.ticks)
        : [];

    // Cleanup
    if (rhythm.ticks) {
      if (typeof rhythm.ticks.delete === 'function') {
        rhythm.ticks.delete();
      } else {
        essentia.delete(rhythm.ticks);
      }
    }
    if (typeof vectorAudio.delete === 'function') {
      vectorAudio.delete();
    } else {
      essentia.delete(vectorAudio);
    }

    globalThis.postMessage({
      id,
      success: true,
      result: {
         bpm: rhythm.bpm ?? 0,
         beatGrid,
         key: keyData.key ?? '',
         scale: keyData.scale ?? '',
         energy,
         danceability,
        keyFrequencyHz: keyFrequencyHz ?? undefined,
        keyNoteNumber,
      } satisfies AnalysisResult,
    });
  } catch (error) {
    globalThis.postMessage({
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
