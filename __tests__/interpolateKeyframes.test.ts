import { interpolateKeyframes } from '@/lib/fx/FXAutomation';
import type { Keyframe } from '@/lib/fx/FXAutomation';

describe('interpolateKeyframes', () => {
  test('interpolates correctly between two keyframes', () => {
    const keyframes: Keyframe[] = [
      { time: 0, value: 0 },
      { time: 1, value: 1 },
    ];

    expect(interpolateKeyframes(keyframes, 0.5)).toBeCloseTo(0.5, 5);
    expect(interpolateKeyframes(keyframes, 0.25)).toBeCloseTo(0.25, 5);
    expect(interpolateKeyframes(keyframes, 0.75)).toBeCloseTo(0.75, 5);
  });

  test('returns exact value at keyframe time', () => {
    const keyframes: Keyframe[] = [
      { time: 0, value: 0 },
      { time: 1, value: 1 },
      { time: 2, value: 0.5 },
    ];

    expect(interpolateKeyframes(keyframes, 0)).toBe(0);
    expect(interpolateKeyframes(keyframes, 1)).toBe(1);
    expect(interpolateKeyframes(keyframes, 2)).toBe(0.5);
  });

  test('returns first value before first keyframe', () => {
    const keyframes: Keyframe[] = [
      { time: 1, value: 0.5 },
      { time: 2, value: 1 },
    ];

    expect(interpolateKeyframes(keyframes, 0)).toBe(0.5);
    expect(interpolateKeyframes(keyframes, 0.5)).toBe(0.5);
  });

  test('returns last value after last keyframe', () => {
    const keyframes: Keyframe[] = [
      { time: 0, value: 0 },
      { time: 1, value: 0.5 },
    ];

    expect(interpolateKeyframes(keyframes, 1.5)).toBe(0.5);
    expect(interpolateKeyframes(keyframes, 2)).toBe(0.5);
    expect(interpolateKeyframes(keyframes, 10)).toBe(0.5);
  });

  test('handles empty keyframes array', () => {
    const keyframes: Keyframe[] = [];
    expect(interpolateKeyframes(keyframes, 0)).toBe(0);
    expect(interpolateKeyframes(keyframes, 5)).toBe(0);
  });

  test('handles single keyframe', () => {
    const keyframes: Keyframe[] = [{ time: 1, value: 0.75 }];

    expect(interpolateKeyframes(keyframes, 0)).toBe(0.75);
    expect(interpolateKeyframes(keyframes, 1)).toBe(0.75);
    expect(interpolateKeyframes(keyframes, 2)).toBe(0.75);
  });

  test('handles unsorted keyframes', () => {
    const keyframes: Keyframe[] = [
      { time: 2, value: 1 },
      { time: 0, value: 0 },
      { time: 1, value: 0.5 },
    ];

    // Should still interpolate correctly
    expect(interpolateKeyframes(keyframes, 0.5)).toBeCloseTo(0.25, 5);
    expect(interpolateKeyframes(keyframes, 1.5)).toBeCloseTo(0.75, 5);
  });

  test('handles multiple keyframes with varying values', () => {
    const keyframes: Keyframe[] = [
      { time: 0, value: 0 },
      { time: 5, value: 0.5 },
      { time: 10, value: 1 },
      { time: 15, value: 0.25 },
    ];

    expect(interpolateKeyframes(keyframes, 2.5)).toBeCloseTo(0.25, 5);
    expect(interpolateKeyframes(keyframes, 7.5)).toBeCloseTo(0.75, 5);
    expect(interpolateKeyframes(keyframes, 12.5)).toBeCloseTo(0.625, 5);
  });

  test('handles negative time values', () => {
    const keyframes: Keyframe[] = [
      { time: 0, value: 0 },
      { time: 1, value: 1 },
    ];

    expect(interpolateKeyframes(keyframes, -1)).toBe(0);
  });

  test('handles keyframes with same time (uses last value)', () => {
    const keyframes: Keyframe[] = [
      { time: 0, value: 0 },
      { time: 1, value: 0.5 },
      { time: 1, value: 0.75 }, // Duplicate time
      { time: 2, value: 1 },
    ];

    // At time 1, should use the last value (0.75)
    expect(interpolateKeyframes(keyframes, 1)).toBe(0.75);
  });
});
