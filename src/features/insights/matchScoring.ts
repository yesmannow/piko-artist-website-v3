/**
 * Phase S8: Match Scoring System
 *
 * Smart track matching based on BPM, key, and energy compatibility.
 * Default mode: "energyAware" for build-up/breakdown flow.
 */

import type { TrackInsights } from '@/db/studioDb';

export type MatchMode = 'energyAware' | 'strict' | 'harmonic';

export type MatchBadge = 'PERFECT' | 'GOOD' | 'OK' | null;

/**
 * Match score result with breakdown
 */
export interface MatchScore {
  score: number;              // Final score 0.0-1.0
  badge: MatchBadge;          // Badge for UI display
  breakdown: {
    keyScore: number;         // Key compatibility 0.0-1.0
    bpmScore: number;         // BPM proximity 0.0-1.0
    energyScore: number;      // Energy compatibility 0.0-1.0
  };
  tooltip: string;            // Human-readable description
}

/**
 * Calculate match score between current and candidate track
 *
 * @param current Currently playing track insights
 * @param candidate Candidate track insights
 * @param mode Match mode (default: energyAware)
 * @returns Match score with badge and breakdown
 */
export function calculateMatchScore(
  current: TrackInsights,
  candidate: TrackInsights,
  mode: MatchMode = 'energyAware'
): MatchScore {
  const keyScore = calculateKeyScore(current.key, candidate.key);
  const bpmScore = calculateBpmScore(current.bpm, candidate.bpm);
  const energyScore = calculateEnergyScore(
    current.energy,
    candidate.energy,
    mode
  );

  // Calculate final score based on mode
  let finalScore: number;

  switch (mode) {
    case 'energyAware': {
      // Balanced scoring with energy emphasis
      finalScore = 0.45 * keyScore + 0.30 * bpmScore + 0.25 * energyScore;
      break;
    }

    case 'harmonic': {
      // Key-focused for harmonic mixing
      finalScore = 0.45 * keyScore + 0.35 * bpmScore + 0.20 * energyScore;
      break;
    }

    case 'strict': {
      // Exact key match required
      const keyMatch = current.key && candidate.key && current.key === candidate.key ? 1 : 0;
      finalScore = 0.50 * keyMatch + 0.30 * bpmScore + 0.20 * energyScore;
      break;
    }
  }

  const badge = getBadge(finalScore);
  const tooltip = generateTooltip(keyScore, bpmScore, energyScore, current, candidate);

  return {
    score: finalScore,
    badge,
    breakdown: { keyScore, bpmScore, energyScore },
    tooltip,
  };
}

/**
 * Calculate key compatibility score
 *
 * Tiers:
 * - PERFECT (1.00): Same tonic + mode
 * - COMPATIBLE (0.85): Relative major/minor OR harmonic neighbor
 * - OK (0.65): Two steps away on circle of fifths
 * - BAD (0.00): Everything else
 * - MISSING (0.40): Neutral fallback when data missing
 *
 * @param currentKey Current track key
 * @param candidateKey Candidate track key
 * @returns Score 0.0-1.0
 */
function calculateKeyScore(currentKey: string | null, candidateKey: string | null): number {
  // Missing data fallback
  if (!currentKey || !candidateKey) return 0.40;

  const current = normalizeKey(currentKey);
  const candidate = normalizeKey(candidateKey);

  // Perfect match: same tonic + mode
  if (current.tonic === candidate.tonic && current.mode === candidate.mode) {
    return 1.00;
  }

  // Relative major/minor (e.g., C major <-> A minor)
  if (areRelativeKeys(current, candidate)) {
    return 0.85;
  }

  // Harmonic neighbor (±1 on circle of fifths, same mode)
  if (areHarmonicNeighbors(current, candidate)) {
    return 0.85;
  }

  // Two steps away (same mode)
  if (isTwoStepsAway(current, candidate)) {
    return 0.65;
  }

  // Everything else
  return 0.00;
}

