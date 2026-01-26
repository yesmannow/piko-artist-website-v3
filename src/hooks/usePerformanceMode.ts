import { useEffect, useState } from 'react';

export function usePerformanceMode() {
  const [mode, setMode] = useState<'high'|'low'>(() => {
    if (typeof navigator === 'undefined') return 'high';
    const hc = (navigator as any).hardwareConcurrency ?? 4;
    if (hc < 4) return 'low';
    return 'high';
  });

  useEffect(() => {
    // measure first-second frame time
    let rafId: number;
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
        if (avg > 22) setMode('low');
        else setMode('high');
        cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return mode;
}
