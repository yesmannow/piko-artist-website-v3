import { useEffect, useState } from 'react';

export type Complexity = 'simple' | 'pro';

export function useComplexityMode() {
  const [mode, setMode] = useState<Complexity>(() => {
    try {
      const stored = localStorage.getItem('piko_complexity_mode');
      if (stored === 'simple' || stored === 'pro') return stored;
    } catch {}
    // auto-detect: low-power devices -> simple
    if (typeof globalThis !== 'undefined') {
      const nav = (globalThis as unknown as { navigator?: Navigator }).navigator;
      if (nav) {
        const hc = nav.hardwareConcurrency ?? 4;
        if (hc < 4) return 'simple';
      }
    }
    return 'pro';
  });

  useEffect(() => {
    try { localStorage.setItem('piko_complexity_mode', mode); } catch {}
  }, [mode]);

  return { mode, setMode };
}
