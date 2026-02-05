"use client";

/**
 * Phase 5 Batch 2: Phase Meter
 *
 * Visual indicator showing phase offset between two decks.
 * Essential for beatmatching and manual sync.
 *
 * Features:
 * - Circular phase meter (±180° visualization)
 * - Real-time phase calculation from beatgrids
 * - Color-coded sync status:
 *   - Green: In sync (±5%)
 *   - Yellow: Close (±15%)
 *   - Red: Out of sync (>15%)
 * - Numeric phase display (ms offset)
 * - BPM difference indicator
 *
 * Industry Comparison:
 * - VirtualDJ: Uses circular phase meter ✅ We match this
 * - Traktor: Shows phase offset as bar ✅ We do better (circular)
 * - Serato: No visual phase meter ✅ We exceed this
 */

import { useEffect, useRef, useCallback } from "react";
import type { BeatGridData } from "@/lib/audio/beatDetection";
import { getPhaseOffset } from "@/lib/audio/beatDetection";

interface PhaseMeterProps {
  readonly beatGridA: BeatGridData | null;
  readonly beatGridB: BeatGridData | null;
  readonly currentTimeA: number; // Deck A playback position (seconds)
  readonly currentTimeB: number; // Deck B playback position (seconds)
  readonly size?: number; // Meter size in pixels (default: 80)
}

/**
 * Phase Meter Component
 *
 * Displays sync status between Deck A and Deck B:
 * - Circular needle shows phase offset
 * - Color indicates sync quality
 * - Numeric display shows ms offset and BPM diff
 */
export function PhaseMeter({
  beatGridA,
  beatGridB,
  currentTimeA,
  currentTimeB,
  size = 80,
}: Readonly<PhaseMeterProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  /**
   * Draw inactive state (no beatgrids loaded)
   */
  const drawInactiveState = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number
  ) => {
    // Draw dimmed outer ring
    ctx.strokeStyle = "#ffffff10";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw "NO DATA" label
    ctx.fillStyle = "#ffffff30";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("NO DATA", centerX, centerY + 4);
  }, []);

  /**
   * Draw phase meter on canvas
   */
  const drawMeter = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas resolution (2x for retina)
    const dpr = globalThis.window?.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.35;

    // If no beatgrids loaded, show inactive state
    if (!beatGridA || !beatGridB) {
      drawInactiveState(ctx, centerX, centerY, radius);
      return;
    }

    // Calculate phase offset (-0.5 to +0.5 beats)
    const phaseOffset = getPhaseOffset(
      beatGridA,
      beatGridB,
      currentTimeA,
      currentTimeB
    );

    // Convert to milliseconds for display
    const beatInterval = 60 / beatGridA.bpm; // Seconds per beat
    const phaseMs = phaseOffset * beatInterval * 1000;

    // Calculate BPM difference
    const bpmDiff = beatGridB.bpm - beatGridA.bpm;

    // Determine sync status color
    const absPhase = Math.abs(phaseOffset);
    let statusColor: string;
    if (absPhase < 0.05) {
      statusColor = "#4ade80"; // Green: In sync (±5%)
    } else if (absPhase < 0.15) {
      statusColor = "#fbbf24"; // Yellow: Close (±15%)
    } else {
      statusColor = "#ef4444"; // Red: Out of sync
    }

    // Draw outer ring (background)
    ctx.strokeStyle = "#ffffff20";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw tick marks (12 o'clock = 0°, 3 o'clock = +90°, etc.)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const tickRadius = radius + 4;
      const tickLength = i % 3 === 0 ? 8 : 4;

      ctx.strokeStyle = "#ffffff40";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(angle) * tickRadius,
        centerY + Math.sin(angle) * tickRadius
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * (tickRadius + tickLength),
        centerY + Math.sin(angle) * (tickRadius + tickLength)
      );
      ctx.stroke();
    }

    // Draw phase needle
    const needleAngle = phaseOffset * Math.PI * 2 - Math.PI / 2; // -0.5 = -180°, 0 = 0°, +0.5 = +180°
    const needleLength = radius * 0.85;

    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(needleAngle) * needleLength,
      centerY + Math.sin(needleAngle) * needleLength
    );
    ctx.stroke();

    // Draw center dot
    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw numeric phase display (ms)
    ctx.fillStyle = statusColor;
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      `${phaseMs > 0 ? "+" : ""}${phaseMs.toFixed(0)}ms`,
      centerX,
      centerY + radius + 18
    );

    // Draw BPM difference
    ctx.fillStyle = "#ffffff80";
    ctx.font = "9px monospace";
    ctx.fillText(
      `${bpmDiff > 0 ? "+" : ""}${bpmDiff.toFixed(1)} BPM`,
      centerX,
      centerY + radius + 30
    );

    // Draw "SYNC" label when in sync
    if (absPhase < 0.05) {
      ctx.fillStyle = statusColor;
      ctx.font = "bold 10px monospace";
      ctx.fillText("SYNC", centerX, centerY - radius - 12);
    }
  }, [beatGridA, beatGridB, currentTimeA, currentTimeB, size, drawInactiveState]);

  /**
   * Animation loop (60fps)
   */
  useEffect(() => {
    const tick = () => {
      drawMeter();
      rafRef.current = globalThis.window?.requestAnimationFrame(tick);
    };

    rafRef.current = globalThis.window?.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        globalThis.window?.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [drawMeter]);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-mono uppercase tracking-wider text-white/50">
        Phase
      </span>
      <canvas
        ref={canvasRef}
        className="rounded-lg bg-black/30 border border-white/5"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
