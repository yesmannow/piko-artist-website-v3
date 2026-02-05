"use client";

/**
 * Phase 5 Batch 2: BeatGrid Overlay
 *
 * Canvas-based beat marker visualization overlaid on waveform.
 * Provides visual tempo feedback for DJs.
 *
 * Features:
 * - Beat markers aligned to detected BPM
 * - Downbeat highlighting (bar 1 markers)
 * - Zoom-aware rendering (shows appropriate beat divisions)
 * - Real-time playhead sync
 * - Theme-aware colors (uses --studio-* tokens)
 * - 60fps Canvas rendering
 *
 * Architecture:
 * - Pure visual layer (no audio logic)
 * - Uses beatgrid data from Dexie
 * - Syncs with Tone.js playback position
 */

import { useEffect, useRef, useCallback } from "react";
import type { BeatGridData, BeatMarker } from "@/lib/audio/beatDetection";

interface BeatGridOverlayProps {
  readonly deckId: "A" | "B";
  readonly beatGrid: BeatGridData | null;
  readonly currentTime: number; // Playback position in seconds
  readonly duration: number; // Track duration in seconds
  readonly zoom: number; // Waveform zoom level (1 = normal, 2 = 2x zoom)
  readonly containerWidth: number; // Container width in pixels
  readonly containerHeight: number; // Container height in pixels
}

/**
 * BeatGrid Canvas Overlay Component
 *
 * Renders beat markers as vertical lines with:
 * - Downbeats (bar 1): Thicker, brighter lines
 * - Regular beats: Thinner, dimmer lines
 * - Playhead pulse: Highlights current beat
 */
export function BeatGridOverlay({
  deckId,
  beatGrid,
  currentTime,
  duration,
  zoom = 1,
  containerWidth,
  containerHeight,
}: Readonly<BeatGridOverlayProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  /**
   * Draw beatgrid on canvas
   */
  const drawBeatGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !beatGrid || duration <= 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas resolution (2x for retina displays)
    const dpr = globalThis.window?.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    // Get theme colors from CSS variables
    const deckColor = deckId === "A" 
      ? getComputedStyle(document.documentElement).getPropertyValue("--studio-deck-a").trim()
      : getComputedStyle(document.documentElement).getPropertyValue("--studio-deck-b").trim();

    const accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--studio-accent-primary")
      .trim();

    // Calculate visible time window based on zoom
    const visibleDuration = duration / zoom;
    const centerTime = currentTime;
    const startTime = Math.max(0, centerTime - visibleDuration / 2);
    const endTime = Math.min(duration, centerTime + visibleDuration / 2);

    // Filter beats within visible window
    const visibleBeats = beatGrid.beats.filter(
      (beat) => beat.time >= startTime && beat.time <= endTime
    );

    // Draw beat markers
    visibleBeats.forEach((beat) => {
      const x = timeToX(beat.time, startTime, endTime, containerWidth);

      // Downbeat styling (thicker, brighter)
      if (beat.downbeat) {
        ctx.strokeStyle = deckColor || "#4af2c5";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;

        // Draw downbeat marker (full height)
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, containerHeight);
        ctx.stroke();

        // Draw bar number label
        ctx.fillStyle = deckColor || "#4af2c5";
        ctx.font = "10px monospace";
        ctx.globalAlpha = 0.6;
        ctx.fillText(`${beat.bar}`, x + 4, 12);
      } else {
        // Regular beat styling (thinner, dimmer)
        ctx.strokeStyle = deckColor || "#4af2c5";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;

        // Draw beat marker (partial height)
        ctx.beginPath();
        ctx.moveTo(x, containerHeight * 0.2);
        ctx.lineTo(x, containerHeight * 0.8);
        ctx.stroke();
      }
    });

    // Draw current beat pulse (highlight beat nearest to playhead)
    const currentBeat = findNearestBeat(currentTime, beatGrid.beats);
    if (currentBeat) {
      const beatX = timeToX(currentBeat.time, startTime, endTime, containerWidth);
      const distanceFromBeat = Math.abs(currentTime - currentBeat.time);
      const beatInterval = 60 / beatGrid.bpm; // Seconds per beat
      const pulseProgress = distanceFromBeat / beatInterval; // 0 = on beat, 1 = halfway to next

      // Pulse effect: fade in/out as playhead approaches/leaves beat
      const pulseAlpha = Math.max(0, 1 - pulseProgress * 2);

      if (pulseAlpha > 0.1) {
        ctx.strokeStyle = accentColor || "#00ffff";
        ctx.lineWidth = 3;
        ctx.globalAlpha = pulseAlpha * 0.8;

        // Draw pulsing beat marker
        ctx.beginPath();
        ctx.moveTo(beatX, 0);
        ctx.lineTo(beatX, containerHeight);
        ctx.stroke();

        // Draw glow effect
        ctx.shadowBlur = 8;
        ctx.shadowColor = accentColor || "#00ffff";
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // Draw BPM indicator (top-left corner)
    ctx.fillStyle = deckColor || "#4af2c5";
    ctx.font = "bold 11px monospace";
    ctx.globalAlpha = 0.7;
    ctx.fillText(`${beatGrid.bpm.toFixed(1)} BPM`, 8, containerHeight - 8);

    // Draw confidence indicator if low
    if (beatGrid.confidence < 0.7) {
      ctx.fillStyle = "#ff9500"; // Warning color
      ctx.font = "9px monospace";
      ctx.globalAlpha = 0.6;
      ctx.fillText(
        `Confidence: ${Math.round(beatGrid.confidence * 100)}%`,
        8,
        containerHeight - 20
      );
    }
  }, [
    beatGrid,
    currentTime,
    duration,
    zoom,
    containerWidth,
    containerHeight,
    deckId,
  ]);

  /**
   * Animation loop (60fps)
   */
  useEffect(() => {
    const tick = () => {
      drawBeatGrid();
      rafRef.current = globalThis.window?.requestAnimationFrame(tick);
    };

    rafRef.current = globalThis.window?.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        globalThis.window?.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [drawBeatGrid]);

  // Redraw on window resize
  useEffect(() => {
    const handleResize = () => drawBeatGrid();
    globalThis.window?.addEventListener("resize", handleResize);
    return () => globalThis.window?.removeEventListener("resize", handleResize);
  }, [drawBeatGrid]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        width: containerWidth,
        height: containerHeight,
      }}
    />
  );
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Convert time (seconds) to X coordinate (pixels)
 */
function timeToX(
  time: number,
  startTime: number,
  endTime: number,
  width: number
): number {
  const visibleDuration = endTime - startTime;
  const relativeTime = time - startTime;
  return (relativeTime / visibleDuration) * width;
}

/**
 * Find beat marker nearest to given time
 */
function findNearestBeat(
  time: number,
  beats: BeatMarker[]
): BeatMarker | null {
  if (beats.length === 0) return null;

  let nearest = beats[0];
  let minDistance = Math.abs(time - beats[0].time);

  for (const beat of beats) {
    const distance = Math.abs(time - beat.time);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = beat;
    }
    if (beat.time > time) break; // Optimization: stop after passing target
  }

  return nearest;
}
