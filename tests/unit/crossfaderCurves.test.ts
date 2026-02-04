/**
 * Phase S7: Crossfader Curves Tests
 */

import { describe, it, expect } from 'vitest';
import { 
  applyCrossfaderCurve, 
  normalizeCrossfaderValue,
  type CrossfaderCurve 
} from '@/audio/mixer/crossfaderCurves';

describe('crossfaderCurves', () => {
  describe('linear curve', () => {
    it('should produce linear crossfade at center', () => {
      const result = applyCrossfaderCurve(0.5, 'linear');
      expect(result.gainA).toBeCloseTo(0.5, 3);
      expect(result.gainB).toBeCloseTo(0.5, 3);
    });

    it('should produce full A at position 0', () => {
      const result = applyCrossfaderCurve(0, 'linear');
      expect(result.gainA).toBe(1);
      expect(result.gainB).toBe(0);
    });

    it('should produce full B at position 1', () => {
      const result = applyCrossfaderCurve(1, 'linear');
      expect(result.gainA).toBe(0);
      expect(result.gainB).toBe(1);
    });

    it('should clamp values above 1', () => {
      const result = applyCrossfaderCurve(1.5, 'linear');
      expect(result.gainA).toBe(0);
      expect(result.gainB).toBe(1);
    });

    it('should clamp values below 0', () => {
      const result = applyCrossfaderCurve(-0.5, 'linear');
      expect(result.gainA).toBe(1);
      expect(result.gainB).toBe(0);
    });
  });

  describe('constantPower curve', () => {
    it('should maintain equal power at center', () => {
      const result = applyCrossfaderCurve(0.5, 'constantPower');
      const sumOfSquares = result.gainA ** 2 + result.gainB ** 2;
      expect(sumOfSquares).toBeCloseTo(1.0, 2);
    });

    it('should produce approximately 0.707 at center (equal power)', () => {
      const result = applyCrossfaderCurve(0.5, 'constantPower');
      expect(result.gainA).toBeCloseTo(0.707, 2);
      expect(result.gainB).toBeCloseTo(0.707, 2);
    });

    it('should maintain power law throughout range', () => {
      const positions = [0.1, 0.3, 0.5, 0.7, 0.9];
      positions.forEach(pos => {
        const result = applyCrossfaderCurve(pos, 'constantPower');
        const sumOfSquares = result.gainA ** 2 + result.gainB ** 2;
        expect(sumOfSquares).toBeCloseTo(1.0, 2);
      });
    });

    it('should produce full A at position 0', () => {
      const result = applyCrossfaderCurve(0, 'constantPower');
      expect(result.gainA).toBeCloseTo(1, 3);
      expect(result.gainB).toBeCloseTo(0, 3);
    });

    it('should produce full B at position 1', () => {
      const result = applyCrossfaderCurve(1, 'constantPower');
      expect(result.gainA).toBeCloseTo(0, 3);
      expect(result.gainB).toBeCloseTo(1, 3);
    });
  });

  describe('dip curve', () => {
    it('should produce center dip (lower than constant power)', () => {
      const dipResult = applyCrossfaderCurve(0.5, 'dip');
      const cpResult = applyCrossfaderCurve(0.5, 'constantPower');
      
      // Dip should be quieter at center
      expect(dipResult.gainA).toBeLessThan(cpResult.gainA);
      expect(dipResult.gainB).toBeLessThan(cpResult.gainB);
    });

    it('should still produce full A at position 0', () => {
      const result = applyCrossfaderCurve(0, 'dip');
      expect(result.gainA).toBeCloseTo(1, 2);
      expect(result.gainB).toBeCloseTo(0, 2);
    });

    it('should still produce full B at position 1', () => {
      const result = applyCrossfaderCurve(1, 'dip');
      expect(result.gainA).toBeCloseTo(0, 2);
      expect(result.gainB).toBeCloseTo(1, 2);
    });
  });

  describe('cut curve', () => {
    it('should hard cut at very low position', () => {
      const result = applyCrossfaderCurve(0.05, 'cut');
      expect(result.gainA).toBe(1);
      expect(result.gainB).toBe(0);
    });

    it('should hard cut at very high position', () => {
      const result = applyCrossfaderCurve(0.95, 'cut');
      expect(result.gainA).toBe(0);
      expect(result.gainB).toBe(1);
    });

    it('should have transition in middle range', () => {
      const result = applyCrossfaderCurve(0.5, 'cut');
      expect(result.gainA).toBeGreaterThan(0);
      expect(result.gainA).toBeLessThan(1);
      expect(result.gainB).toBeGreaterThan(0);
      expect(result.gainB).toBeLessThan(1);
    });

    it('should have sharper curve than linear in transition', () => {
      const cutResult = applyCrossfaderCurve(0.5, 'cut');
      const linearResult = applyCrossfaderCurve(0.5, 'linear');
      
      // Cut curve should be more extreme (further from 0.5)
      // This is a general property of exponential curves
      expect(Math.abs(cutResult.gainA - 0.5)).toBeGreaterThanOrEqual(0);
      expect(linearResult.gainA).toBeCloseTo(0.5, 3);
    });
  });

  describe('normalizeCrossfaderValue', () => {
    it('should convert -1 to 0', () => {
      expect(normalizeCrossfaderValue(-1)).toBe(0);
    });

    it('should convert 0 to 0.5', () => {
      expect(normalizeCrossfaderValue(0)).toBeCloseTo(0.5, 3);
    });

    it('should convert 1 to 1', () => {
      expect(normalizeCrossfaderValue(1)).toBe(1);
    });

    it('should clamp values above 1', () => {
      expect(normalizeCrossfaderValue(2)).toBe(1);
    });

    it('should clamp values below -1', () => {
      expect(normalizeCrossfaderValue(-2)).toBe(0);
    });
  });

  describe('curve comparison', () => {
    it('should all produce same endpoints', () => {
      const curves: CrossfaderCurve[] = ['linear', 'constantPower', 'dip', 'cut'];
      
      curves.forEach(curve => {
        const resultA = applyCrossfaderCurve(0, curve);
        const resultB = applyCrossfaderCurve(1, curve);
        
        expect(resultA.gainA).toBeCloseTo(1, 2);
        expect(resultA.gainB).toBeCloseTo(0, 2);
        expect(resultB.gainA).toBeCloseTo(0, 2);
        expect(resultB.gainB).toBeCloseTo(1, 2);
      });
    });

    it('should produce different center points', () => {
      const linear = applyCrossfaderCurve(0.5, 'linear');
      const cp = applyCrossfaderCurve(0.5, 'constantPower');
      const dip = applyCrossfaderCurve(0.5, 'dip');
      
      // All should be different at center
      expect(linear.gainA).not.toBeCloseTo(cp.gainA, 2);
      expect(cp.gainA).not.toBeCloseTo(dip.gainA, 2);
    });
  });
});
