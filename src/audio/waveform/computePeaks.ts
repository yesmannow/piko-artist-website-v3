/**
 * Phase S11.3 - Precomputed Waveform Peaks
 *
 * Utility to compute normalized waveform peaks from AudioBuffer for WaveSurfer.
 * WaveSurfer supports providing `peaks` and optional `duration` to render without decoding.
 *
 * @see https://wavesurfer.xyz/docs/options#peaks
 */

export interface PeaksResult {
  peaks: number[][]; // Array of channel peak arrays
  channels: number;
  durationSec: number;
  algoVersion: number;
}

const ALGO_VERSION = 1; // Increment when computation algorithm changes

/**
 * Compute normalized waveform peaks from AudioBuffer
 *
 * @param buffer - Decoded AudioBuffer
 * @param targetPoints - Number of peak points to compute (default: 2000)
 * @param mode - 'mono' | 'stereo' | 'channels' (default: 'mono')
 * @returns Normalized peaks [-1..1] + metadata
 */
export function computePeaks(
  buffer: AudioBuffer,
  targetPoints: number = 2000,
  mode: 'mono' | 'stereo' | 'channels' = 'mono'
): PeaksResult {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const durationSec = length / sampleRate;

  const samplesPerPoint = Math.floor(length / targetPoints);
  const actualPoints = Math.floor(length / samplesPerPoint);

  let channels: number;
  if (mode === 'mono') {
    channels = 1;
  } else if (mode === 'stereo') {
    channels = Math.min(2, numChannels);
  } else {
    channels = numChannels;
  }

  const peaks: number[][] = [];

  for (let ch = 0; ch < channels; ch++) {
    const channelData = buffer.getChannelData(ch % numChannels); // Wrap if needed
    const channelPeaks: number[] = [];

    for (let i = 0; i < actualPoints; i++) {
      const start = i * samplesPerPoint;
      const end = Math.min(start + samplesPerPoint, length);

      let min = 0;
      let max = 0;

      for (let j = start; j < end; j++) {
        const sample = channelData[j];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }

      // WaveSurfer expects peaks in [-1..1] range
      // Store max absolute value (could also store min/max separately)
      const peak = Math.max(Math.abs(min), Math.abs(max));
      channelPeaks.push(peak);
    }

    peaks.push(channelPeaks);
  }

  // If mono mode and stereo buffer, merge channels
  if (mode === 'mono' && numChannels > 1) {
    const mergedPeaks: number[] = [];
    for (let i = 0; i < actualPoints; i++) {
      const start = i * samplesPerPoint;
      const end = Math.min(start + samplesPerPoint, length);

      let min = 0;
      let max = 0;

      // Sample all channels
      for (let ch = 0; ch < numChannels; ch++) {
        const channelData = buffer.getChannelData(ch);
        for (let j = start; j < end; j++) {
          const sample = channelData[j];
          if (sample < min) min = sample;
          if (sample > max) max = sample;
        }
      }

      const peak = Math.max(Math.abs(min), Math.abs(max));
      mergedPeaks.push(peak);
    }

    return {
      peaks: [mergedPeaks],
      channels: 1,
      durationSec,
      algoVersion: ALGO_VERSION
    };
  }

  return {
    peaks,
    channels,
    durationSec,
    algoVersion: ALGO_VERSION
  };
}

/**
 * Compress peaks to Int16Array for efficient storage (optional optimization)
 * WaveSurfer accepts Float32Array or number[], so this is for Dexie storage only.
 *
 * @param peaks - Normalized peaks [-1..1]
 * @returns Int16Array (can be stored directly in IndexedDB)
 */
export function compressPeaks(peaks: number[][]): Int16Array[] {
  return peaks.map(channelPeaks => {
    const compressed = new Int16Array(channelPeaks.length);
    for (let i = 0; i < channelPeaks.length; i++) {
      // Map [-1..1] to [-32768..32767]
      compressed[i] = Math.round(channelPeaks[i] * 32767);
    }
    return compressed;
  });
}

/**
 * Decompress Int16Array back to normalized peaks
 *
 * @param compressed - Int16Array from Dexie
 * @returns Normalized peaks [-1..1]
 */
export function decompressPeaks(compressed: Int16Array[]): number[][] {
  return compressed.map(channelCompressed => {
    const peaks: number[] = [];
    for (let i = 0; i < channelCompressed.length; i++) {
      // Map [-32768..32767] back to [-1..1]
      peaks.push(channelCompressed[i] / 32767);
    }
    return peaks;
  });
}
