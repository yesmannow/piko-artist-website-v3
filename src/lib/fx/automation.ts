/**
 * Automation Interpolation Core
 *
 * Simple linear interpolation between keyframes for FX automation.
 * This is the foundation for timeline-based parameter automation.
 */

export type Keyframe = { time: number; value: number };

/**
 * Interpolate between keyframes to get value at current time
 *
 * @param keyframes - Array of keyframes (will be sorted by time)
 * @param t - Current time in seconds
 * @returns Interpolated value
 */
export function interpolateKeyframes(keyframes: Keyframe[], t: number): number {
  if (!keyframes.length) return 0;

  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  const afterIndex = sorted.findIndex((k) => k.time > t);
  if (afterIndex === -1) return sorted[sorted.length - 1].value;
  if (afterIndex === 0) return sorted[0].value;

  const before = sorted[afterIndex - 1];
  const after = sorted[afterIndex];

  const span = after.time - before.time;
  if (span <= 0) return after.value;

  const alpha = (t - before.time) / span;
  return before.value + alpha * (after.value - before.value);
}