/**
 * Calculate BPM proximity score
 *
 * Handles half-time and double-time (e.g., 128 matches 64 and 256).
 * Score decreases linearly with BPM difference (12 BPM = 0% match).
 *
 * @param currentBpm Current track BPM
 * @param candidateBpm Candidate track BPM
 * @returns Score 0.0-1.0
 */
function calculateBpmScore(currentBpm: number | null, candidateBpm: number | null): number {
  // Missing data fallback
  if (!currentBpm || !candidateBpm) return 0.50;

  // Check half-time and double-time
  const candidates = [candidateBpm, candidateBpm * 2, candidateBpm / 2];
  const deltas = candidates.map(bpm => Math.abs(bpm - currentBpm));
  const minDelta = Math.min(...deltas);

  // Linear falloff: 0 BPM diff = 1.0, 12 BPM diff = 0.0
  return Math.max(0, Math.min(1, 1 - minDelta / 12));
}

/**
 * Calculate energy compatibility score
 *
 * In energyAware mode, applies intent bonuses:
 * - +0.07 for build-up range (+0.05 to +0.20 delta)
 * - +0.05 for breakdown range (-0.20 to -0.05 delta)
 * - -0.10 for jumpy transitions (>0.35 delta)
 *
 * @param currentEnergy Current track energy
 * @param candidateEnergy Candidate track energy
 * @param mode Match mode
 * @returns Score 0.0-1.0
 */
function calculateEnergyScore(
  currentEnergy: number | null,
  candidateEnergy: number | null,
  mode: MatchMode
): number {
  // Missing data fallback
  if (currentEnergy === null || candidateEnergy === null) return 0.50;

  const energyDelta = candidateEnergy - currentEnergy;

  // Base score: closeness in energy
  const base = Math.max(0, Math.min(1, 1 - Math.abs(energyDelta) / 0.45));

  // Apply intent bonus only in energyAware mode
  if (mode !== 'energyAware') return base;

  let intentBonus = 0;

  // Build-up friendly (+0.05 to +0.20 delta)
  if (energyDelta >= 0.05 && energyDelta <= 0.20) {
    intentBonus = 0.07;
  }
  // Breakdown friendly (-0.20 to -0.05 delta)
  else if (energyDelta >= -0.20 && energyDelta <= -0.05) {
    intentBonus = 0.05;
  }
  // Too jumpy (>0.35 delta)
  else if (Math.abs(energyDelta) > 0.35) {
    intentBonus = -0.10;
  }

  return Math.max(0, Math.min(1, base + intentBonus));
}

/**
 * Get badge for score
 */
function getBadge(score: number): MatchBadge {
  if (score >= 0.85) return 'PERFECT';
  if (score >= 0.70) return 'GOOD';
  if (score >= 0.55) return 'OK';
  return null; // Hidden unless "Show All" enabled
}

/**
 * Generate human-readable tooltip
 */
function generateTooltip(
  keyScore: number,
  bpmScore: number,
  energyScore: number,
  current: TrackInsights,
  candidate: TrackInsights
): string {
  const parts: string[] = [];

  // Key description
  if (keyScore >= 0.85) parts.push('Key: compatible');
  else if (keyScore >= 0.65) parts.push('Key: OK');
  else if (keyScore > 0) parts.push('Key: different');
  else parts.push('Key: N/A');

  // BPM description
  if (bpmScore >= 0.85) parts.push('BPM: close');
  else if (bpmScore >= 0.65) parts.push('BPM: OK');
  else if (bpmScore > 0) parts.push('BPM: different');
  else parts.push('BPM: N/A');

  // Energy description
  if (current.energy !== null && candidate.energy !== null) {
    const energyDelta = candidate.energy - current.energy;

    if (energyDelta >= 0.05 && energyDelta <= 0.20) {
      parts.push('Energy: build-up');
    } else if (energyDelta >= -0.20 && energyDelta <= -0.05) {
      parts.push('Energy: breakdown');
    } else if (Math.abs(energyDelta) < 0.05) {
      parts.push('Energy: similar');
    } else {
      parts.push('Energy: different');
    }
  } else {
    parts.push('Energy: N/A');
  }

  return parts.join(', ');
}

