/**
 * PHASE 5: Waveform Analyzer Web Worker
 *
 * Processes audio data off the main thread to prevent UI freezing.
 * Calculates RMS peaks for efficient waveform rendering.
 *
 * Input: { audioBuffer: Float32Array[], sampleRate: number, samplesPerPixel: number }
 * Output: { peaks: Float32Array }
 */

interface WaveformWorkerInput {
  channelData: Float32Array[];
  sampleRate: number;
  samplesPerPixel: number;
}

interface WaveformWorkerOutput {
  peaks: Float32Array;
}

/**
 * Calculate Root Mean Square (RMS) for a chunk of samples
 * RMS provides a better visual representation than simple peak detection
 */
function calculateRMS(
  samples: Float32Array,
  start: number,
  end: number,
): number {
  let sum = 0;
  let count = 0;

  for (let i = start; i < end && i < samples.length; i++) {
    sum += samples[i] * samples[i];
    count++;
  }

  if (count === 0) return 0;
  return Math.sqrt(sum / count);
}

/**
 * Process audio channel data to generate waveform peaks
 * Downsamples the audio data for efficient rendering
 */
function generateWaveformPeaks(
  channelData: Float32Array[],
  samplesPerPixel: number,
): Float32Array {
  // Use first channel (mono) or mix down if stereo
  const channel = channelData[0];
  const totalSamples = channel.length;
  const numPeaks = Math.ceil(totalSamples / samplesPerPixel);
  const peaks = new Float32Array(numPeaks);

  // If stereo, mix down to mono for waveform
  let mixedChannel: Float32Array;
  if (channelData.length === 2) {
    mixedChannel = new Float32Array(totalSamples);
    for (let i = 0; i < totalSamples; i++) {
      mixedChannel[i] = (channelData[0][i] + channelData[1][i]) / 2;
    }
  } else {
    mixedChannel = channel;
  }

  // Calculate RMS for each pixel
  for (let i = 0; i < numPeaks; i++) {
    const start = i * samplesPerPixel;
    const end = start + samplesPerPixel;
    peaks[i] = calculateRMS(mixedChannel, start, end);
  }

  // Normalize peaks to 0.0 - 1.0 range
  let maxPeak = 0;
  for (let i = 0; i < peaks.length; i++) {
    if (peaks[i] > maxPeak) {
      maxPeak = peaks[i];
    }
  }

  if (maxPeak > 0) {
    for (let i = 0; i < peaks.length; i++) {
      peaks[i] = peaks[i] / maxPeak;
    }
  }

  return peaks;
}

// Web Worker message handler
self.onmessage = (event: MessageEvent<WaveformWorkerInput>) => {
  const { channelData, sampleRate, samplesPerPixel } = event.data;

  try {
    // Generate waveform peaks
    const peaks = generateWaveformPeaks(channelData, samplesPerPixel);

    // Send result back to main thread
    const response: WaveformWorkerOutput = { peaks };
    self.postMessage(response);
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Export empty object to make TypeScript happy with worker module
export {};
