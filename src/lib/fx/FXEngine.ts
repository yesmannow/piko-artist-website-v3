/**
 * FXEngine - Applies automation to FX presets at a given time
 *
 * This engine computes the final FX parameter values by combining
 * base preset values with automation keyframes.
 */

import { interpolateKeyframes, type Keyframe } from "./automation";

export type FXParam =
  | "filter"
  | "eqLow"
  | "eqMid"
  | "eqHigh"
  | "reverbMix"
  | "delayMix"
  | "beatRepeat";

export type AutomationLane = {
  param: FXParam;
  keyframes: Keyframe[];
};

export type FXPreset = {
  id: string;
  name: string;
  params: Partial<Record<FXParam, number>>;
  lanes?: AutomationLane[];
};

/**
 * Compute FX parameter values at a specific time
 *
 * Base preset values are overridden by automation lanes if they exist.
 *
 * @param preset - FX preset with base params and optional automation lanes
 * @param t - Current time in seconds
 * @returns Computed FX parameter values
 */
export function computeFXAtTime(preset: FXPreset, t: number): Record<FXParam, number> {
  // Start with base preset values (default to 0 if not set)
  const base: Record<FXParam, number> = {
    filter: preset.params.filter ?? 0,
    eqLow: preset.params.eqLow ?? 0,
    eqMid: preset.params.eqMid ?? 0,
    eqHigh: preset.params.eqHigh ?? 0,
    reverbMix: preset.params.reverbMix ?? 0,
    delayMix: preset.params.delayMix ?? 0,
    beatRepeat: preset.params.beatRepeat ?? 0,
  };

  // Apply automation lanes if they exist
  for (const lane of preset.lanes ?? []) {
    if (lane.keyframes.length > 0) {
      base[lane.param] = interpolateKeyframes(lane.keyframes, t);
    }
  }

  return base;
}
