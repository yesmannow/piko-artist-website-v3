import React, { useEffect, useState } from 'react';

export function DiagnosticsPanel() {
  const [fps, setFps] = useState(0);
  const [mem, setMem] = useState<number | null>(null);
  const [workerHealth, setWorkerHealth] = useState('unknown');
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let frames = 0;
    function tick(now: number) {
      frames++;
      if (now - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    const memInterval = setInterval(() => {
      if ((performance as any).memory) setMem(Math.round(((performance as any).memory.usedJSHeapSize || 0) / 1024 / 1024));
    }, 2000);
    // worker health ping (assumes useStemWorker exposes ping)
    const healthInterval = setInterval(async () => {
      try {
        // ping worker via global helper if available
        const ok = await (window as any).__PIKO_TEST_HELPERS__?.pingWorker?.();
        setWorkerHealth(ok ? 'ok' : 'unreachable');
      } catch {
        setWorkerHealth('error');
      }
    }, 3000);
    return () => { cancelAnimationFrame(raf); clearInterval(memInterval); clearInterval(healthInterval); };
  }, []);
  return (
    <div style={{ position: 'fixed', right: 12, top: 12, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: 8, borderRadius: 8, zIndex: 9999 }}>
      <div>FPS: {fps}</div>
      <div>Memory: {mem ?? 'n/a'} MB</div>
      <div>Worker: {workerHealth}</div>
      <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify({ fps, mem, workerHealth })); }}>Copy Report</button>
    </div>
  );
}
