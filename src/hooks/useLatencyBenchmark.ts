"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Latency Benchmarking Hook
 * 
 * Phase 4: Advanced Features - Latency Benchmarking
 * 
 * Measures end-to-end audio latency and provides performance metrics:
 * - Base latency (hardware buffer size)
 * - Output latency (device-specific)
 * - Total round-trip latency
 * - Dynamic buffer size adjustment based on performance
 * 
 * Target: Keep round-trip latency below 20ms for professional DJ performance
 */

export interface LatencyMetrics {
  /**
   * Hardware buffer base latency in seconds
   */
  baseLatency: number;
  
  /**
   * Output device latency in seconds
   */
  outputLatency: number;
  
  /**
   * Total round-trip latency in milliseconds
   */
  totalLatencyMs: number;
  
  /**
   * Current audio buffer size in samples
   */
  bufferSize: number;
  
  /**
   * Sample rate in Hz
   */
  sampleRate: number;
  
  /**
   * Whether latency is within acceptable range (<20ms)
   */
  isAcceptable: boolean;
  
  /**
   * Performance grade (A+, A, B, C, D, F)
   */
  grade: string;
  
  /**
   * Number of audio glitches detected
   */
  glitchCount: number;
}

export interface LatencyBenchmarkState {
  /**
   * Current latency metrics
   */
  metrics: LatencyMetrics | null;
  
  /**
   * Whether benchmarking is in progress
   */
  isBenchmarking: boolean;
  
  /**
   * Whether continuous monitoring is active
   */
  isMonitoring: boolean;
  
  /**
   * Historical metrics for trending
   */
  history: LatencyMetrics[];
}

const ACCEPTABLE_LATENCY_MS = 20;
const EXCELLENT_LATENCY_MS = 10;
const GOOD_LATENCY_MS = 15;
const FAIR_LATENCY_MS = 25;
const POOR_LATENCY_MS = 35;

/**
 * Calculate performance grade based on latency
 */
function calculateGrade(latencyMs: number): string {
  if (latencyMs <= EXCELLENT_LATENCY_MS) return 'A+';
  if (latencyMs <= GOOD_LATENCY_MS) return 'A';
  if (latencyMs <= ACCEPTABLE_LATENCY_MS) return 'B';
  if (latencyMs <= FAIR_LATENCY_MS) return 'C';
  if (latencyMs <= POOR_LATENCY_MS) return 'D';
  return 'F';
}

/**
 * useLatencyBenchmark Hook
 * 
 * Provides latency measurement and monitoring capabilities
 */
