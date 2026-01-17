/**
 * PHASE 3: Haptic Feedback Utility
 *
 * Provides haptic feedback patterns for mobile DJ workstation.
 * Replaces physical "clicks" and improves tactile feel on touch devices.
 */

export const triggerHaptic = (pattern: number | number[]) => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

/**
 * PHASE 3: Haptic Patterns for Mobile DJ Interface
 */
export const HAPTIC_PATTERNS = {
  // Basic interactions
  CLICK: 5, // Short tick for buttons
  BUMP: 10, // Medium bump for center detents
  SUCCESS: [10, 30, 10], // Double bump for success

  // PHASE 3: Fader interactions
  FADER_MIDPOINT: 15, // Buzz when fader hits midpoint (center detent)
  FADER_SLIDE: 3, // Subtle tick while sliding
  CROSSFADER_CENTER: 20, // Stronger buzz for crossfader center

  // PHASE 3: Pad/Cue interactions
  PAD_TRIGGER: 8, // Short buzz when pad triggered
  PAD_ON_BEAT: [10, 20, 10], // Double buzz when pad triggered on beat
  CUE_TOGGLE: 12, // Medium buzz for cue point toggle
  CUE_JUMP: [8, 20, 8], // Pattern for jumping to cue

  // PHASE 3: Deck interactions
  PLAY_TOGGLE: 10, // Play/pause toggle
  SYNC_ENABLE: [5, 50, 5], // Sync enabled pattern
  LOOP_SET: [8, 30, 8, 30, 8], // Triple buzz for loop set

  // PHASE 3: Jog wheel
  JOG_TICK: 3, // Very short tick for jog wheel rotation
  JOG_SCRUB: 5, // Slightly longer for scrubbing
  PLATTER_STOP: [20, 50, 10], // Pattern for stopping the platter

  // PHASE 3: Effects
  FX_ON: [5, 20, 5], // Effect enabled
  FX_OFF: 8, // Effect disabled
  BEAT_SYNC: 5, // Beat marker hit

  // Error states
  ERROR: [10, 50, 10, 50, 10], // Triple buzz for errors
  WARNING: [15, 30, 15], // Double buzz for warnings
};
