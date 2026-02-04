import { useEffect, useState } from 'react';

export function usePerformanceMode() {
  const [mode, setMode] = useState<'high' | 'low'>(() => {
    const nav = typeof globalThis === 'undefined' ? undefined : (globalThis as unknown as Navigator);
    if (!nav) return 'high';
    const hc = nav.hardwareConcurrency ?? 4;
    return hc < 4 ? 'low' : 'high';
  });

  useEffect(() => {
    // measure initial frame times to detect slow devices
    let rafId = 0;
    let last = performance.now();
    let frames = 0;
    let total = 0;

    function tick(now: number) {
      const dt = now - last;
      last = now;
      total += dt;
      frames++;
      if (frames >= 10) {
        const avg = total / frames;
        setMode(avg > 22 ? 'low' : 'high');
        cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const onChange = () => {
      const nav = typeof globalThis === 'undefined' ? undefined : (globalThis as unknown as Navigator);
      if (!nav) return;
      const hc = nav.hardwareConcurrency ?? 4;
      setMode(hc < 4 ? 'low' : 'high');
    };

  const hasGlobal = typeof globalThis !== 'undefined' && typeof (globalThis as unknown as Window).addEventListener === 'function';
  if (!hasGlobal) return undefined;

  const g = globalThis as unknown as Window;
  g.addEventListener('focus', onChange);
  return () => g.removeEventListener('focus', onChange);
  }, []);

  return mode;
}
