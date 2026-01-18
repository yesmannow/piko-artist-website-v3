/**
 * BPM Detection Utility
 *
 * Simple BPM detection using autocorrelation on audio buffer
 * This is a basic implementation - for production, consider using a library like
 * web-audio-beat-detector or a more sophisticated algorithm
 */

export interface BPMResult {
  bpm: number;
  confidence: number; // 0-1
}

/**
 * Detect BPM from audio buffer using autocorrelation
 * @param audioBuffer Audio buffer to analyze
 * @returns BPM estimate with confidence
 */
export async function detectBPM(audioBuffer: AudioBuffer): Promise<BPMResult> {
  try {
    // Use mono channel for analysis
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const length = channelData.length;

    // Downsample for performance (analyze at ~11kHz)
    const downsampleFactor = Math.max(1, Math.floor(sampleRate / 11025));
    const downsampledLength = Math.floor(length / downsampleFactor);
    const downsampled = new Float32Array(downsampledLength);

    for (let i = 0; i < downsampledLength; i++) {
      let sum = 0;
      for (let j = 0; j < downsampleFactor; j++) {
        sum += channelData[i * downsampleFactor + j] || 0;
      }
      downsampled[i] = sum / downsampleFactor;
    }

    // Find peaks in the signal
    const peaks = findPeaks(downsampled);
    if (peaks.length < 2) {
      return { bpm: 120, confidence: 0.3 }; // Default fallback
    }

    // Calculate intervals between peaks
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }

    // Find most common interval (mode)
    const intervalCounts = new Map<number, number>();
    intervals.forEach((interval) => {
      const rounded = Math.round(interval / 10) * 10; // Round to nearest 10 samples
      intervalCounts.set(rounded, (intervalCounts.get(rounded) || 0) + 1);
    });

    let maxCount = 0;
    let mostCommonInterval = intervals[0];
    intervalCounts.forEach((count, interval) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonInterval = interval;
      }
    });

    // Convert interval to BPM
    // interval is in samples at downsampled rate
    const intervalSeconds = (mostCommonInterval * downsampleFactor) / sampleRate;
    const bpm = Math.round(60 / intervalSeconds);

    // Clamp to reasonable BPM range
    const clampedBPM = Math.max(60, Math.min(200, bpm));

    // Calculate confidence based on peak consistency
    const confidence = Math.min(1, maxCount / peaks.length);

    return { bpm: clampedBPM, confidence };
  } catch (error) {
    console.warn("BPM detection failed:", error);
    return { bpm: 120, confidence: 0.3 }; // Default fallback
  }
}

/**
 * Find peaks in audio signal
 */
function findPeaks(signal: Float32Array, threshold: number = 0.3): number[] {
  const peaks: number[] = [];
  const windowSize = 100; // samples

  for (let i = windowSize; i < signal.length - windowSize; i++) {
    const value = Math.abs(signal[i]);
    if (value < threshold) continue;

    // Check if this is a local maximum
    let isPeak = true;
    for (let j = i - windowSize; j <= i + windowSize; j++) {
      if (j !== i && Math.abs(signal[j]) >= value) {
        isPeak = false;
        break;
      }
    }

    if (isPeak) {
      // Avoid duplicate peaks too close together
      if (peaks.length === 0 || i - peaks[peaks.length - 1] > windowSize) {
        peaks.push(i);
      }
    }
  }

  return peaks;
}

/**
 * Estimate BPM from track metadata or filename
 * This is a fallback when audio analysis isn't available
 */
export function estimateBPMFromMetadata(trackTitle: string, trackArtist: string): number | null {
  // Try to extract BPM from filename patterns like "track-128bpm.mp3"
  const bpmMatch = /(\d{2,3})\s*bpm/i.exec(trackTitle + " " + trackArtist);
  if (bpmMatch) {
    const bpm = parseInt(bpmMatch[1], 10);
    if (bpm >= 60 && bpm <= 200) {
      return bpm;
    }
  }
  return null;
}

