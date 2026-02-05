/**
 * Phase 5 Batch 3: Quantize Engine
 *
 * Smart beat quantization for professional DJ workflow.
 * Snaps actions to beatgrid for perfect timing.
 *
 * Features:
 * - Multiple quantize modes (OFF, 1/4, 1/8, 1/16, 1/32 beat)
 * - Cue point quantization (snap to nearest beat)
 * - Loop point quantization (snap start/end to beats)
 * - Play start quantization (instant beatmatch)
 * - Hot cue trigger quantization
 * - Configurable quantize strength (0-100%)
 *
 * Industry Comparison:
 * - VirtualDJ: Smart quantize modes ✅ We match this
 * - Traktor: Beatgrid snap ✅ We match this
 * - Serato: Quantize cues/loops ✅ We exceed (more modes)
 * - rekordbox: Phase sync quantize ✅ We match this
 *
 * Architecture:
 * - Pure utility functions (no React state)
 * - Uses BeatGridData for calculations
 * - Integrates with Tone.js transport
 */

import type { BeatGridData, BeatMarker } from "./beatDetection";

// ============================================================================
// Types
// ============================================================================

/**
 * Quantize mode (beat subdivision)
 */
export enum QuantizeMode {
  OFF = "OFF",         // No quantization
  BEAT = "1/4",        // Snap to quarter notes (beats)
  EIGHTH = "1/8",      // Snap to eighth notes
  SIXTEENTH = "1/16",  // Snap to sixteenth notes
  THIRTYSECOND = "1/32", // Snap to thirty-second notes
}

/**
 * Quantize settings
 */
export interface QuantizeSettings {
  mode: QuantizeMode;
  strength: number; // 0-1 (0 = off, 1 = full snap)
  lookahead: boolean; // True = snap forward only, false = snap nearest
}

/**
 * Quantize result with timing info
 */
export interface QuantizeResult {
  originalTime: number; // Input time (seconds)
  quantizedTime: number; // Snapped time (seconds)
  offset: number; // Difference in seconds (positive = ahead)
  beatPosition: number; // Fractional beat position (e.g., 2.75)
  nearestBeat: BeatMarker | null; // Nearest beat marker
  snapped: boolean; // True if quantization was applied
}

// ============================================================================
// Core Quantization Functions
// ============================================================================

/**
 * Quantize time to beatgrid
 *
 * Snaps input time to nearest beat subdivision based on quantize mode.
 *
 * @param time Input time (seconds)
 * @param beatGrid Beatgrid data
 * @param settings Quantize settings
 * @returns Quantize result with snapped time
 */
export function quantizeTime(
  time: number,
  beatGrid: BeatGridData | null,
  settings: QuantizeSettings
): QuantizeResult {
  // If quantize off or no beatgrid, return original time
  if (
    settings.mode === QuantizeMode.OFF ||
    settings.strength === 0 ||
    !beatGrid
  ) {
    return {
      originalTime: time,
      quantizedTime: time,
      offset: 0,
      beatPosition: 0,
      nearestBeat: null,
      snapped: false,
    };
  }

  // Calculate subdivision factor
  const subdivisionFactor = getSubdivisionFactor(settings.mode);

  // Calculate beat interval (seconds per beat)
  const beatInterval = 60 / beatGrid.bpm;

  // Calculate subdivision interval (seconds per subdivision)
  const subdivisionInterval = beatInterval / subdivisionFactor;

  // Find position relative to first beat
  const timeFromFirstBeat = time - beatGrid.firstBeatOffset;

  // Calculate fractional subdivision position
  const subdivisionPosition = timeFromFirstBeat / subdivisionInterval;

  // Snap to nearest or lookahead subdivision
  let snappedSubdivision: number;
  if (settings.lookahead) {
    // Snap forward only (used for play start)
    snappedSubdivision = Math.ceil(subdivisionPosition);
  } else {
    // Snap to nearest (used for cues/loops)
    snappedSubdivision = Math.round(subdivisionPosition);
  }

  // Calculate quantized time
  const quantizedTime =
    beatGrid.firstBeatOffset + snappedSubdivision * subdivisionInterval;

  // Apply quantize strength (blend between original and quantized)
  const blendedTime =
    time + (quantizedTime - time) * settings.strength;

  // Calculate offset
  const offset = blendedTime - time;

  // Find nearest beat marker
  const nearestBeat = findNearestBeat(blendedTime, beatGrid.beats);

  // Calculate fractional beat position
  const beatPosition = subdivisionPosition / subdivisionFactor;

  return {
    originalTime: time,
    quantizedTime: blendedTime,
    offset,
    beatPosition,
    nearestBeat,
    snapped: Math.abs(offset) > 0.001, // Consider snapped if >1ms difference
  };
}