// --- Key Normalization Helpers ---

interface NormalizedKey {
  tonic: string;
  mode: 'major' | 'minor';
}

/**
 * Normalize key string to { tonic, mode }
 * Supports formats: "C major", "Am", "C#m", "C", etc.
 */
function normalizeKey(key: string): NormalizedKey {
  const trimmed = key.trim();

  // Pattern: "C major" or "C M" or "CM"
  const majorPattern = /^([A-G][#b]?)\s*(major|M)?$/i;
  // Pattern: "Am" or "A minor" or "A m"
  const minorPattern = /^([A-G][#b]?)\s*(minor|m)$/i;

  let match = trimmed.match(majorPattern);
  if (match) {
    return { tonic: normalizeEnharmonic(match[1]), mode: 'major' };
  }

  match = trimmed.match(minorPattern);
  if (match) {
    return { tonic: normalizeEnharmonic(match[1]), mode: 'minor' };
  }

  // Fallback: assume major if no mode specified
  console.warn(`[MatchScoring] Could not parse key "${key}", assuming C major`);
  return { tonic: 'C', mode: 'major' };
}

/**
 * Normalize enharmonic equivalents (e.g., Db -> C#)
 */
function normalizeEnharmonic(note: string): string {
  const enharmonics: Record<string, string> = {
    'Db': 'C#',
    'Eb': 'D#',
    'Gb': 'F#',
    'Ab': 'G#',
    'Bb': 'A#',
  };
  return enharmonics[note] || note;
}

/**
 * Circle of fifths
 */
const CIRCLE_OF_FIFTHS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'];

/**
 * Check if keys are relative major/minor
 * (e.g., C major <-> A minor)
 */
function areRelativeKeys(a: NormalizedKey, b: NormalizedKey): boolean {
  if (a.mode === b.mode) return false;

  // Chromatic scale for semitone distance
  const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const aIdx = CHROMATIC.indexOf(a.tonic);
  const bIdx = CHROMATIC.indexOf(b.tonic);

  if (aIdx === -1 || bIdx === -1) return false;

  // Relative minor is 3 semitones down (9 semitones up)
  // Major -> relative minor: +9 (e.g., C major -> A minor)
  // Minor -> relative major: +3 (e.g., A minor -> C major)
  const expectedRelative = a.mode === 'major'
    ? (aIdx + 9) % 12  // C major -> A minor
    : (aIdx + 3) % 12;  // A minor -> C major

  return expectedRelative === bIdx;
}

/**
 * Check if keys are harmonic neighbors
 * (±1 step on circle of fifths, same mode)
 */
function areHarmonicNeighbors(a: NormalizedKey, b: NormalizedKey): boolean {
  if (a.mode !== b.mode) return false;

  const aIdx = CIRCLE_OF_FIFTHS.indexOf(a.tonic);
  const bIdx = CIRCLE_OF_FIFTHS.indexOf(b.tonic);

  if (aIdx === -1 || bIdx === -1) return false;

  const distance = Math.min(
    Math.abs(aIdx - bIdx),
    12 - Math.abs(aIdx - bIdx)
  );

  return distance === 1;
}

/**
 * Check if keys are two steps away
 * (2 steps on circle of fifths, same mode)
 */
function isTwoStepsAway(a: NormalizedKey, b: NormalizedKey): boolean {
  if (a.mode !== b.mode) return false;

  const aIdx = CIRCLE_OF_FIFTHS.indexOf(a.tonic);
  const bIdx = CIRCLE_OF_FIFTHS.indexOf(b.tonic);

  if (aIdx === -1 || bIdx === -1) return false;

  const distance = Math.min(
    Math.abs(aIdx - bIdx),
    12 - Math.abs(aIdx - bIdx)
  );

  return distance === 2;
}
