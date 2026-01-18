/**
 * FXAutomation - Keyframe-based interpolation engine for FX automation
 * 
 * Provides smooth transitions between FX parameter values over time using
 * linear interpolation between keyframes.
 */

export interface Keyframe {
  time: number; // Time in seconds (0-60)
  value: number; // FX parameter value (0-1)
}

export interface AutomationTrack {
  id: string;
  name: string;
  type: 'delay' | 'reverb' | 'filter';
  keyframes: Keyframe[];
  deck?: 'deckA' | 'deckB';
}

/**
 * Interpolate between keyframes to get value at current time
 * 
 * @param keyframes - Sorted array of keyframes (by time)
 * @param currentTime - Current playback time in seconds
 * @returns Interpolated value between 0 and 1
 */
export function interpolateKeyframes(
  keyframes: Keyframe[],
  currentTime: number
): number {
  if (keyframes.length === 0) return 0;

  // Find keyframes before and after current time
  const before = keyframes
    .filter((kf) => kf.time <= currentTime)
    .pop();
  const after = keyframes.find((kf) => kf.time > currentTime);

  // Before first keyframe: use first value
  if (!before) return after?.value ?? 0;

  // After last keyframe: use last value
  if (!after) return before.value;

  // Linear interpolation between before and after
  const t = (currentTime - before.time) / (after.time - before.time);
  return before.value + t * (after.value - before.value);
}

/**
 * Add a keyframe to a track
 */
export function addKeyframe(
  track: AutomationTrack,
  time: number,
  value: number
): AutomationTrack {
  const newKeyframe: Keyframe = { time, value };
  const updatedKeyframes = [...track.keyframes, newKeyframe].sort(
    (a, b) => a.time - b.time
  );

  return {
    ...track,
    keyframes: updatedKeyframes,
  };
}

/**
 * Remove a keyframe from a track
 */
export function removeKeyframe(
  track: AutomationTrack,
  keyframeTime: number
): AutomationTrack {
  return {
    ...track,
    keyframes: track.keyframes.filter((kf) => kf.time !== keyframeTime),
  };
}

/**
 * Update a keyframe value
 */
export function updateKeyframe(
  track: AutomationTrack,
  keyframeTime: number,
  newValue: number
): AutomationTrack {
  return {
    ...track,
    keyframes: track.keyframes.map((kf) =>
      kf.time === keyframeTime ? { ...kf, value: newValue } : kf
    ),
  };
}

/**
 * Get value at specific time for a track
 */
export function getTrackValue(
  track: AutomationTrack,
  currentTime: number
): number {
  return interpolateKeyframes(track.keyframes, currentTime);
}

/**
 * Create a new automation track
 */
export function createAutomationTrack(
  name: string,
  type: AutomationTrack['type'],
  deck?: AutomationTrack['deck']
): AutomationTrack {
  return {
    id: `track-${Date.now()}`,
    name,
    type,
    keyframes: [],
    deck,
  };
}

/**
 * Export automation tracks to JSON
 */
export function exportAutomationTracks(tracks: AutomationTrack[]): string {
  return JSON.stringify(tracks, null, 2);
}

/**
 * Import automation tracks from JSON
 */
export function importAutomationTracks(json: string): AutomationTrack[] {
  try {
    return JSON.parse(json) as AutomationTrack[];
  } catch (e) {
    console.error('Failed to import automation tracks:', e);
    return [];
  }
}