/**
 * Quantize cue point to beatgrid
 *
 * Snaps cue point time to nearest beat for perfect loop/hotcue placement.
 *
 * @param cueTime Cue point time (seconds)
 * @param beatGrid Beatgrid data
 * @param settings Quantize settings
 * @returns Quantized cue time
 */
export function quantizeCue(
  cueTime: number,
  beatGrid: BeatGridData | null,
  settings: QuantizeSettings
): number {
  const result = quantizeTime(cueTime, beatGrid, {
    ...settings,
    lookahead: false, // Cues snap to nearest, not forward
  });
  return result.quantizedTime;
}

/**
 * Quantize loop points to beatgrid
 *
 * Ensures loop start/end align to beats for perfect loops.
 *
 * @param loopStart Loop start time (seconds)
 * @param loopEnd Loop end time (seconds)
 * @param beatGrid Beatgrid data
 * @param settings Quantize settings
 * @returns Quantized loop points
 */
export function quantizeLoop(
  loopStart: number,
  loopEnd: number,
  beatGrid: BeatGridData | null,
  settings: QuantizeSettings
): { start: number; end: number; length: number } {
  if (!beatGrid || settings.mode === QuantizeMode.OFF) {
    return {
      start: loopStart,
      end: loopEnd,
      length: loopEnd - loopStart,
    };
  }

  // Quantize start point (snap to nearest)
  const quantizedStart = quantizeTime(loopStart, beatGrid, {
    ...settings,
    lookahead: false,
  }).quantizedTime;

  // Quantize end point (snap to nearest)
  const quantizedEnd = quantizeTime(loopEnd, beatGrid, {
    ...settings,
    lookahead: false,
  }).quantizedTime;

  // Ensure minimum loop length (1 subdivision)
  const beatInterval = 60 / beatGrid.bpm;
  const subdivisionFactor = getSubdivisionFactor(settings.mode);
  const minLength = beatInterval / subdivisionFactor;

  const finalEnd =
    quantizedEnd - quantizedStart < minLength
      ? quantizedStart + minLength
      : quantizedEnd;

  return {
    start: quantizedStart,
    end: finalEnd,
    length: finalEnd - quantizedStart,
  };
}

/**
 * Calculate quantize latency for play start
 *
 * When starting playback with quantize on, calculates delay
 * until next beat to achieve instant beatmatch.
 *
 * @param currentTime Current playback position (seconds)
 * @param beatGrid Beatgrid data
 * @param settings Quantize settings
 * @returns Latency in seconds (wait time before play)
 */
export function calculateQuantizeLatency(
  currentTime: number,
  beatGrid: BeatGridData | null,
  settings: QuantizeSettings
): number {
  if (!beatGrid || settings.mode === QuantizeMode.OFF) {
    return 0;
  }

  const result = quantizeTime(currentTime, beatGrid, {
    ...settings,
    lookahead: true, // Play always snaps forward
  });

  // Return positive latency (time to wait)
  return Math.max(0, result.offset);
}

