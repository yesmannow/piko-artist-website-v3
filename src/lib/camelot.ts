/**
 * Camelot Harmonic Mixing Utility
 *
 * Implements the Camelot Wheel compatibility algorithm
 * for harmonic match detection in the Syndicate Vault studio.
 *
 * Reference: .agent/knowledge/audio-references/camelot-map.md
 */

export interface CamelotKey {
  number: number; // 1-12
  letter: 'A' | 'B'; // A = minor, B = major
}

/**
 * Parse a Camelot code string (e.g. "4A", "8B") into components
 */
export function parseCamelot(code: string): CamelotKey | null {
  const match = code.trim().match(/^(\d{1,2})([AB])$/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (num < 1 || num > 12) return null;
  return { number: num, letter: match[2].toUpperCase() as 'A' | 'B' };
}

/**
 * Compute harmonic compatibility between two Camelot keys.
 * Returns a score from 0.0 (incompatible) to 1.0 (perfect match).
 *
 * Scoring:
 *   1.0  — Same key
 *   0.9  — Adjacent key (±1, same letter)
 *   0.85 — Relative major/minor (same number, switch letter)
 *   0.7  — Adjacent key (±1, different letter — cross-ring neighbor)
 *   0.6  — Two steps away (±2, same letter)
 *   0.5  — Dominant relationship (±7, same letter)
 *   0.2  — Incompatible
 */
export function camelotCompatibility(keyA: string, keyB: string): number {
  const a = parseCamelot(keyA);
  const b = parseCamelot(keyB);
  if (!a || !b) return 0;

  // Same key
  if (a.number === b.number && a.letter === b.letter) return 1.0;

  // Relative major/minor
  if (a.number === b.number && a.letter !== b.letter) return 0.85;

  const diff = Math.abs(a.number - b.number);
  const circularDiff = Math.min(diff, 12 - diff);

  // Same ring
  if (a.letter === b.letter) {
    if (circularDiff === 1) return 0.9;
    if (circularDiff === 2) return 0.6;
    if (circularDiff === 7) return 0.5; // Dominant
  }

  // Cross-ring neighbor
  if (a.letter !== b.letter && circularDiff === 1) return 0.7;

  return 0.2;
}

/**
 * Check if two keys are harmonically compatible (score >= 0.7)
 */
export function isHarmonicMatch(keyA: string, keyB: string): boolean {
  return camelotCompatibility(keyA, keyB) >= 0.7;
}

/**
 * Get a human-readable label for a compatibility score
 */
export function getMatchLabel(score: number): string {
  if (score >= 1.0) return 'PERFECT';
  if (score >= 0.85) return 'HARMONIC';
  if (score >= 0.7) return 'COMPATIBLE';
  if (score >= 0.5) return 'CAUTION';
  return 'CLASH';
}
