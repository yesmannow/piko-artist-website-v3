/**
 * automix.ts - AI-Driven Automix Engine Utilities
 *
 * Phase X: Utilities for intelligent track compatibility and automated mixing
 *
 * Features:
 * - Track compatibility scoring based on BPM and Camelot harmony
 * - Automated crossfading with constant-power transitions
 * - Phase-locked sync automation
 * - Mood-based track filtering
 */

import { areKeysCompatible } from "./camelot";

export interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  src: string;
  type: "audio" | "video";
  bpm?: number | null;
  camelot?: string | null;
  vibe?: "chill" | "hype" | "classic" | "storytelling" | null;
  duration?: number | null;
}

export interface CompatibilityScore {
  trackId: string;
  score: number; // 0-100, higher is better
  bpmDifference: number; // BPM difference as percentage
  isHarmonic: boolean; // True if keys are compatible
  vibeMatch: boolean; // True if vibes match
}

/**
 * Calculate BPM compatibility score
 * Returns a score from 0-100 based on BPM difference
 * Perfect match: 100
 * ±5% difference: 80-99
 * ±10% difference: 60-79
 * ±15% difference: 40-59
 * ±20% difference: 20-39
 * Beyond ±20%: 0-19
 */
export function calculateBPMCompatibility(
  masterBPM: number,
  trackBPM: number,
): number {
  if (!masterBPM || !trackBPM) return 0;

  const difference = Math.abs(trackBPM - masterBPM) / masterBPM;
  const percentageDiff = difference * 100;

  if (percentageDiff <= 1) return 100; // Perfect match
  if (percentageDiff <= 5) return 100 - (percentageDiff - 1) * 4; // 99-80
  if (percentageDiff <= 10) return 80 - (percentageDiff - 5) * 4; // 79-60
  if (percentageDiff <= 15) return 60 - (percentageDiff - 10) * 4; // 59-40
  if (percentageDiff <= 20) return 40 - (percentageDiff - 15) * 4; // 39-20
  return Math.max(0, 20 - (percentageDiff - 20) * 2); // 19-0
}

/**
 * Calculate overall compatibility score between master and candidate track
 */
export function calculateCompatibilityScore(
  masterTrack: TrackMetadata,
  candidateTrack: TrackMetadata,
  vibeMatching = true,
): CompatibilityScore {
  const bpmScore = calculateBPMCompatibility(
    masterTrack.bpm || 120,
    candidateTrack.bpm || 120,
  );
  const harmonicScore = areKeysCompatible(
    masterTrack.camelot || null,
    candidateTrack.camelot || null,
  )
    ? 100
    : 0;
  const vibeMatch = vibeMatching && masterTrack.vibe === candidateTrack.vibe;

  // Weighted scoring: BPM (40%), Harmony (50%), Vibe (10%)
  let totalScore = bpmScore * 0.4 + harmonicScore * 0.5;
  if (vibeMatching) {
    totalScore += vibeMatch ? 10 : 0;
  }

  const bpmDifference =
    masterTrack.bpm && candidateTrack.bpm
      ? (Math.abs(candidateTrack.bpm - masterTrack.bpm) / masterTrack.bpm) * 100
      : 0;

  return {
    trackId: candidateTrack.id,
    score: Math.round(totalScore),
    bpmDifference,
    isHarmonic: harmonicScore > 0,
    vibeMatch,
  };
}

/**
 * Rank library tracks by compatibility with master track
 */
export function rankCompatibleTracks(
  masterTrack: TrackMetadata,
  libraryTracks: TrackMetadata[],
  limit = 10,
  vibeMatching = true,
): CompatibilityScore[] {
  const scores = libraryTracks
    .filter((track) => track.id !== masterTrack.id) // Exclude master track
    .map((track) =>
      calculateCompatibilityScore(masterTrack, track, vibeMatching),
    )
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .slice(0, limit);

  return scores;
}

/**
 * Find next compatible track for automix
 */
export function findNextCompatibleTrack(
  masterTrack: TrackMetadata,
  libraryTracks: TrackMetadata[],
  vibeMatching = true,
): TrackMetadata | null {
  const ranked = rankCompatibleTracks(
    masterTrack,
    libraryTracks,
    1,
    vibeMatching,
  );
  if (ranked.length === 0) return null;

  const bestMatch = ranked[0];
  return libraryTracks.find((track) => track.id === bestMatch.trackId) || null;
}

/**
 * Constant-Power Crossfade Curve
 * Based on DJ Studio 5's algorithm for smooth, natural-sounding transitions
 */
export function calculateConstantPowerCrossfade(position: number): {
  left: number;
  right: number;
} {
  // position: 0 = full left, 0.5 = center, 1 = full right

  // Use sine/cosine for constant power (equal loudness)
  const leftGain = Math.cos((position * Math.PI) / 2);
  const rightGain = Math.sin((position * Math.PI) / 2);

  return {
    left: leftGain,
    right: rightGain,
  };
}

/**
 * Detect phrase boundary in beat grid
 * Simple implementation - finds next beat that's a multiple of 4 (phrase boundary)
 */
export function findNextPhraseBoundary(
  currentBeat: number,
  beatsPerPhrase = 4,
): number {
  const nextPhrase = Math.ceil(currentBeat / beatsPerPhrase) * beatsPerPhrase;
  return nextPhrase;
}

/**
 * Calculate phase alignment for seamless handoff
 * Returns time offset needed for the incoming track to align with outgoing track
 */
export function calculatePhaseAlignment(
  outgoingBPM: number,
  outgoingCurrentTime: number,
  outgoingGridOffset: number,
  incomingBPM: number,
  incomingGridOffset: number,
): number {
  // Calculate current beat position for outgoing track
  const outgoingBeatLength = 60 / outgoingBPM;
  const outgoingTimeSinceGrid = outgoingCurrentTime - outgoingGridOffset;
  const outgoingBeatsElapsed = outgoingTimeSinceGrid / outgoingBeatLength;

  // Find next phrase boundary (4-beat phrase)
  const nextPhraseBoundary = findNextPhraseBoundary(outgoingBeatsElapsed);

  // Calculate time until next phrase boundary
  const beatsUntilBoundary = nextPhraseBoundary - outgoingBeatsElapsed;
  const timeUntilBoundary = beatsUntilBoundary * outgoingBeatLength;

  // Calculate equivalent position in incoming track
  const incomingBeatLength = 60 / incomingBPM;
  const incomingBeatsFromGrid =
    (outgoingBeatsElapsed + beatsUntilBoundary) * (outgoingBPM / incomingBPM);

  // Calculate required start time for incoming track
  const incomingStartTime =
    incomingBeatsFromGrid * incomingBeatLength + incomingGridOffset;

  return incomingStartTime;
}

/**
 * Filter tracks by mood/energy level
 */
export function filterTracksByMood(
  tracks: TrackMetadata[],
  mood: "chill" | "hype" | "classic" | "storytelling" | "all" = "all",
): TrackMetadata[] {
  if (mood === "all") return tracks;
  return tracks.filter((track) => track.vibe === mood);
}
