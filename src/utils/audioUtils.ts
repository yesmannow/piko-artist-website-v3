/**
 * Audio Utilities
 * Helper functions for audio manipulation
 */

/**
 * Reverse an audio buffer
 * Creates a new buffer with reversed audio data
 */
export function reverseAudioBuffer(
  audioBuffer: AudioBuffer,
  audioContext: AudioContext,
): AudioBuffer {
  const reversed = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate,
  );

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const originalData = audioBuffer.getChannelData(channel);
    const reversedData = reversed.getChannelData(channel);

    // Reverse the array
    for (let i = 0; i < originalData.length; i++) {
      reversedData[i] = originalData[originalData.length - 1 - i];
    }
  }

  return reversed;
}

/**
 * Calculate beat positions based on BPM
 * @param duration Duration in seconds
 * @param bpm Beats per minute
 * @returns Array of beat positions in seconds
 */
export function calculateBeatPositions(
  duration: number,
  bpm: number,
): number[] {
  const beats: number[] = [];
  const beatInterval = 60 / bpm; // seconds per beat

  let currentBeat = 0;
  while (currentBeat < duration) {
    beats.push(currentBeat);
    currentBeat += beatInterval;
  }

  return beats;
}

/**
 * Snap a time value to the nearest beat
 * @param time Current time in seconds
 * @param bpm Beats per minute
 * @param snapStrength How close to beat (0-1, 1 = exact beat)
 * @returns Snapped time in seconds
 */
export function snapToBeat(
  time: number,
  bpm: number,
  snapStrength = 1.0,
): number {
  if (!bpm || bpm <= 0) return time;

  const beatInterval = 60 / bpm;
  const nearestBeat = Math.round(time / beatInterval) * beatInterval;
  const distance = Math.abs(time - nearestBeat);

  // Only snap if within snap window (50ms default)
  const snapWindow = 0.05; // 50ms
  if (distance < snapWindow) {
    return nearestBeat * snapStrength + time * (1 - snapStrength);
  }

  return time;
}

/**
 * Calculate quantized loop boundaries
 * @param startTime Start time in seconds
 * @param endTime End time in seconds
 * @param bpm Beats per minute
 * @param loopBeats Number of beats for loop
 * @returns Quantized start and end times
 */
export function quantizeLoop(
  startTime: number,
  endTime: number,
  bpm: number,
  loopBeats: number,
): { start: number; end: number } {
  if (!bpm || bpm <= 0) {
    return { start: startTime, end: endTime };
  }

  const beatInterval = 60 / bpm;
  const quantizedStart = Math.round(startTime / beatInterval) * beatInterval;
  const quantizedEnd = quantizedStart + loopBeats * beatInterval;

  return {
    start: Math.max(0, quantizedStart),
    end: quantizedEnd,
  };
}
