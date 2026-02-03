'use client';

import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

interface LevelMeterProps {
  /** Tone.js node to analyze */
  readonly audioNode?: Tone.ToneAudioNode | null;
  /** Deck identifier for automatic node connection */
  readonly deckId?: 'A' | 'B' | 'master';
  /** Meter orientation */
  readonly orientation?: 'vertical' | 'horizontal';
  /** Height in pixels (for vertical) */
  readonly height?: number;
  /** Width in pixels (for horizontal) */
  readonly width?: number;
  /** Number of segments */
  readonly segments?: number;
  /** Label displayed near meter */
  readonly label?: string;
  /** Deck color accent */
  readonly accentColor?: string;
  /** Enable peak hold indicator */
  readonly showPeak?: boolean;
}

// Helper: Calculate RMS level from waveform
const calculateRMSLevel = (waveform: Float32Array): number => {
  let sum = 0;
  for (const sample of waveform) {
    sum += sample * sample;
  }
  return Math.sqrt(sum / waveform.length);
};

// Helper: Convert RMS to normalized dB scale
const normalizeDBLevel = (rms: number): number => {
  const dbValue = rms > 0 ? 20 * Math.log10(rms) : -60;
  return Math.max(0, Math.min(1, (dbValue + 60) / 60));
};

// Helper: Get segment color based on position
const getSegmentColor = (segmentPercent: number, isActive: boolean): string => {
  if (segmentPercent < 0.6) {
    return isActive ? '#00ff41' : '#003311'; // Green
  }
  if (segmentPercent < 0.85) {
    return isActive ? '#ffdd00' : '#332200'; // Yellow
  }
  return isActive ? '#ff0000' : '#330000'; // Red
};

// Helper: Draw meter segments
const drawSegments = (
  ctx: CanvasRenderingContext2D,
  level: number,
  segments: number,
  segmentSize: number,
  canvasWidth: number,
  canvasHeight: number,
  isVertical: boolean
) => {
  const activeSegments = Math.floor(level * segments);

  for (let i = 0; i < segments; i++) {
    const segmentIndex = segments - 1 - i;
    const isActive = segmentIndex < activeSegments;
    const segmentPercent = (i + 1) / segments;
    const color = getSegmentColor(segmentPercent, isActive);

    ctx.fillStyle = color;
    if (isVertical) {
      const y = i * (segmentSize + 2);
      ctx.fillRect(2, y, canvasWidth - 4, segmentSize);
    } else {
      const x = i * (segmentSize + 2);
      ctx.fillRect(x, 2, segmentSize, canvasHeight - 4);
    }
  }
};

// Helper: Draw peak indicator
const drawPeakIndicator = (
  ctx: CanvasRenderingContext2D,
  peakLevel: number,
  segments: number,
  segmentSize: number,
  dimensions: { width: number; height: number },
  isVertical: boolean,
  accentColor: string
) => {
  const peakSegment = Math.floor(peakLevel * segments);
  const peakIndex = segments - 1 - peakSegment;

  if (peakIndex >= 0 && peakIndex < segments) {
    ctx.fillStyle = accentColor;
    if (isVertical) {
      const y = peakIndex * (segmentSize + 2);
      ctx.fillRect(2, y, dimensions.width - 4, 2);
    } else {
      const x = peakIndex * (segmentSize + 2);
      ctx.fillRect(x, 2, 2, dimensions.height - 4);
    }
  }
};

/**
 * Professional VU Level Meter Component
 *
 * Features:
 * - Segment-style display (green → yellow → red)
 * - Peak hold indicator
 * - Hardware-accurate ballistics (attack/release)
 * - Optimized with requestAnimationFrame
 * - No React re-render overhead
 */
