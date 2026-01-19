/**
 * AnalyserManager - Manages AnalyserNodes for visualization
 *
 * Provides two types of analysers:
 * - PFL (Pre-Fader Listen): Taps signal before trim gain (for cue monitoring)
 * - Post-Fader: Taps signal after panner (for main output visualization)
 */

export interface AnalyserNodes {
  pfl: AnalyserNode; // Pre-Fader Listen
  postFader: AnalyserNode; // Post-Fader (main output)
}

/**
 * createAnalysers - Factory function to create analyser nodes
 *
 * @param audioContext - The AudioContext to create nodes in
 * @returns AnalyserNodes with PFL and Post-Fader analysers
 */
export function createAnalysers(audioContext: AudioContext): AnalyserNodes {
  // PFL Analyser (Pre-Fader Listen)
  const pfl = audioContext.createAnalyser();
  pfl.fftSize = 2048; // Frequency resolution
  pfl.smoothingTimeConstant = 0.8; // Smoothing for visualization

  // Post-Fader Analyser (Main output)
  const postFader = audioContext.createAnalyser();
  postFader.fftSize = 2048;
  postFader.smoothingTimeConstant = 0.8;

  return {
    pfl,
    postFader,
  };
}

/**
 * getFrequencyData - Get frequency domain data from analyser
 *
 * @param analyser - The AnalyserNode to read from
 * @returns Float32Array of frequency data (0-22050 Hz)
 */
export function getFrequencyData(analyser: AnalyserNode): Float32Array {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  analyser.getFloatFrequencyData(dataArray);
  return dataArray;
}

/**
 * getTimeDomainData - Get time domain data from analyser
 *
 * @param analyser - The AnalyserNode to read from
 * @returns Uint8Array of time domain data (waveform)
 */
export function getTimeDomainData(analyser: AnalyserNode): Uint8Array {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);
  return dataArray;
}
