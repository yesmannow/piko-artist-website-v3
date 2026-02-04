"use client";

import { useEffect, useRef, useState } from 'react';
import { useStudioStore } from '@/store/useStudioStore';

export type PerformanceLevel = 'high' | 'balanced' | 'low';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryPressure: number;
}

/**
 * Hook to monitor performance and auto-downgrade visuals if needed
 */
export function usePerformanceHeuristics() {
  const setPerformanceMode = useStudioStore((state) => state.setPerformanceMode);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    memoryPressure: 0,
  });
  const frameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const frameTimesRef = useRef<number[]>([]);

  useEffect(() => {
    // Initialize on mount instead of during render
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = performance.now();
    }

    const measurePerformance = () => {
      const now = performance.now();
      const deltaTime = now - lastTimeRef.current;
      frameCountRef.current++;
      frameTimesRef.current.push(deltaTime);

      // Keep only last 60 frames
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }

      // Calculate FPS every second
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
        const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;

        // Calculate memory pressure if available
        let memoryPressure = 0;
        const memInfo = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        if (memInfo) {
          const used = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
          memoryPressure = Math.min(1, used);
        }

        setMetrics({
          fps,
          frameTime: avgFrameTime,
          memoryPressure,
        });

        // Auto-downgrade logic
        if (fps < 30 || avgFrameTime > 50 || memoryPressure > 0.8) {
          setPerformanceMode('low');
        } else if (fps < 45 || avgFrameTime > 33 || memoryPressure > 0.6) {
          setPerformanceMode('balanced');
        } else if (fps >= 55 && avgFrameTime < 20 && memoryPressure < 0.5) {
          setPerformanceMode('high');
        }

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      frameRef.current = requestAnimationFrame(measurePerformance);
    };

    frameRef.current = requestAnimationFrame(measurePerformance);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [setPerformanceMode]);

  return metrics;
}
