/**
 * Timeline Utilities - Helper functions for Studio V2
 */

/**
 * Format time in seconds to MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Snap time to nearest beat based on BPM
 */
export function snapTobeat(time: number, bpm: number): number {
  const beatDuration = 60 / bpm; // Seconds per beat
  return Math.round(time / beatDuration) * beatDuration;
}

/**
 * Snap time to grid (configurable interval)
 */
export function snapToGrid(time: number, gridSize: number = 1): number {
  return Math.round(time / gridSize) * gridSize;
}

/**
 * Convert pixel position to time
 */
export function pixelsToTime(pixels: number, zoom: number): number {
  return pixels / zoom;
}

/**
 * Convert time to pixel position
 */
export function timeToPixels(time: number, zoom: number): number {
  return time * zoom;
}

/**
 * Check if two time ranges overlap
 */
export function rangesOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return !(end1 <= start2 || start1 >= end2);
}

/**
 * Get waveform color based on energy level
 */
export function getTrackColor(energy?: number): string {
  if (!energy) return 'bg-blue-500';

  if (energy > 0.8) return 'bg-red-500'; // High energy
  if (energy > 0.6) return 'bg-orange-500'; // Medium-high
  if (energy > 0.4) return 'bg-yellow-500'; // Medium
  if (energy > 0.2) return 'bg-green-500'; // Medium-low
  return 'bg-blue-500'; // Low energy
}

/**
 * Normalize track ID to trackKey (per repo rules)
 *
 * Rules:
 * - Lowercase
 * - Remove file extensions (.mp3, .wav, .m4a, .ogg)
 * - Strip path prefixes (/audio/tracks/, origin, query)
 * - Normalize spaces/underscores to hyphens
 */
export function normalizeTrackId(input: string): string {
  let normalized = input.toLowerCase();

  // Remove file extensions
  normalized = normalized.replace(/\.(mp3|wav|m4a|ogg|flac|aac)$/i, '');

  // Remove URL protocols and origins
  normalized = normalized.replace(/^https?:\/\/[^/]+\//i, '');

  // Remove common path prefixes
  normalized = normalized.replace(/^(audio\/tracks\/|tracks\/|audio\/)/i, '');

  // Remove query strings
  normalized = normalized.split('?')[0];

  // Normalize separators
  normalized = normalized.replace(/[_\s]+/g, '-');

  // Remove leading/trailing hyphens
  normalized = normalized.replace(/^-+|-+$/g, '');

  return normalized;
}

/**
 * Generate a unique track ID
 */
export function generateTrackId(): string {
  return `track-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Calculate optimal transition point between two tracks
 * Based on energy levels and beat alignment
 */
export function findOptimalTransition(
  track1Duration: number,
  track2Start: number,
  bpm1?: number,
  bpm2?: number
): number {
  // Default: 8-bar transition (32 beats at 120 BPM = 16 seconds)
  const defaultTransitionDuration = 16;

  if (!bpm1 || !bpm2) return defaultTransitionDuration;

  // Calculate 8-bar duration for both tracks
  const bars = 8;
  const beatsPerBar = 4;
  const totalBeats = bars * beatsPerBar;

  const duration1 = (totalBeats * 60) / bpm1;
  const duration2 = (totalBeats * 60) / bpm2;

  // Use average of both
  return (duration1 + duration2) / 2;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Convert BPM to beat duration (seconds)
 */
export function bpmToBeatDuration(bpm: number): number {
  return 60 / bpm;
}

/**
 * Detect if two BPMs are compatible for mixing
 * (within 10% tempo range)
 */
export function bpmsAreCompatible(bpm1: number, bpm2: number): boolean {
  const ratio = Math.max(bpm1, bpm2) / Math.min(bpm1, bpm2);
  return ratio <= 1.1; // Within 10%
}
