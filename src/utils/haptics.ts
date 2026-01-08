export const triggerHaptic = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

export const HAPTIC_PATTERNS = {
  CLICK: 5, // Short tick for buttons
  BUMP: 10, // Medium bump for center detents
  SUCCESS: [10, 30, 10], // Double bump
};
