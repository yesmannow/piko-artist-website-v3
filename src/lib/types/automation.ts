/**
 * Phase 8: Automation Types — Bézier Schema
 *
 * Defines the data structures used by the Timeline HUD for parameter
 * automation curves. Supports both linear and cubic Bézier segments so
 * that smooth, expressive automation can be authored and stored.
 */

/** Control-point pair for a cubic Bézier segment (normalised 0–1 space). */
export interface BezierControlPoints {
  /** X offset of the first control point relative to the segment start (0–1). */
  cp1x: number;
  /** Y value of the first control point (0–1). */
  cp1y: number;
  /** X offset of the second control point relative to the segment start (0–1). */
  cp2x: number;
  /** Y value of the second control point (0–1). */
  cp2y: number;
}

/**
 * A single automation segment defining a parameter value at a point in time,
 * along with the interpolation curve leading INTO this segment from the
 * previous one.
 *
 * Time is expressed in seconds relative to the start of the track.
 * Value is normalised to 0–1 (consumers scale to the target parameter range).
 */
export interface AutomationSegment {
  /** Position in the track, in seconds. */
  time: number;

  /** Target parameter value at this position (0–1 normalised). */
  value: number;

  /**
   * Interpolation curve used to reach this segment from the previous one.
   * - `'linear'`  — straight-line interpolation between the two values.
   * - `'bezier'`  — smooth cubic Bézier curve; requires `bezierControlPoints`.
   */
  curve: 'linear' | 'bezier';

  /**
   * Control-point data for a Bézier curve.
   * Must be provided when `curve === 'bezier'`; ignored for `'linear'`.
   */
  bezierControlPoints?: BezierControlPoints;
}

/**
 * A named automation lane targeting a single parameter.
 * Multiple lanes are combined into a full automation track.
 */
export interface AutomationLane {
  /** Human-readable parameter name (e.g. 'volume', 'hpf', 'reverb-mix'). */
  param: string;
  /** Ordered list of segments (must be sorted by `time` ascending). */
  segments: AutomationSegment[];
}
