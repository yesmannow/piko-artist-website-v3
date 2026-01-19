/* eslint-disable no-restricted-globals */

export type AnalysisRequest = {
  type: "analyze";
  clipId: string;
  sampleRate: number;
  mono: Float32Array;
};

export type AnalysisResponse = {
  type: "result";
  clipId: string;
  detectedBpm: number | null;
  energyMap: number[];
  key: string | null;
  camelot: string | null;
};

type NoteName = "C" | "C#" | "D" | "Eb" | "E" | "F" | "F#" | "G" | "Ab" | "A" | "Bb" | "B";

const NOTE_NAMES: NoteName[] = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

// Krumhansl-Schmuckler key profiles (major/minor)
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function rotate(arr: number[], k: number) {
  const out = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) out[(i + k) % arr.length] = arr[i]!;
  return out;
}

function dot(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] || 0) * (b[i] || 0);
  return s;
}

function norm(a: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] || 0) * (a[i] || 0);
  return Math.sqrt(s) || 1;
}

function correlation(a: number[], b: number[]) {
  return dot(a, b) / (norm(a) * norm(b));
}

function rmsEnergyMap(mono: Float32Array, sampleRate: number): number[] {
  const bucketSize = Math.max(1, Math.floor(sampleRate)); // 1 second
  const buckets = Math.max(1, Math.ceil(mono.length / bucketSize));
  const out = new Array<number>(buckets);

  let max = 0;
  for (let b = 0; b < buckets; b++) {
    const start = b * bucketSize;
    const end = Math.min(mono.length, start + bucketSize);
    let sumSq = 0;
    const n = Math.max(1, end - start);
    for (let i = start; i < end; i++) {
      const v = mono[i] || 0;
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / n);
    out[b] = rms;
    if (rms > max) max = rms;
  }

  if (max > 0) {
    for (let i = 0; i < out.length; i++) out[i] = clamp((out[i] || 0) / max, 0, 1);
  }
  return out;
}

function estimateBpm(mono: Float32Array, sampleRate: number): number | null {
  // Build a coarse RMS envelope at ~86Hz (hop 512 @ 44.1k)
  const frame = 1024;
  const hop = 512;
  if (mono.length < frame * 4) return null;

  const frames = Math.floor((mono.length - frame) / hop);
  const env = new Array<number>(frames);

  for (let f = 0; f < frames; f++) {
    const start = f * hop;
    let sumSq = 0;
    for (let i = 0; i < frame; i++) {
      const v = mono[start + i] || 0;
      sumSq += v * v;
    }
    env[f] = Math.sqrt(sumSq / frame);
  }

  // Remove DC + normalize
  const mean = env.reduce((a, b) => a + b, 0) / env.length;
  for (let i = 0; i < env.length; i++) env[i] = (env[i] - mean) || 0;
  const eNorm = norm(env);
  for (let i = 0; i < env.length; i++) env[i] = (env[i] || 0) / eNorm;

  // Autocorrelation over BPM range
  const minBpm = 60;
  const maxBpm = 200;
  const minLag = Math.floor((60 / maxBpm) * (sampleRate / hop));
  const maxLag = Math.floor((60 / minBpm) * (sampleRate / hop));

  let bestLag = 0;
  let bestCorr = -Infinity;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let c = 0;
    for (let i = 0; i + lag < env.length; i++) {
      c += (env[i] || 0) * (env[i + lag] || 0);
    }
    if (c > bestCorr) {
      bestCorr = c;
      bestLag = lag;
    }
  }

  if (!bestLag || !isFinite(bestCorr)) return null;
  const periodSeconds = (bestLag * hop) / sampleRate;
  let bpm = 60 / periodSeconds;

  // Fold into a more common range (heuristic)
  while (bpm < 80) bpm *= 2;
  while (bpm > 180) bpm /= 2;

  return clamp(Math.round(bpm), 1, 300);
}

// Minimal radix-2 FFT (complex) for real-input analysis
function fftRadix2(re: Float32Array, im: Float32Array) {
  const n = re.length;
  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]!;
      re[i] = re[j]!;
      re[j] = tr;
      const ti = im[i]!;
      im[i] = im[j]!;
      im[j] = ti;
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const ang = (-2 * Math.PI) / len;
    const wlenRe = Math.cos(ang);
    const wlenIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      for (let j = 0; j < half; j++) {
        const uRe = re[i + j]!;
        const uIm = im[i + j]!;
        const vRe = re[i + j + half]! * wRe - im[i + j + half]! * wIm;
        const vIm = re[i + j + half]! * wIm + im[i + j + half]! * wRe;

        re[i + j] = uRe + vRe;
        im[i + j] = uIm + vIm;
        re[i + j + half] = uRe - vRe;
        im[i + j + half] = uIm - vIm;

        const nextWRe = wRe * wlenRe - wIm * wlenIm;
        const nextWIm = wRe * wlenIm + wIm * wlenRe;
        wRe = nextWRe;
        wIm = nextWIm;
      }
    }
  }
}