/**
 * Get quantize grid markers for visualization
 *
 * Generates subdivision markers for beatgrid overlay.
 *
 * @param beatGrid Beatgrid data
 * @param mode Quantize mode
 * @param startTime Visible window start (seconds)
 * @param endTime Visible window end (seconds)
 * @returns Array of subdivision times
 */
export function getQuantizeGridMarkers(
  beatGrid: BeatGridData | null,
  mode: QuantizeMode,
  startTime: number,
  endTime: number
): number[] {
  if (!beatGrid || mode === QuantizeMode.OFF) {
    return [];
  }

  const subdivisionFactor = getSubdivisionFactor(mode);
  const beatInterval = 60 / beatGrid.bpm;
  const subdivisionInterval = beatInterval / subdivisionFactor;

  const markers: number[] = [];
  let time = beatGrid.firstBeatOffset;

  // Find first marker in visible window
  while (time < startTime) {
    time += subdivisionInterval;
  }

  // Generate markers within visible window
  while (time <= endTime) {
    markers.push(time);
    time += subdivisionInterval;
  }

  return markers;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get subdivision factor from quantize mode
 *
 * @param mode Quantize mode
 * @returns Subdivisions per beat (1/4 = 1, 1/8 = 2, 1/16 = 4, etc.)
 */
function getSubdivisionFactor(mode: QuantizeMode): number {
  switch (mode) {
    case QuantizeMode.BEAT:
      return 1; // Quarter notes (beats)
    case QuantizeMode.EIGHTH:
      return 2; // Eighth notes
    case QuantizeMode.SIXTEENTH:
      return 4; // Sixteenth notes
    case QuantizeMode.THIRTYSECOND:
      return 8; // Thirty-second notes
    default:
      return 1;
  }
}

/**
 * Find beat marker nearest to given time
 *
 * @param time Time in seconds
 * @param beats Array of beat markers
 * @returns Nearest beat marker or null
 */
function findNearestBeat(
  time: number,
  beats: BeatMarker[]
): BeatMarker | null {
  if (beats.length === 0) return null;

  let nearest = beats[0];
  let minDistance = Math.abs(time - beats[0].time);

  for (const beat of beats) {
    const distance = Math.abs(time - beat.time);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = beat;
    }
    if (beat.time > time) break; // Optimization: stop after passing target
  }

  return nearest;
}

/**
 * Check if time is on beat (within tolerance)
 *
 * @param time Time in seconds
 * @param beatGrid Beatgrid data
 * @param tolerance Tolerance in seconds (default: 0.02 = 20ms)
 * @returns True if time is on beat
 */
export function isOnBeat(
  time: number,
  beatGrid: BeatGridData | null,
  tolerance: number = 0.02
): boolean {
  if (!beatGrid) return false;

  const nearestBeat = findNearestBeat(time, beatGrid.beats);
  if (!nearestBeat) return false;

  return Math.abs(time - nearestBeat.time) < tolerance;
}

/**
 * Get beat number at time
 *
 * @param time Time in seconds
 * @param beatGrid Beatgrid data
 * @returns Beat number (1-indexed) or null
 */
export function getBeatNumber(
  time: number,
  beatGrid: BeatGridData | null
): number | null {
  if (!beatGrid) return null;

  const beatInterval = 60 / beatGrid.bpm;
  const timeFromFirstBeat = time - beatGrid.firstBeatOffset;
  const beatNumber = Math.floor(timeFromFirstBeat / beatInterval) + 1;

  return beatNumber;
}

/**
 * Get bar number at time
 *
 * @param time Time in seconds
 * @param beatGrid Beatgrid data
 * @returns Bar number (1-indexed) or null
 */
export function getBarNumber(
  time: number,
  beatGrid: BeatGridData | null
): number | null {
  if (!beatGrid) return null;

  const beatNumber = getBeatNumber(time, beatGrid);
  if (beatNumber === null) return null;

  const beatsPerBar = beatGrid.timeSignature[0];
  return Math.floor((beatNumber - 1) / beatsPerBar) + 1;
}
