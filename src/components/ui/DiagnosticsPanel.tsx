"use client";

import React, { useState, useEffect, useRef } from 'react';

interface DiagnosticData {
  fps: number;
  memoryUsage?: number;
  audioLatency?: number;
  activeWorkers: number;
  renderTime: number;
}

export function DiagnosticsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<DiagnosticData>({
    fps: 0,
    activeWorkers: 0,
    renderTime: 0,
  });
  const frameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  useEffect(() => {
    // Only show in dev or when test helpers enabled
    const shouldShow =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_ENABLE_TEST_HELPERS === 'true';

    if (!shouldShow) return;

    const updateDiagnostics = () => {
      const now = performance.now();
      frameCountRef.current++;
      
      if (now - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        frameCountRef.current = 0;
        lastTimeRef.current = now;

        // Get memory if available
        const memory = (performance as any).memory
          ? {
              used: Math.round((performance as any).memory.usedJSHeapSize / 1048576),
              total: Math.round((performance as any).memory.totalJSHeapSize / 1048576),
            }
          : undefined;

        setData((prev) => ({
          ...prev,
          fps,
          memoryUsage: memory?.used,
        }));
      }

      frameRef.current = requestAnimationFrame(updateDiagnostics);
    };

    frameRef.current = requestAnimationFrame(updateDiagnostics);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  // Only render if test helpers enabled or in dev
  const shouldRender =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_ENABLE_TEST_HELPERS === 'true';

  if (!shouldRender) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="diagnostics-toggle"
        aria-label="Toggle diagnostics"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9998,
          padding: '8px 12px',
          fontSize: 11,
          background: 'rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 6,
          color: '#fff',
          cursor: 'pointer',
          fontFamily: 'monospace',
        }}
      >
        {isOpen ? 'Hide' : 'Show'} Diagnostics
      </button>
      {isOpen && (
        <div
          className="diagnostics-panel"
          style={{
            position: 'fixed',
            bottom: 60,
            right: 20,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 8,
            padding: 16,
            minWidth: 200,
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#fff',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div style={{ marginBottom: 12, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 8 }}>
            Diagnostics
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca3af' }}>FPS:</span>
              <span style={{ color: data.fps < 30 ? '#ef4444' : data.fps < 50 ? '#f59e0b' : '#22c55e' }}>
                {data.fps}
              </span>
            </div>
            {data.memoryUsage !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Memory:</span>
                <span>{data.memoryUsage} MB</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca3af' }}>Workers:</span>
              <span>{data.activeWorkers}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca3af' }}>Render:</span>
              <span>{data.renderTime.toFixed(2)}ms</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
