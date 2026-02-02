// haptics.ts - small cross-platform haptic helper
export function haptic(type: 'weak' | 'medium' | 'strong' = 'weak') {
  try {
  const nav = typeof globalThis === 'undefined' ? undefined : (globalThis as unknown as { navigator?: Navigator }).navigator;
    if (nav && 'vibrate' in nav) {
      if (type === 'weak') nav.vibrate?.(10);
      if (type === 'medium') nav.vibrate?.([20, 10, 20]);
      if (type === 'strong') nav.vibrate?.([30, 20, 30, 20, 30]);
    }
    // iOS native haptics via WebHID/WebUSB not standard — leave hook for native wrappers
  } catch (error_) {
    // ignore haptic errors
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = error_;
  }
}
