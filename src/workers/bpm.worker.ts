/**
 * PHASE 8: BPM Detection Worker
 * 
 * Analyzes audio data to detect tempo (BPM) and first beat offset.
 * Uses peak detection algorithm to find rhythmic patterns.
 * 
 * Algorithm:
 * 1. Downsample audio to reduce computational load
 * 2. Apply low-pass filter to isolate bass frequencies (kick drum)
 * 3. Detect peaks in energy envelope
 * 4. Calculate intervals between peaks
 * 5. Find most common interval (tempo)
 * 6. Return BPM and offset of first beat
 */

interface BPMWorkerInput {
  channelData: Float32Array[];
  sampleRate: number;
}

interface BPMWorkerOutput {
  bpm: number;
  offset: number; // Time of first beat in seconds
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
function lowPassFilter(data: Float32Array, alpha: number = 0.1): Float32Array {
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
function detectPeaks(data: Float32Array, threshold: number = 0.5): number[] {
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
    if (data[i] > adaptiveThreshold && 
        data[i] > data[i - 1] && 
        data[i] > data[i + 1]) {
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
function findTempo(intervals: number[], sampleRate: number, downsampleFactor: number): { bpm: number; confidence: number } {
  if (intervals.length === 0) {
    return { bpm: 120, confidence: 0 }; // Default fallback
  }
  
  // Group intervals into buckets (tolerance for variation)
  const buckets: Map<number, number> = new Map();
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
 * Main BPM detection algorithm
 */
function detectBPM(channelData: Float32Array[], sampleRate: number): BPMWorkerOutput {
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
  
  // Downsample for performance (analyze ~10 samples per second)
  const downsampleFactor = Math.floor(sampleRate / 10);
  const downsampled = downsample(monoData, downsampleFactor);
  
  // Apply low-pass filter to isolate bass
  const filtered = lowPassFilter(downsampled, 0.15);
  
  // Detect peaks
  const peaks = detectPeaks(filtered, 0.8);
  
  if (peaks.length < 2) {
    return { bpm: 120, offset: 0, confidence: 0 };
  }
  
  // Calculate intervals
  const intervals = calculateIntervals(peaks);
  
  // Find tempo
  const { bpm, confidence } = findTempo(intervals, sampleRate, downsampleFactor);
  
  // Calculate offset (time of first peak)
  const firstPeakSample = peaks[0] * downsampleFactor;
  const offset = firstPeakSample / sampleRate;
  
  return { bpm, offset, confidence };
}

// Web Worker message handler
self.onmessage = (event: MessageEvent<BPMWorkerInput>) => {
  const { channelData, sampleRate } = event.data;
  
  try {
    console.log('🎵 BPM Worker: Starting analysis...');
    const startTime = performance.now();
    
    // Detect BPM
    const result = detectBPM(channelData, sampleRate);
    
    const endTime = performance.now();
    console.log(`✅ BPM Worker: Detected ${result.bpm} BPM (confidence: ${(result.confidence * 100).toFixed(1)}%) in ${(endTime - startTime).toFixed(0)}ms`);
    
    // Send result back to main thread
    self.postMessage(result);
  } catch (error) {
    console.error('❌ BPM Worker: Detection failed:', error);
    self.postMessage({ 
      bpm: 120, 
      offset: 0, 
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Export empty object to make TypeScript happy
export {};