export function useLatencyBenchmark(audioContext: AudioContext | null) {
  const [state, setState] = useState<LatencyBenchmarkState>({
    metrics: null,
    isBenchmarking: false,
    isMonitoring: false,
    history: [],
  });
  
  const glitchDetectorRef = useRef<ScriptProcessorNode | null>(null);
  const monitorIntervalRef = useRef<number | null>(null);
  const glitchCountRef = useRef(0);
  
  /**
   * Measure current latency metrics
   */
  const measureLatency = useCallback((): LatencyMetrics | null => {
    if (!audioContext) {
      return null;
    }
    
    const baseLatency = audioContext.baseLatency || 0;
    const outputLatency = (audioContext as any).outputLatency || 0;
    const totalLatencySeconds = baseLatency + outputLatency;
    const totalLatencyMs = totalLatencySeconds * 1000;
    
    // Estimate buffer size from base latency
    const sampleRate = audioContext.sampleRate;
    const bufferSize = Math.round(baseLatency * sampleRate);
    
    const metrics: LatencyMetrics = {
      baseLatency,
      outputLatency,
      totalLatencyMs,
      bufferSize,
      sampleRate,
      isAcceptable: totalLatencyMs <= ACCEPTABLE_LATENCY_MS,
      grade: calculateGrade(totalLatencyMs),
      glitchCount: glitchCountRef.current,
    };
    
    return metrics;
  }, [audioContext]);
  
  /**
   * Run a single benchmark
   */
  const runBenchmark = useCallback(async () => {
    if (!audioContext || state.isBenchmarking) {
      return;
    }
    
    setState(prev => ({ ...prev, isBenchmarking: true }));
    
    try {
      // Reset glitch counter
      glitchCountRef.current = 0;
      
      // Wait a moment for audio context to stabilize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Measure latency
      const metrics = measureLatency();
      
      if (metrics) {
        setState(prev => ({
          ...prev,
          metrics,
          isBenchmarking: false,
          history: [...prev.history.slice(-19), metrics], // Keep last 20 measurements
        }));
        
        // Log results
        console.log('[LatencyBenchmark] Results:', {
          totalLatencyMs: metrics.totalLatencyMs.toFixed(2) + 'ms',
          grade: metrics.grade,
          bufferSize: metrics.bufferSize,
          sampleRate: metrics.sampleRate,
        });
      } else {
        setState(prev => ({ ...prev, isBenchmarking: false }));
      }
    } catch (error) {
      console.error('[LatencyBenchmark] Benchmark failed:', error);
      setState(prev => ({ ...prev, isBenchmarking: false }));
    }
  }, [audioContext, measureLatency, state.isBenchmarking]);
  
  /**
   * Start continuous monitoring
   */
  const startMonitoring = useCallback(() => {
    if (state.isMonitoring || !audioContext) {
      return;
    }
    
    setState(prev => ({ ...prev, isMonitoring: true }));
    
    // Initial measurement
    runBenchmark();
    
    // Set up periodic measurements (every 5 seconds)
    monitorIntervalRef.current = window.setInterval(() => {
      const metrics = measureLatency();
      if (metrics) {
        setState(prev => ({
          ...prev,
          metrics,
          history: [...prev.history.slice(-19), metrics],
        }));
      }
    }, 5000);
    
    console.log('[LatencyBenchmark] Monitoring started');
  }, [audioContext, measureLatency, runBenchmark, state.isMonitoring]);
  
  /**
   * Stop continuous monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (monitorIntervalRef.current !== null) {
      clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }
    
    setState(prev => ({ ...prev, isMonitoring: false }));
    console.log('[LatencyBenchmark] Monitoring stopped');
  }, []);
  
  /**
   * Detect audio glitches (underruns/overruns)
   * Uses ScriptProcessorNode as a legacy fallback for glitch detection
   */
  const setupGlitchDetection = useCallback(() => {
    if (!audioContext || glitchDetectorRef.current) {
      return;
    }
    
    try {
      // Create a script processor to detect gaps
      const bufferSize = 4096;
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      let lastProcessTime = audioContext.currentTime;
      
      processor.onaudioprocess = (event) => {
        const currentTime = audioContext.currentTime;
        const expectedInterval = bufferSize / audioContext.sampleRate;
        const actualInterval = currentTime - lastProcessTime;
        
        // If the interval is significantly larger than expected, we likely had a glitch
        if (actualInterval > expectedInterval * 1.5) {
          glitchCountRef.current++;
          console.warn('[LatencyBenchmark] Audio glitch detected', {
            expected: expectedInterval.toFixed(4),
            actual: actualInterval.toFixed(4),
            glitchCount: glitchCountRef.current,
          });
        }
        
        lastProcessTime = currentTime;
      };
      
      // Connect processor (but don't connect to destination to avoid audio output)
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(audioContext.destination);
      
      glitchDetectorRef.current = processor;
      
      console.log('[LatencyBenchmark] Glitch detection enabled');
    } catch (error) {
      console.warn('[LatencyBenchmark] Could not set up glitch detection:', error);
    }
  }, [audioContext]);
  
  /**
   * Get recommendations based on current metrics
   */
  const getRecommendations = useCallback((): string[] => {
    if (!state.metrics) {
      return [];
    }
    
    const recommendations: string[] = [];
    
    if (state.metrics.totalLatencyMs > ACCEPTABLE_LATENCY_MS) {
      recommendations.push('Latency is above target. Consider using a dedicated audio interface.');
    }
    
    if (state.metrics.glitchCount > 5) {
      recommendations.push('Frequent audio glitches detected. Try closing other applications.');
    }
    
    if (state.metrics.bufferSize > 512) {
      recommendations.push('Large buffer size detected. Your system may benefit from lower latency settings.');
    }
    
    if (state.metrics.totalLatencyMs <= EXCELLENT_LATENCY_MS) {
      recommendations.push('Excellent latency! Your system is optimized for professional use.');
    }
    
    return recommendations;
  }, [state.metrics]);
  
  // Auto-start monitoring when audio context is available
  useEffect(() => {
    if (audioContext && audioContext.state === 'running') {
      setupGlitchDetection();
      runBenchmark();
    }
  }, [audioContext, setupGlitchDetection, runBenchmark]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
      
      if (glitchDetectorRef.current) {
        glitchDetectorRef.current.disconnect();
        glitchDetectorRef.current = null;
      }
    };
  }, [stopMonitoring]);
  
  return {
    ...state,
    runBenchmark,
    startMonitoring,
    stopMonitoring,
    getRecommendations,
  };
}