export function LevelMeter({
  audioNode,
  deckId: _deckId,
  orientation = 'vertical',
  height = 120,
  width = 24,
  segments = 12,
  label,
  accentColor = '#009688',
  showPeak = true,
}: LevelMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const peakLevelRef = useRef(0);
  const peakHoldTimeRef = useRef(0);
  const currentLevelRef = useRef(0);

  // Note: isActive is only used for canvas styling, not actual functionality
  // The meter works based on analyserRef.current existence
  const isActive = Boolean(audioNode);

  const isVertical = orientation === 'vertical';
  const canvasWidth = isVertical ? width : height;
  const canvasHeight = isVertical ? height : width;

  // Initialize analyser when audio node changes
  useEffect(() => {
    if (!audioNode) {
      if (analyserRef.current) {
        analyserRef.current.dispose();
        analyserRef.current = null;
      }
      return;
    }

    try {
      // Create Tone.js analyser with optimized settings
      const analyser = new Tone.Analyser({
        type: 'waveform',
        size: 256,
        smoothing: 0.8, // Smooth out quick fluctuations
      });

      // Connect audio node to analyser (doesn't affect audio path)
      audioNode.connect(analyser);
      analyserRef.current = analyser;

      console.log('[LevelMeter] Analyser connected');
    } catch (error) {
      console.error('[LevelMeter] Failed to create analyser:', error);
    }

    return () => {
      if (analyserRef.current) {
        analyserRef.current.dispose();
        analyserRef.current = null;
      }
    };
  }, [audioNode]);

  // Render loop with requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current || !isActive) {
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);

    const PEAK_HOLD_TIME_MS = 1500; // Peak indicator holds for 1.5 seconds
    const ATTACK_TIME_MS = 10; // Fast attack
    const RELEASE_TIME_MS = 300; // Slower release (ballistics)

    // Hardware-accurate timestamp tracking for 120Hz/144Hz monitors
    let lastTime = performance.now();

    const render = (timestamp: number) => {
      if (!analyserRef.current || !ctx) return;

      // Calculate actual delta time for hardware-accurate ballistics
      const dt = timestamp - lastTime;
      lastTime = timestamp;

      // Get RMS level from analyser
      const waveform = analyserRef.current.getValue() as Float32Array;
      const rms = calculateRMSLevel(waveform);
      const normalizedLevel = normalizeDBLevel(rms);

      // Apply ballistics (attack/release) using actual delta time
      const current = currentLevelRef.current;
      if (normalizedLevel > current) {
        // Fast attack - exponential approach
        const attackAlpha = 1 - Math.pow(0.01, dt / ATTACK_TIME_MS);
        currentLevelRef.current = current + (normalizedLevel - current) * attackAlpha;
      } else {
        // Slow release - exponential decay
        const releaseAlpha = 1 - Math.pow(0.01, dt / RELEASE_TIME_MS);
        currentLevelRef.current = current + (normalizedLevel - current) * releaseAlpha;
      }

      const level = currentLevelRef.current;

      // Peak hold logic
      if (level > peakLevelRef.current) {
        peakLevelRef.current = level;
        peakHoldTimeRef.current = timestamp;
      } else if (timestamp - peakHoldTimeRef.current > PEAK_HOLD_TIME_MS) {
        peakLevelRef.current = Math.max(0, peakLevelRef.current - 0.01);
      }

      // Clear canvas
      ctx.fillStyle = '#0a0b10';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw segments
      const segmentSize = isVertical
        ? (canvasHeight - (segments - 1) * 2) / segments
        : (canvasWidth - (segments - 1) * 2) / segments;

      drawSegments(ctx, level, segments, segmentSize, canvasWidth, canvasHeight, isVertical);

      // Draw peak indicator
      if (showPeak && peakLevelRef.current > 0) {
        drawPeakIndicator(
          ctx,
          peakLevelRef.current,
          segments,
          segmentSize,
          { width: canvasWidth, height: canvasHeight },
          isVertical,
          accentColor
        );
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, canvasWidth, canvasHeight, segments, isVertical, showPeak, accentColor]);

  return (
    <div className="flex flex-col items-center gap-1">
      <canvas
        ref={canvasRef}
        className="rounded-sm"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          imageRendering: 'crisp-edges',
        }}
      />
      {label && (
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
          {label}
        </span>
      )}
    </div>
  );
}

export default LevelMeter;
