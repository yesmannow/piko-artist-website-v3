/**
 * Phase S9: Beat Analysis Module
 *
 * Detects BPM and first beat offset using web-audio-beat-detector.
 * Integrates with existing track analysis pipeline.
 *
 * Strategy:
 * - Use web-audio-beat-detector for BPM + offset detection
 * - Fallback to null if analysis fails (graceful degradation)
 * - Cache results in Dexie insights table
 * - Used for beatgrid rendering and quantized loops
 *
 * Algorithm:
 * - Uses adaptive peak detection on audio buffer
 * - Returns { bpm, offset } where offset is time to first beat in seconds
 * - Accurate for most electronic and pop music (90-180 BPM)
 *
 * @see https://github.com/chrisguttandin/web-audio-beat-detector
 */

import { guess } from "web-audio-beat-detector";

export interface BeatAnalysisResult {
  bpm: number | null;
  firstBeatOffsetSec: number | null;
  failed: boolean;
}

/**
 * Analyze audio buffer for BPM and first beat offset
 *
 * @param audioBuffer Decoded audio buffer from Web Audio API
 * @returns Beat analysis result with BPM and offset
 */
export async function analyzeBeat(
  audioBuffer: AudioBuffer
): Promise<BeatAnalysisResult> {
  try {
    console.log("[AnalyzeBeat] Starting beat detection...");

    // Run web-audio-beat-detector
    const result = await guess(audioBuffer);

    if (!result || typeof result.bpm !== "number" || typeof result.offset !== "number") {
      console.warn("[AnalyzeBeat] Invalid result from beat detector:", result);
      return { bpm: null, firstBeatOffsetSec: null, failed: true };
    }

    console.log(`[AnalyzeBeat] Detected BPM: ${result.bpm.toFixed(2)}, Offset: ${result.offset.toFixed(3)}s`);

    return {
      bpm: result.bpm,
      firstBeatOffsetSec: result.offset,
      failed: false,
    };
  } catch (error) {
    console.error("[AnalyzeBeat] Beat detection failed:", error);
    return { bpm: null, firstBeatOffsetSec: null, failed: true };
  }
}

/**
 * Calculate beat timestamps for beatgrid rendering
 *
 * @param bpm Detected BPM
 * @param firstBeatOffsetSec Time to first beat in seconds
 * @param durationSec Total track duration
 * @returns Array of beat timestamps in seconds
 */
export function calculateBeatGrid(
  bpm: number,
  firstBeatOffsetSec: number,
  durationSec: number
): number[] {
  if (bpm <= 0 || firstBeatOffsetSec < 0 || durationSec <= 0) {
    return [];
  }

  const beatIntervalSec = 60 / bpm; // Seconds per beat
  const beats: number[] = [];

  // Start from first beat and increment by beat interval
  for (let t = firstBeatOffsetSec; t < durationSec; t += beatIntervalSec) {
    beats.push(t);
  }

  return beats;
}

/**
 * Quantize time to nearest beat
 *
 * Useful for snapping loop points to beatgrid.
 *
 * @param timeSec Time to quantize (seconds)
 * @param bpm Track BPM
 * @param firstBeatOffsetSec First beat offset
 * @returns Quantized time (seconds)
 */
export function quantizeToBeat(
  timeSec: number,
  bpm: number,
  firstBeatOffsetSec: number
): number {
  if (bpm <= 0 || firstBeatOffsetSec < 0) {
    return timeSec; // No quantization possible
  }

  const beatIntervalSec = 60 / bpm;
  const beatsSinceFirst = Math.round((timeSec - firstBeatOffsetSec) / beatIntervalSec);
  return firstBeatOffsetSec + beatsSinceFirst * beatIntervalSec;
}
