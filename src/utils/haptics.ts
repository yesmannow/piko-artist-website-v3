// haptics.ts - small cross-platform haptic helper
export function haptic(type: 'weak' | 'medium' | 'strong' = 'weak') {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'weak') navigator.vibrate?.(10);
      if (type === 'medium') navigator.vibrate?.([20, 10, 20]);
      if (type === 'strong') navigator.vibrate?.([30, 20, 30, 20, 30]);
    }
    // iOS native haptics via WebHID/WebUSB not standard — leave hook for native wrappers
  } catch (e) {
    // silent
  }
}