function detectKey(mono: Float32Array, sampleRate: number): { key: string | null; camelot: string | null } {
  // Downsample by simple decimation (best-effort) to reduce FFT load.
  const targetRate = 11025;
  const decim = Math.max(1, Math.floor(sampleRate / targetRate));
  const dsLen = Math.floor(mono.length / decim);
  if (dsLen < 8192) return { key: null, camelot: null };

  const ds = new Float32Array(dsLen);
  for (let i = 0; i < dsLen; i++) ds[i] = mono[i * decim] || 0;

  const n = 4096;
  const hop = 2048;
  const window = new Float32Array(n);
  for (let i = 0; i < n; i++) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)); // Hann

  const chroma = new Array<number>(12).fill(0);
  const re = new Float32Array(n);
  const im = new Float32Array(n);

  const frames = Math.min(120, Math.floor((ds.length - n) / hop)); // cap work
  for (let f = 0; f < frames; f++) {
    const start = f * hop;
    for (let i = 0; i < n; i++) {
      re[i] = (ds[start + i] || 0) * window[i]!;
      im[i] = 0;
    }
    fftRadix2(re, im);

    // accumulate spectral energy to pitch classes
    for (let bin = 1; bin < n / 2; bin++) {
      const freq = (bin * targetRate) / n;
      if (freq < 40 || freq > 5000) continue;
      const mag = re[bin]! * re[bin]! + im[bin]! * im[bin]!;
      const midi = 69 + 12 * Math.log2(freq / 440);
      const pc = ((Math.round(midi) % 12) + 12) % 12;
      chroma[pc] = (chroma[pc] || 0) + mag;
    }
  }

  // Normalize chroma
  const sum = chroma.reduce((a, b) => a + b, 0) || 1;
  for (let i = 0; i < 12; i++) chroma[i] = (chroma[i] || 0) / sum;

  let best: { score: number; tonic: number; mode: "major" | "minor" } = {
    score: -Infinity,
    tonic: 0,
    mode: "major",
  };

  for (let tonic = 0; tonic < 12; tonic++) {
    const maj = rotate(MAJOR_PROFILE, tonic);
    const min = rotate(MINOR_PROFILE, tonic);
    const majScore = correlation(chroma, maj);
    const minScore = correlation(chroma, min);
    if (majScore > best.score) best = { score: majScore, tonic, mode: "major" };
    if (minScore > best.score) best = { score: minScore, tonic, mode: "minor" };
  }

  // If confidence is too low, return unknown.
  if (!isFinite(best.score) || best.score < 0.2) {
    return { key: null, camelot: null };
  }

  const tonicName = NOTE_NAMES[best.tonic]!;
  const key = best.mode === "minor" ? `${tonicName}m` : tonicName;
  const camelot = keyToCamelot(best.tonic, best.mode);
  return { key, camelot };
}

function keyToCamelot(tonicPc: number, mode: "major" | "minor"): string | null {
  // Camelot wheel pitch class order
  const minorWheel = [8, 3, 10, 5, 0, 7, 2, 9, 4, 11, 6, 1]; // 1A..12A
  const majorWheel = [11, 6, 1, 8, 3, 10, 5, 0, 7, 2, 9, 4]; // 1B..12B
  const idx = (mode === "minor" ? minorWheel : majorWheel).indexOf(tonicPc);
  if (idx < 0) return null;
  return `${idx + 1}${mode === "minor" ? "A" : "B"}`;
}

self.onmessage = (evt: MessageEvent<AnalysisRequest>) => {
  const data = evt.data;
  if (!data || data.type !== "analyze") return;

  const energyMap = rmsEnergyMap(data.mono, data.sampleRate);
  const detectedBpm = estimateBpm(data.mono, data.sampleRate);
  const { key, camelot } = detectKey(data.mono, data.sampleRate);

  const res: AnalysisResponse = {
    type: "result",
    clipId: data.clipId,
    detectedBpm,
    energyMap,
    key,
    camelot,
  };

  self.postMessage(res);
};

