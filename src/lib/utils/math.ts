/**
 * Volume and curve math utilities for the Bézier automation pipeline.
 *
 * Uses the gain = linearValue² law throughout so that perceived loudness
 * follows an approximately logarithmic response.  A mid-point slider value
 * of 0.5 maps to a gain of 0.25 (≈ −12 dB), producing a perceptually even
 * volume sweep.
 */

/**
 * Convert a normalised (0–1) volume automation value to an AudioParam gain
 * value using the gain = linearValue² law.
 */
export const volumeToGain = (linearValue: number): number =>
  Math.pow(Math.max(0, Math.min(1, linearValue)), 2);

/**
 * Evaluate the y-coordinate of a cubic Bézier curve at parameter t ∈ [0, 1].
 *
 * B(t) = (1−t)³·p0y + 3(1−t)²t·p1y + 3(1−t)t²·p2y + t³·p3y
 */
export const evalBezierY = (
  t: number,
  p0y: number,
  p1y: number,
  p2y: number,
  p3y: number,
): number => {
  const mt = 1 - t;
  return (
    mt * mt * mt * p0y +
    3 * mt * mt * t * p1y +
    3 * mt * t * t * p2y +
    t * t * t * p3y
  );
};

/**
 * Sample an ordered list of automation points into a Float32Array of
 * `numSamples` values suitable for `AudioParam.setValueCurveAtTime`.
 *
 * Each point has:
 *  - `time`   — position in seconds
 *  - `value`  — normalised 0–1 parameter value
 *  - `curve`  — interpolation mode ('linear' | 'bezier' | 'exponential')
 *  - `bezierControlPoints` — optional cubic Bézier handles (cp1y / cp2y used)
 *
 * When `isVolume` is true every sample is passed through `volumeToGain` so the
 * resulting curve already embeds the gain = linearValue² law.
 *
 * @param points      Ordered automation points (sorted ascending by time).
 * @param duration    Total duration of the sample window in seconds.
 * @param numSamples  Number of output samples (default 4096).
 * @param isVolume    Apply `volumeToGain` conversion when true (default true).
 */
export function sampleAutomationCurve(
  points: Array<{
    time: number;
    value: number;
    curve: 'linear' | 'bezier' | 'exponential';
    bezierControlPoints?: { cp1x: number; cp1y: number; cp2x: number; cp2y: number };
  }>,
  duration: number,
  numSamples = 4096,
  isVolume = true,
): Float32Array {
  const out = new Float32Array(numSamples);

  if (duration <= 0 || points.length === 0) {
    const fill = isVolume ? volumeToGain(1) : 1;
    out.fill(fill);
    return out;
  }

  // With a single sample there is no denominator; just evaluate at t=0.
  // `points[0]` is safe: the `points.length === 0` guard above returns early.
  if (numSamples === 1) {
    const v = isVolume ? volumeToGain(points[0].value) : Math.max(0, Math.min(1, points[0].value));
    out[0] = v;
    return out;
  }

  for (let i = 0; i < numSamples; i++) {
    // Current time within the sample window
    const t = (i / (numSamples - 1)) * duration;

    // Locate the surrounding pair of automation points
    let prevPt = points[0];
    let nextPt: (typeof points)[0] | null = null;

    for (let j = 0; j < points.length - 1; j++) {
      if (t >= points[j].time && t <= points[j + 1].time) {
        prevPt = points[j];
        nextPt = points[j + 1];
        break;
      }
    }

    let linearValue: number;

    if (!nextPt) {
      // Before the first point or after the last point — hold edge value
      linearValue =
        t < points[0].time ? points[0].value : points[points.length - 1].value;
    } else {
      const segDur = nextPt.time - prevPt.time;
      const localT = segDur > 0 ? (t - prevPt.time) / segDur : 0;

      if (nextPt.curve === 'bezier' && nextPt.bezierControlPoints) {
        const cp = nextPt.bezierControlPoints;
        linearValue = evalBezierY(localT, prevPt.value, cp.cp1y, cp.cp2y, nextPt.value);
      } else if (nextPt.curve === 'exponential') {
        // S-curve approximation: hold cp1y at the start value and cp2y at the
        // end value so the curve eases in and out — a close visual match to the
        // perceptual gain = value² law applied by the isVolume path below.
        linearValue = evalBezierY(localT, prevPt.value, prevPt.value, nextPt.value, nextPt.value);
      } else {
        // Linear (and unknown type fallback) interpolation
        linearValue = prevPt.value + localT * (nextPt.value - prevPt.value);
      }
    }

    out[i] = isVolume
      ? volumeToGain(linearValue)
      : Math.max(0, Math.min(1, linearValue));
  }

  return out;
}
