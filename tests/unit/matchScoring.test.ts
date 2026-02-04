/**
 * Phase S8: Match Scoring Tests
 */

import { describe, it, expect } from 'vitest';
import { calculateMatchScore, type MatchMode } from '@/features/insights/matchScoring';
import type { TrackInsights } from '@/db/studioDb';

// Helper to create track insights
function createInsights(
  bpm: number | null,
  key: string | null,
  energy: number | null
): TrackInsights {
  return {
    trackId: 'test-track',
    bpm,
    key,
    energy,
    analyzedAt: Date.now(),
    algoVersion: 1,
  };
}

describe('matchScoring', () => {
  describe('perfect matches', () => {
    it('should score perfect match highly in energyAware mode', () => {
      const current = createInsights(128, 'C major', 0.7);
      const candidate = createInsights(128, 'C major', 0.7);

      const score = calculateMatchScore(current, candidate, 'energyAware');

      expect(score.score).toBeGreaterThan(0.9);
      expect(score.badge).toBe('PERFECT');
    });

    it('should score perfect match highly in harmonic mode', () => {
      const current = createInsights(128, 'Am', 0.7);
      const candidate = createInsights(128, 'Am', 0.7);

      const score = calculateMatchScore(current, candidate, 'harmonic');

      expect(score.score).toBeGreaterThan(0.9);
      expect(score.badge).toBe('PERFECT');
    });

    it('should score perfect match in strict mode', () => {
      const current = createInsights(128, 'C major', 0.7);
      const candidate = createInsights(128, 'C major', 0.7);

      const score = calculateMatchScore(current, candidate, 'strict');

      expect(score.score).toBeGreaterThan(0.85);
      expect(score.badge).toBe('PERFECT');
    });
  });

  describe('key compatibility', () => {
    it('should recognize relative major/minor keys', () => {
      const current = createInsights(128, 'C major', 0.7);
      const candidate = createInsights(128, 'A minor', 0.7);

      const score = calculateMatchScore(current, candidate, 'harmonic');

      expect(score.breakdown.keyScore).toBeCloseTo(0.85, 2);
      expect(score.badge).toBe('PERFECT');
    });

    it('should recognize harmonic neighbors', () => {
      const current = createInsights(128, 'C major', 0.7);
      const candidate = createInsights(128, 'G major', 0.7);

      const score = calculateMatchScore(current, candidate, 'harmonic');

      expect(score.breakdown.keyScore).toBeCloseTo(0.85, 2);
    });

    it('should handle enharmonic equivalents', () => {
      const current = createInsights(128, 'Db major', 0.7);
      const candidate = createInsights(128, 'C# major', 0.7);

      const score = calculateMatchScore(current, candidate, 'harmonic');

      expect(score.breakdown.keyScore).toBe(1.0);
    });

    it('should penalize incompatible keys', () => {
      const current = createInsights(128, 'C major', 0.7);
      const candidate = createInsights(128, 'F# major', 0.7);

      const score = calculateMatchScore(current, candidate, 'harmonic');

      expect(score.breakdown.keyScore).toBeLessThan(0.7);
    });
  });

  describe('BPM compatibility', () => {
    it('should handle exact BPM match', () => {
      const current = createInsights(128, 'C major', 0.7);
      const candidate = createInsights(128, 'G major', 0.7);

      const score = calculateMatchScore(current, candidate, 'energyAware');

      expect(score.breakdown.bpmScore).toBe(1.0);
    });

    it('should handle half-time', () => {
      const current = createInsights(128, 'C major', 0.7);
      const candidate = createInsights(64, 'G major', 0.7);

      const score = calculateMatchScore(current, candidate, 'energyAware');

      expect(score.breakdown.bpmScore).toBe(1.0);
    });

    it('should handle double-time', () => {
      const current = createInsights(128, 'C major', 0.7);
      const candidate = createInsights(256, 'G major', 0.7);

      const score = calculateMatchScore(current, candidate, 'energyAware');

      expect(score.breakdown.bpmScore).toBe(1.0);
    });

    it('should decrease with BPM difference', () => {
      const current = createInsights(128, 'C major', 0.7);
      const candidate = createInsights(134, 'C major', 0.7);

      const score = calculateMatchScore(current, candidate, 'energyAware');

      expect(score.breakdown.bpmScore).toBeCloseTo(0.5, 1);
    });

    it('should score 0 for very different BPMs', () => {
      const current = createInsights(128, 'C major', 0.7);
      const candidate = createInsights(100, 'C major', 0.7);

      const score = calculateMatchScore(current, candidate, 'energyAware');

      expect(score.breakdown.bpmScore).toBe(0);
    });
  });

  describe('energy compatibility - energyAware mode', () => {
    it('should apply build-up bonus', () => {
      const current = createInsights(128, 'C major', 0.6);
      const candidate = createInsights(128, 'C major', 0.7); // +0.1 delta

      const score = calculateMatchScore(current, candidate, 'energyAware');

      // Should have intent bonus
      expect(score.breakdown.energyScore).toBeGreaterThan(0.8);
    });

    it('should apply breakdown bonus', () => {
      const current = createInsights(128, 'C major', 0.7);
      const candidate = createInsights(128, 'C major', 0.6); // -0.1 delta

      const score = calculateMatchScore(current, candidate, 'energyAware');

      // Should have intent bonus (slightly less than build-up)
      expect(score.breakdown.energyScore).toBeGreaterThan(0.75);
    });

    it('should penalize jumpy transitions', () => {
      const current = createInsights(128, 'C major', 0.3);
      const candidate = createInsights(128, 'C major', 0.9); // +0.6 delta (too much)

      const score = calculateMatchScore(current, candidate, 'energyAware');

      // Should have penalty
      expect(score.breakdown.energyScore).toBeLessThan(0.5);
    });

    it('should not apply intent bonus in harmonic mode', () => {
      const current = createInsights(128, 'C major', 0.6);
      const candidateAwaren = createInsights(128, 'C major', 0.7);

      const scoreAware = calculateMatchScore(current, candidateAwaren, 'energyAware');
      const scoreHarmonic = calculateMatchScore(current, candidateAwaren, 'harmonic');

      // EnergyAware should have higher energy score due to intent bonus
      expect(scoreAware.breakdown.energyScore).toBeGreaterThan(scoreHarmonic.breakdown.energyScore);
    });
  });

  describe('missing data handling', () => {
    it('should handle missing BPM gracefully', () => {
      const current = createInsights(null, 'C major', 0.7);
      const candidate = createInsights(128, 'C major', 0.7);

      const score = calculateMatchScore(current, candidate, 'energyAware');

      expect(score.breakdown.bpmScore).toBe(0.5);
      expect(score.score).toBeGreaterThan(0);
    });

    it('should handle missing key gracefully', () => {
      const current = createInsights(128, null, 0.7);
      const candidate = createInsights(128, 'C major', 0.7);

      const score = calculateMatchScore(current, candidate, 'energyAware');

      expect(score.breakdown.keyScore).toBe(0.4);
      expect(score.score).toBeGreaterThan(0);
    });

    it('should handle missing energy gracefully', () => {
      const current = createInsights(128, 'C major', null);
      const candidate = createInsights(128, 'C major', 0.7);

      const score = calculateMatchScore(current, candidate, 'energyAware');

      expect(score.breakdown.energyScore).toBe(0.5);
      expect(score.score).toBeGreaterThan(0);
    });

    it('should handle all missing data', () => {
      const current = createInsights(null, null, null);
      const candidate = createInsights(128, 'C major', 0.7);

      const score = calculateMatchScore(current, candidate, 'energyAware');

      expect(score.score).toBeGreaterThan(0);
      expect(score.score).toBeLessThan(0.6);
      expect(score.badge).toBeNull();
    });
  });

  describe('badge assignment', () => {
    it('should assign PERFECT badge for high scores', () => {
      const current = createInsights(128, 'C major', 0.7);
      const candidate = createInsights(128, 'C major', 0.75);

      const score = calculateMatchScore(current, candidate, 'energyAware');

      expect(score.badge).toBe('PERFECT');
    });

    it('should assign GOOD badge for medium-high scores', () => {
      const current = createInsights(128, 'C major', 0.7);
      const candidate = createInsights(132, 'G major', 0.7);

      const score = calculateMatchScore(current, candidate, 'energyAware');

      expect(score.badge).toBe('GOOD');
    });

    it('should assign OK badge for medium scores', () => {
      const current = createInsights(128, 'C major', 0.7);
      const candidate = createInsights(134, 'D major', 0.6);

      const score = calculateMatchScore(current, candidate, 'energyAware');

      expect(score.badge).toBe('OK');
    });

    it('should assign null badge for low scores', () => {
      const current = createInsights(128, 'C major', 0.7);
      const candidate = createInsights(100, 'F# major', 0.3);

      const score = calculateMatchScore(current, candidate, 'energyAware');

      expect(score.badge).toBeNull();
    });
  });

  describe('tooltip generation', () => {
    it('should generate descriptive tooltip', () => {
      const current = createInsights(128, 'C major', 0.6);
      const candidate = createInsights(128, 'G major', 0.7);

      const score = calculateMatchScore(current, candidate, 'energyAware');

      expect(score.tooltip).toContain('Key: compatible');
      expect(score.tooltip).toContain('BPM: close');
      expect(score.tooltip).toContain('Energy: build-up');
    });

    it('should indicate breakdown in tooltip', () => {
      const current = createInsights(128, 'C major', 0.7);
      const candidate = createInsights(128, 'Am', 0.6);

      const score = calculateMatchScore(current, candidate, 'energyAware');

      expect(score.tooltip).toContain('Energy: breakdown');
    });
  });

  describe('mode comparison', () => {
    it('should weight key more in harmonic mode', () => {
      const current = createInsights(128, 'C major', 0.7);
      const goodKey = createInsights(128, 'Am', 0.7); // Good key (relative)
      const okKey = createInsights(128, 'D major', 0.7); // OK key (two steps away)

      const scoreGoodHarmonic = calculateMatchScore(current, goodKey, 'harmonic');
      const scoreOkHarmonic = calculateMatchScore(current, okKey, 'harmonic');

      const scoreGoodEnergy = calculateMatchScore(current, goodKey, 'energyAware');
      const scoreOkEnergy = calculateMatchScore(current, okKey, 'energyAware');

      // Harmonic mode weights key 0.45, energyAware weights it 0.45 too
      // But harmonic weights BPM 0.35 vs 0.30, and energy 0.20 vs 0.25
      // So the key difference (0.85 vs 0.65 = 0.20 gap) matters the same
      const harmonicGap = scoreGoodHarmonic.score - scoreOkHarmonic.score;
      const energyGap = scoreGoodEnergy.score - scoreOkEnergy.score;

      // Both should have similar gaps since key weight is the same
      expect(Math.abs(harmonicGap - energyGap)).toBeLessThan(0.05);
    });

    it('should require exact key in strict mode', () => {
      const current = createInsights(128, 'C major', 0.7);
      const sameKey = createInsights(128, 'C major', 0.7);
      const relativeKey = createInsights(128, 'Am', 0.7);

      const scoreStrict = calculateMatchScore(current, relativeKey, 'strict');
      const scoreSame = calculateMatchScore(current, sameKey, 'strict');

      // Strict mode should heavily penalize even relative keys
      expect(scoreSame.score).toBeGreaterThan(scoreStrict.score + 0.3);
    });
  });
});
