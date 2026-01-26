import { EssentiaWASM } from 'essentia.js';

export interface AnalysisResult {
  bpm: number;
  key: string;
  scale: string;
  energy: number;
  danceability: number;
  beatGrid: number[];
}

type EssentiaModule = {
  EssentiaJs: new () => EssentiaInstance;
};

type EssentiaVector = {
  delete: () => void;
};

type RhythmResult = {
  bpm: number;
  ticks?: EssentiaVector;
};

type KeyResult = {
  key: string;
  scale: string;
};

type EssentiaInstance = {
  arrayToVector: (data: Float32Array) => EssentiaVector;
  vectorToArray: (vec: EssentiaVector) => number[];
  RhythmExtractor2013: (vec: EssentiaVector) => RhythmResult;
  KeyExtractor: (vec: EssentiaVector) => KeyResult;
  Danceability: (vec: EssentiaVector) => { danceability: number };
  RMS: (vec: EssentiaVector) => { rms: number };
};

let essentia: EssentiaInstance | null = null;

const initEssentia = async (): Promise<void> => {
  if (essentia) return;

  // EssentiaWASMInterfaced is not typed in the package; cast to access it.
  const factory = (EssentiaWASM as unknown as {
    EssentiaWASMInterfaced: (options: { locateFile: (path: string) => string }) => Promise<EssentiaModule>;
  }).EssentiaWASMInterfaced;

  const EssentiaWASMModule = await factory({
    locateFile: (path: string) =>
      path.includes('wasm') ? '/wasm/essentia-wasm.web.wasm' : `/wasm/${path}`,
  });

  essentia = new EssentiaWASMModule.EssentiaJs();
};

self.onmessage = async (e: MessageEvent<{ id: string; audioBuffer: Float32Array }>) => {
  const { id, audioBuffer } = e.data;

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

    // 3. Vibe Analysis (Energy/Danceability)
    const danceability = essentia.Danceability(vectorAudio).danceability;
    const energy = essentia.RMS(vectorAudio).rms;

    // Beat grid as plain array
    const beatGrid = rhythm.ticks ? essentia.vectorToArray(rhythm.ticks) : [];

    // Cleanup
    if (rhythm.ticks) {
      rhythm.ticks.delete();
    }
    vectorAudio.delete();

    self.postMessage({
      id,
      success: true,
      result: {
        bpm: rhythm.bpm,
        beatGrid,
        key: keyData.key,
        scale: keyData.scale,
        energy,
        danceability,
      } satisfies AnalysisResult,
    });
  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
