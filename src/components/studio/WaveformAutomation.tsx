'use client';

import React, {
  useRef,
  useEffect,
  useCallback,
  MouseEvent as ReactMouseEvent,
} from 'react';
import { useDeckStore } from '@/store/deckStore';
import { TrackAutomation } from '@/lib/db';

// ── Bezier worker message types ────────────────────────────────────────────────
interface CurveReadyMessage {
  type: 'CURVE_READY';
  deckId: string;
  curve: Float32Array;
  duration: number;
}

interface WaveformAutomationProps {
  deckId: 'A' | 'B';
  width: number;
  height: number;
  activeParam: 'volume' | 'hpf' | 'reverb';
}

// Stroke colours per parameter — used for both path and bloom shadow so all
// elements share a consistent tint regardless of the active lane.
const PARAM_COLOR: Record<string, string> = {
  volume: '#00f2ff',
  hpf: '#f43f5e',
  reverb: '#a855f7',
};

export function WaveformAutomation({ deckId, width, height, activeParam }: WaveformAutomationProps) {
  const updateTrackAutomation = useDeckStore((state) => state.updateTrackAutomation);

  // Mutable refs — avoids re-subscribing the rAF loop to every store change
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const isDraggingRef = useRef<number | null>(null);
  // Local copy of points kept in sync from the store; used by both the rAF
  // draw loop and the interaction handlers.
  const pointsRef = useRef<TrackAutomation['points']>([]);

  // ── Bezier worker ──────────────────────────────────────────────────────────
  // Holds the worker-computed Float32Array for the current automation curve.
  // Updated asynchronously; the rAF draw loop reads it every frame.
  const workerRef = useRef<Worker | null>(null);
  const curveRef = useRef<Float32Array | null>(null);
  const curveDurationRef = useRef<number>(0);

  // ── HiDPI canvas setup ─────────────────────────────────────────────────────
  // Scale the canvas backing-store by devicePixelRatio so the Neon Blue bloom
  // stays razor-sharp on Retina / 4K displays.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    // Physical pixel dimensions
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    // Keep the CSS / logical size unchanged so layout is unaffected
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }, [width, height]);

  // ── Bezier worker setup ────────────────────────────────────────────────────
  // Spawn the bezier worker once; terminate it on unmount.
  useEffect(() => {
    const worker = new Worker(
      new URL('../../workers/bezier.worker.ts', import.meta.url),
    );
    worker.onmessage = (e: MessageEvent<CurveReadyMessage>) => {
      if (e.data.type === 'CURVE_READY' && e.data.deckId === deckId) {
        curveRef.current = e.data.curve;
        curveDurationRef.current = e.data.duration;
      }
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [deckId]);

  // ── Dispatch to bezier worker ──────────────────────────────────────────────
  // Called whenever the automation point list or track duration changes.
  // Uses isVolume=false so the worker returns raw 0-1 values that map directly
  // to the canvas Y axis — gain-squared values are only needed for audio.
  const dispatchToWorker = useCallback(
    (pts: TrackAutomation['points'], duration: number) => {
      const worker = workerRef.current;
      if (!worker || pts.length === 0 || duration <= 0) {
        curveRef.current = null;
        return;
      }
      worker.postMessage({
        type: 'SAMPLE_CURVE',
        deckId,
        points: pts,
        numSamples: Math.min(4096, Math.ceil(width * 2)),
        duration,
        isVolume: false,
      });
    },
    [deckId, width],
  );

  // Coordinate helpers — recreated on prop change via the rAF closure
  const timeToX = useCallback(
    (time: number, duration: number) => (duration > 0 ? (time / duration) * width : 0),
    [width],
  );
  const xToTime = useCallback(
    (x: number, duration: number) =>
      duration > 0 ? Math.max(0, Math.min(duration, (x / width) * duration)) : 0,
    [width],
  );
  const valueToY = useCallback(
    (value: number) => height - value * height,
    [height],
  );
  const yToValue = useCallback(
    (y: number) => Math.max(0, Math.min(1, 1 - y / height)),
    [height],
  );

  // ── "Rule of 32" snap logic ────────────────────────────────────────────────
  // Snaps to the nearest 32-beat phrase boundary.  Hold Shift to bypass.
  const getSnappedTime = (timeSec: number, bpm?: string, noSnap?: boolean) => {
    if (noSnap || !bpm || Number(bpm) <= 0) return timeSec;
    const beatDuration = 60 / Number(bpm);
    const phraseDuration = beatDuration * 32;
    return Math.round(timeSec / phraseDuration) * phraseDuration;
  };

  // ── rAF draw loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Per-param tint applied to both stroke and bloom shadow so the glow colour
    // always matches the active automation lane.
    const stroke = PARAM_COLOR[activeParam] ?? '#00f2ff';

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

      // Read latest state without subscribing (zero-lag pattern)
      const state = useDeckStore.getState();
      const deckState = deckId === 'A' ? state.deckA : state.deckB;
      const track = deckState.track;
      const duration = deckState.duration;

      // Sync pointsRef when the automation data changes (track / param switch)
      if (track?.automation) {
        const lane = track.automation.find((a) => a.param === activeParam);
        pointsRef.current = lane ? lane.points : [];
      } else if (!track) {
        pointsRef.current = [];
      }

      const pts = pointsRef.current;

      // Clear the full physical canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (pts.length === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // Scale all draw operations into logical-pixel space so coordinate math
      // above remains device-independent.
      ctx.save();
      ctx.scale(dpr, dpr);

      // ── Liquid Glass bloom: bezier automation path ─────────────────────
      // Prefer the worker-computed dense curve (smooth bezier) when available;
      // fall back to straight line segments between nodes during the first frame
      // before the worker responds.
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = stroke;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();

      const curve = curveRef.current;
      const curveDur = curveDurationRef.current;
      if (curve && curve.length > 1 && curveDur > 0) {
        // Dense Float32Array path — one canvas point per worker sample
        for (let i = 0; i < curve.length; i++) {
          const x = (i / (curve.length - 1)) * width;
          const y = valueToY(curve[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      } else {
        // Fallback: straight lines between nodes (shown before worker responds)
        pts.forEach((p, i) => {
          const x = timeToX(p.time, duration);
          const y = valueToY(p.value);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
      }

      ctx.stroke();
      ctx.restore();

      // ── Control point circles (bloom matches param tint) ───────────────
      pts.forEach((p, i) => {
        const x = timeToX(p.time, duration);
        const y = valueToY(p.value);
        const r = isDraggingRef.current === i ? 6 : 4;

        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = stroke; // consistent with path bloom
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.restore();
      });

      ctx.restore(); // pop DPR scale

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [deckId, activeParam, width, height, timeToX, valueToY]);

  // ── Persist helper ─────────────────────────────────────────────────────────
  const persistPoints = useCallback(
    (newPoints: TrackAutomation['points']) => {
      const state = useDeckStore.getState();
      const deckState = deckId === 'A' ? state.deckA : state.deckB;
      const track = deckState.track;
      if (!track) return;

      const currentAutomation = track.automation ? [...track.automation] : [];
      const idx = currentAutomation.findIndex((a) => a.param === activeParam);
      if (idx !== -1) {
        currentAutomation[idx] = { ...currentAutomation[idx], points: newPoints };
      } else {
        currentAutomation.push({ param: activeParam, points: newPoints });
      }

      updateTrackAutomation(deckId, currentAutomation);

      // Dispatch to bezier worker so the dense curve is recomputed immediately
      dispatchToWorker(newPoints, deckState.duration);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('update-automation', {
            detail: { deckId, automation: currentAutomation },
          }),
        );
      }
    },
    [deckId, activeParam, updateTrackAutomation, dispatchToWorker],
  );

  // ── Pointer interaction ────────────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      const state = useDeckStore.getState();
      const deckState = deckId === 'A' ? state.deckA : state.deckB;
      const track = deckState.track;
      if (!track) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const pts = pointsRef.current;
      const clickedIdx = pts.findIndex((p) => {
        const px = timeToX(p.time, deckState.duration);
        const py = valueToY(p.value);
        return Math.hypot(px - x, py - y) < 10;
      });

      // Right-click or double-click removes the node under the cursor
      if (e.button === 2 || e.detail === 2) {
        if (clickedIdx !== -1) {
          const newPts = pts.filter((_, i) => i !== clickedIdx);
          pointsRef.current = newPts;
          persistPoints(newPts);
        }
        return;
      }

      // Shift bypasses snap; plain click snaps to 32-beat phrase boundary
      const time = getSnappedTime(xToTime(x, deckState.duration), track.bpm, e.shiftKey);
      const value = yToValue(y);

      if (clickedIdx !== -1) {
        isDraggingRef.current = clickedIdx;
      } else {
        const newPts = [...pts, { time, value, curve: 'linear' as const }].sort(
          (a, b) => a.time - b.time,
        );
        pointsRef.current = newPts;
        isDraggingRef.current = newPts.findIndex((p) => p.time === time);
        persistPoints(newPts);
      }
    },
    [deckId, xToTime, yToValue, timeToX, valueToY, persistPoints],
  );

  const handlePointerMove = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (isDraggingRef.current === null) return;
      const state = useDeckStore.getState();
      const deckState = deckId === 'A' ? state.deckA : state.deckB;
      const track = deckState.track;
      if (!track) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Shift bypasses snap during drag as well
      const time = getSnappedTime(xToTime(x, deckState.duration), track.bpm, e.shiftKey);
      const value = yToValue(y);

      const pts = [...pointsRef.current];
      pts[isDraggingRef.current] = { ...pts[isDraggingRef.current], time, value };
      pts.sort((a, b) => a.time - b.time);
      // Track new index after sort
      const newIdx = pts.findIndex((p) => p.time === time && p.value === value);
      if (newIdx !== -1) isDraggingRef.current = newIdx;
      pointsRef.current = pts;
    },
    [deckId, xToTime, yToValue],
  );

  const handlePointerUp = useCallback(() => {
    if (isDraggingRef.current !== null) {
      isDraggingRef.current = null;
      persistPoints(pointsRef.current);
    }
  }, [persistPoints]);

  return (
    // `isolation: isolate` creates a new stacking context so the Phase 8.3 AI
    // Lyric Display (and any future overlay) can be layered on top via z-index
    // without affecting the waveform canvas beneath it.
    <div
      className="absolute inset-0 z-40 touch-none backdrop-blur-[2px] border border-white/10"
      style={{ isolation: 'isolate' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      // Prevent the browser context menu so right-click can remove nodes
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Canvas is its own GPU-composited layer (will-change: transform).
          Overlays such as the AI Lyric Display should be placed after this
          element in the DOM with a higher z-index. */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="pointer-events-none"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
}