/**
 * bezier.worker.ts
 *
 * Samples an ordered list of automation control-points into a dense
 * Float32Array for use with `AudioParam.setValueCurveAtTime`.
 *
 * Inlines the math functions from `src/lib/utils/math.ts` because webpack
 * worker bundling can fail to resolve path-aliased imports in type:module
 * workers at runtime.
 *
 * Messages in:
 *   { type: 'SAMPLE_CURVE'; deckId: string; points: AutomationPoint[];
 *     numSamples: number; duration: number; isVolume?: boolean }
 *
 * Messages out:
 *   { type: 'CURVE_READY'; deckId: string; curve: Float32Array; duration: number }
 */

interface AutomationPoint {
  time: number;
  value: number;
  curve: 'linear' | 'bezier' | 'exponential';
  bezierControlPoints?: { cp1x: number; cp1y: number; cp2x: number; cp2y: number };
}

interface SampleCurveMessage {
  type: 'SAMPLE_CURVE';
  deckId: string;
  points: AutomationPoint[];
  numSamples?: number;
  duration: number;
  isVolume?: boolean;
}

// ── Inlined math ──────────────────────────────────────────────────────────────

const volumeToGain = (v: number): number =>
  Math.pow(Math.max(0, Math.min(1, v)), 2);

const evalBezierY = (
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

function sampleAutomationCurve(
  points: AutomationPoint[],
  duration: number,
  numSamples: number,
  isVolume: boolean,
): Float32Array {
  const out = new Float32Array(numSamples);

  if (duration <= 0 || points.length === 0) {
    out.fill(isVolume ? volumeToGain(1) : 1);
    return out;
  }

  // Single-sample edge case avoids division by zero in the loop below.
  // `points[0]` is safe: the `points.length === 0` guard above returns early.
  if (numSamples === 1) {
    out[0] = isVolume
      ? volumeToGain(points[0].value)
      : Math.max(0, Math.min(1, points[0].value));
    return out;
  }

  for (let i = 0; i < numSamples; i++) {
    const t = (i / (numSamples - 1)) * duration;

    let prevPt = points[0];
    let nextPt: AutomationPoint | null = null;

    for (let j = 0; j < points.length - 1; j++) {
      if (t >= points[j].time && t <= points[j + 1].time) {
        prevPt = points[j];
        nextPt = points[j + 1];
        break;
      }
    }

    let linearValue: number;

    if (!nextPt) {
      linearValue =
        t < points[0].time ? points[0].value : points[points.length - 1].value;
    } else {
      const segDur = nextPt.time - prevPt.time;
      const localT = segDur > 0 ? (t - prevPt.time) / segDur : 0;

      if (nextPt.curve === 'bezier' && nextPt.bezierControlPoints) {
        const cp = nextPt.bezierControlPoints;
        linearValue = evalBezierY(localT, prevPt.value, cp.cp1y, cp.cp2y, nextPt.value);
      } else {
        linearValue = prevPt.value + localT * (nextPt.value - prevPt.value);
      }
    }

    out[i] = isVolume
      ? volumeToGain(linearValue)
      : Math.max(0, Math.min(1, linearValue));
  }

  return out;
}

// ── Message handler ───────────────────────────────────────────────────────────

self.onmessage = (e: MessageEvent<SampleCurveMessage>) => {
  try {
    const { type, deckId, points, numSamples = 4096, duration, isVolume = true } = e.data;

    if (type === 'SAMPLE_CURVE') {
      const curve = sampleAutomationCurve(points, duration, numSamples, isVolume);
      self.postMessage(
        { type: 'CURVE_READY', deckId, curve, duration },
        [curve.buffer],
      );
    }
  } catch (err) {
    // Post the error back to the main thread so the Sentry SDK can capture it.
    self.postMessage({
      type: 'CURVE_ERROR',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
};
