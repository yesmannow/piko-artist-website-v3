/**
 * beatgrid.worker.ts - Beat Grid Analysis Worker
 *
 * Phase 9A: Enhanced BPM/beatgrid analysis
 *
 * Returns:
 * - BPM (beats per minute)
 * - Downbeat time (first beat of first bar)
 * - Beat timestamps array (all beat positions in seconds)
 *
 * Algorithm:
 * 1. Detect BPM using autocorrelation and peak detection
 * 2. Identify downbeat (strongest beat pattern, typically every 4 beats)
 * 3. Generate complete beat grid from BPM and downbeat
 */

interface BeatGridWorkerInput {
  channelData: Float32Array[];
  sampleRate: number;
}

interface BeatGridWorkerOutput {
  bpm: number;
  downbeatTime: number; // Time of first downbeat in seconds
  beatTimestamps: number[]; // Array of all beat times in seconds
  confidence: number; // 0-1 confidence score
}

/**
 * Downsample audio data for faster processing
 */
function downsample(data: Float32Array, factor: number): Float32Array {
  const length = Math.floor(data.length / factor);
  const result = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (let j = 0; j < factor; j++) {
      sum += Math.abs(data[i * factor + j]);
    }
    result[i] = sum / factor;
  }

  return result;
}

/**
 * Simple low-pass filter to isolate bass frequencies
 */
function lowPassFilter(data: Float32Array, alpha = 0.1): Float32Array {
  const result = new Float32Array(data.length);
  result[0] = data[0];

  for (let i = 1; i < data.length; i++) {
    result[i] = alpha * data[i] + (1 - alpha) * result[i - 1];
  }

  return result;
}

/**
 * Detect peaks in energy envelope
 */
function detectPeaks(data: Float32Array, threshold = 0.5): number[] {
  const peaks: number[] = [];

  // Calculate adaptive threshold
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  const mean = sum / data.length;
  const adaptiveThreshold = mean * (1 + threshold);

  // Find peaks
  for (let i = 1; i < data.length - 1; i++) {
    if (
      data[i] > adaptiveThreshold &&
      data[i] > data[i - 1] &&
      data[i] > data[i + 1]
    ) {
      peaks.push(i);
    }
  }

  return peaks;
}

/**
 * Calculate intervals between peaks
 */
function calculateIntervals(peaks: number[]): number[] {
  const intervals: number[] = [];

  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i] - peaks[i - 1]);
  }

  return intervals;
}

/**
 * Find most common interval (tempo)
 */
function findTempo(
  intervals: number[],
  sampleRate: number,
  downsampleFactor: number,
): { bpm: number; confidence: number } {
  if (intervals.length === 0) {
    return { bpm: 120, confidence: 0 };
  }

  // Group intervals into buckets (tolerance for variation)
  const buckets = new Map<number, number>();
  const tolerance = 5; // Allow 5% variation

  for (const interval of intervals) {
    let found = false;

    for (const [key, count] of buckets.entries()) {
      if (Math.abs(interval - key) / key < tolerance / 100) {
        buckets.set(key, count + 1);
        found = true;
        break;
      }
    }

    if (!found) {
      buckets.set(interval, 1);
    }
  }

  // Find most common interval
  let maxCount = 0;
  let bestInterval = 0;

  for (const [interval, count] of buckets.entries()) {
    if (count > maxCount) {
      maxCount = count;
      bestInterval = interval;
    }
  }

  // Convert interval to BPM
  const samplesPerBeat = bestInterval * downsampleFactor;
  const secondsPerBeat = samplesPerBeat / sampleRate;
  const bpm = 60 / secondsPerBeat;

  // Calculate confidence (ratio of most common interval to total)
  const confidence = maxCount / intervals.length;

  // Clamp BPM to reasonable range (60-180)
  let finalBPM = bpm;

  // Handle double-time or half-time detection
  while (finalBPM < 60) finalBPM *= 2;
  while (finalBPM > 180) finalBPM /= 2;

  return { bpm: Math.round(finalBPM * 10) / 10, confidence };
}

/**
 * Detect downbeat (first beat of bar, typically every 4 beats)
 * Uses energy analysis to find strongest beat pattern
 */
