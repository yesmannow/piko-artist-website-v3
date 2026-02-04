/**
 * Audio Analysis Worker
 * Performs BPM, key, and energy analysis using Essentia.js
 *
 * IMPORTANT: Uses dynamic import to avoid SSR/build-time WASM loading issues
 */

import { freqToMidi } from '@/lib/utils/audioMath';

type Deletable = { delete?: () => void };

type EssentiaVector = Deletable & Record<string, unknown>;

type RhythmResult = Deletable & {
  bpm?: number;
  ticks?: EssentiaVector;
};

type KeyResult = Deletable & {
  key?: string;
  scale?: string;
};

type EssentiaApi = {
  arrayToVector: (data: Float32Array) => EssentiaVector;
  vectorToArray?: (vec: EssentiaVector) => number[];
  RhythmExtractor2013: (vec: EssentiaVector) => RhythmResult;
  KeyExtractor: (vec: EssentiaVector) => KeyResult;
  Danceability?: (vec: EssentiaVector) => Deletable & { danceability?: number };
  RMS: (vec: EssentiaVector) => number | (Deletable & { rms?: number });
  delete: (obj: unknown) => void;
};

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

  const record = candidate as Record<string, unknown>;
  if (
    'EssentiaJs' in record &&
    record.EssentiaJs &&
    typeof record.EssentiaJs === 'object' &&
    hasEssentiaApi(record.EssentiaJs)
  ) {
    return record.EssentiaJs as EssentiaApi;
  }

  if (hasEssentiaApi(candidate)) {
    return candidate as EssentiaApi;
  }

  return null;
};

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
  if (essentia) return;

  // Dynamic import to avoid SSR/build-time evaluation
  const importedModuleRaw = await import('essentia.js');
  const importedModule = importedModuleRaw as Record<string, unknown>;
  const moduleDefault = (importedModuleRaw as { default?: unknown }).default ?? null;
  const moduleWasm = (importedModuleRaw as { EssentiaWASM?: unknown }).EssentiaWASM ?? null;
  const defaultWasm =
    (moduleDefault as { EssentiaWASM?: unknown } | null)?.EssentiaWASM ?? null;

  if (process.env.NODE_ENV !== 'production') {
    console.debug(
      '[analysis.worker] imported module keys',
      Object.keys(importedModule ?? {}),
    );
  }

  const candidateEntries: Array<[string, unknown]> = [
    ['imported module', importedModule],
    ['imported module default', moduleDefault],
    ['imported module EssentiaWASM', moduleWasm],
    ['default EssentiaWASM', defaultWasm],
  ];

  let resolvedEssentia: EssentiaApi | null = null;

  for (const [label, candidate] of candidateEntries) {
    if (process.env.NODE_ENV !== 'production') {
      const describe =
        candidate && typeof candidate === 'object'
          ? Object.keys(candidate as Record<string, unknown>)
          : typeof candidate;
      console.debug('[analysis.worker] candidate', label, describe);
    }

    const api = extractEssentiaApi(candidate);
    if (api) {
      resolvedEssentia = api;
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[analysis.worker] resolved Essentia from', label);
      }
      break;
    }
  }

  if (!resolvedEssentia) {
    throw new Error('[analysis.worker] EssentiaJs API object unavailable');
  }

  essentia = resolvedEssentia;
};

globalThis.onmessage = async (e: MessageEvent<{ id: string; audioBuffer: Float32Array }>) => {
  const { id, audioBuffer } = e.data;

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[analysis.worker] received message', { id, sampleLength: audioBuffer.length });
  }

  try {
    await initEssentia();
    if (!essentia) {
      throw new Error('Essentia initialization failed');
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