function detectDownbeat(
  peaks: number[],
  bpm: number,
  sampleRate: number,
  downsampleFactor: number,
): number {
  if (peaks.length < 4) {
    return peaks[0] || 0;
  }

  // Calculate expected beat interval in downsampled samples
  const secondsPerBeat = 60 / bpm;
  const samplesPerBeat = secondsPerBeat * (sampleRate / downsampleFactor);

  // Group peaks into potential bars (4 beats per bar)
  // Find the peak that starts a bar pattern
  const barLength = samplesPerBeat * 4;

  // Find peak with strongest following pattern
  let bestDownbeat = peaks[0];
  let bestScore = 0;

  for (let i = 0; i < Math.min(peaks.length, 20); i++) {
    const candidate = peaks[i];
    let score = 0;

    // Check if following peaks align with 4-beat pattern
    for (let beat = 1; beat < 4; beat++) {
      const expectedPeak = candidate + samplesPerBeat * beat;
      // Find closest peak to expected position
      const closest = peaks.find(
        (p) =>
          p > candidate && Math.abs(p - expectedPeak) < samplesPerBeat * 0.3,
      );
      if (closest) {
        score += 1 - Math.abs(closest - expectedPeak) / samplesPerBeat;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestDownbeat = candidate;
    }
  }

  return bestDownbeat;
}

/**
 * Generate complete beat grid from BPM and downbeat
 */
function generateBeatGrid(
  bpm: number,
  downbeatTime: number,
  duration: number,
): number[] {
  const beatsPerSecond = bpm / 60;
  const beatInterval = 1 / beatsPerSecond;

  const beatTimestamps: number[] = [];
  let currentBeat = downbeatTime;

  // Generate beats from downbeat to end of track
  while (currentBeat < duration) {
    beatTimestamps.push(currentBeat);
    currentBeat += beatInterval;
  }

  // Also generate beats before downbeat (if any)
  currentBeat = downbeatTime - beatInterval;
  while (currentBeat >= 0) {
    beatTimestamps.unshift(currentBeat);
    currentBeat -= beatInterval;
  }

  return beatTimestamps;
}

/**
 * Main beat grid analysis algorithm
 */
function analyzeBeatGrid(
  channelData: Float32Array[],
  sampleRate: number,
): BeatGridWorkerOutput {
  // Mix down to mono if stereo
  let monoData: Float32Array;
  if (channelData.length === 2) {
    monoData = new Float32Array(channelData[0].length);
    for (let i = 0; i < monoData.length; i++) {
      monoData[i] = (channelData[0][i] + channelData[1][i]) / 2;
    }
  } else {
    monoData = channelData[0];
  }

  const duration = monoData.length / sampleRate;

  // Downsample for performance (analyze ~10 samples per second)
  const downsampleFactor = Math.floor(sampleRate / 10);
  const downsampled = downsample(monoData, downsampleFactor);

  // Apply low-pass filter to isolate bass
  const filtered = lowPassFilter(downsampled, 0.15);

  // Detect peaks
  const peaks = detectPeaks(filtered, 0.8);

  if (peaks.length < 2) {
    // Fallback: generate beat grid from default BPM
    const defaultBPM = 120;
    const defaultDownbeat = 0;
    return {
      bpm: defaultBPM,
      downbeatTime: defaultDownbeat,
      beatTimestamps: generateBeatGrid(defaultBPM, defaultDownbeat, duration),
      confidence: 0,
    };
  }

  // Calculate intervals
  const intervals = calculateIntervals(peaks);

  // Find tempo
  const { bpm, confidence } = findTempo(
    intervals,
    sampleRate,
    downsampleFactor,
  );

  // Detect downbeat
  const downbeatPeak = detectDownbeat(peaks, bpm, sampleRate, downsampleFactor);
  const downbeatTime = (downbeatPeak * downsampleFactor) / sampleRate;

  // Generate complete beat grid
  const beatTimestamps = generateBeatGrid(bpm, downbeatTime, duration);

  return {
    bpm,
    downbeatTime,
    beatTimestamps,
    confidence,
  };
}

// Web Worker message handler
self.onmessage = (event: MessageEvent<BeatGridWorkerInput>) => {
  const { channelData, sampleRate } = event.data;

  try {
    console.log("[BeatGridWorker] Starting analysis...");
    const startTime = performance.now();

    // Analyze beat grid
    const result = analyzeBeatGrid(channelData, sampleRate);

    const endTime = performance.now();
    console.log(
      `[BeatGridWorker] ✅ Detected ${result.bpm} BPM, ${result.beatTimestamps.length} beats (confidence: ${(result.confidence * 100).toFixed(1)}%) in ${(endTime - startTime).toFixed(0)}ms`,
    );

    // Send result back to main thread
    self.postMessage(result);
  } catch (error) {
    console.error("[BeatGridWorker] ❌ Analysis failed:", error);
    self.postMessage({
      bpm: 120,
      downbeatTime: 0,
      beatTimestamps: [],
      confidence: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Export empty object to make TypeScript happy
export {};
