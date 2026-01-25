"use client";

import type { DragEvent, PointerEvent, WheelEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useStudioClock } from "../hooks/useStudioClock";
import { useStudioStore, StudioTimelineClip, StudioTimelineTrack } from "../stores/useStudioStore";
import { StudioEngine } from "../lib/StudioEngine";
import type { AnalysisResponse } from "../workers/analysis.worker";
import { StudioBufferCache } from "../lib/StudioBufferCache";

type ViewState = {
  pxPerSecond: number;
  centerTimeSeconds: number;
  followPlayhead: boolean;
};

type PointerState = {
  x: number;
  y: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function energyColor(energy01: number, alpha: number) {
  const e = clamp(energy01, 0, 1);
  const r = Math.round(lerp(40, 255, e));
  const g = Math.round(lerp(170, 60, e));
  const b = Math.round(lerp(255, 50, e));
  return `rgba(${r},${g},${b},${alpha})`;
}

function peakCacheFromBuffer(
  buffer: AudioBuffer,
  targetPoints: number = 2048
): Float32Array {
  const channels = Math.min(2, buffer.numberOfChannels);
  const len = buffer.length;
  const points = Math.max(256, Math.min(targetPoints, len));
  const hop = Math.max(1, Math.floor(len / points));

  const peaks = new Float32Array(points);

  for (let i = 0; i < points; i++) {
    const start = i * hop;
    const end = Math.min(len, start + hop);
    let max = 0;
    for (let ch = 0; ch < channels; ch++) {
      const data = buffer.getChannelData(ch);
      for (let s = start; s < end; s++) {
        const v = Math.abs(data[s] ?? 0);
        if (v > max) max = v;
      }
    }
    peaks[i] = max;
  }

  // Normalize 0..1
  let globalMax = 0;
  for (let i = 0; i < peaks.length; i++) globalMax = Math.max(globalMax, peaks[i] || 0);
  if (globalMax > 0) {
    for (let i = 0; i < peaks.length; i++) peaks[i] = peaks[i] / globalMax;
  }
  return peaks;
}

export function TimelineCanvas({ tracks }: { tracks: StudioTimelineTrack[] }) {
  const bpm = useStudioStore((s) => s.bpm);
  const snapEnabled = useStudioStore((s) => s.snapEnabled);
  const selectedClipId = useStudioStore((s) => s.selectedClipId);
  const timelineMode = useStudioStore((s) => s.timelineMode);
  const selectedLane = useStudioStore((s) => s.selectedAutomationLane);
  const ensureTimelineTrack = useStudioStore((s) => s.ensureTimelineTrack);
  const addTimelineClip = useStudioStore((s) => s.addTimelineClip);
  const updateTimelineClip = useStudioStore((s) => s.updateTimelineClip);
  const setSelectedClip = useStudioStore((s) => s.setSelectedClip);
  const removeTimelineClip = useStudioStore((s) => s.removeTimelineClip);
  const splitTimelineClip = useStudioStore((s) => s.splitTimelineClip);
  const upsertAutomationPoint = useStudioStore((s) => s.upsertAutomationPoint);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafDrawRef = useRef<number | null>(null);
  const analysisWorkerRef = useRef<Worker | null>(null);

  const viewRef = useRef<ViewState>({
    pxPerSecond: 140,
    centerTimeSeconds: 0,
    followPlayhead: true,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    isDragging: boolean;
    startX: number;
    startCenterTime: number;
  } | null>(null);

  const pointersRef = useRef<Map<number, PointerState>>(new Map());
  const pinchRef = useRef<{
    startDistance: number;
    startPxPerSecond: number;
    anchorTimeSeconds: number;
    midX: number;
  } | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Responsive track height - larger on mobile for better touch targets
  const trackHeight = isMobile ? 96 : 72;
  const headerHeight = 26;
  const clipTopPad = 22;
  const clipBottomPad = 8;
  // Larger handle width on mobile for easier trimming
  const handleWidth = typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 10;
  const minClipSeconds = 0.05;

  const clipEditRef = useRef<{
    mode: "none" | "move" | "trim-left" | "trim-right";
    clipId: string | null;
    trackId: string | null;
    anchorX: number;
    anchorStartSeconds: number;
    anchorDurationSeconds: number;
    anchorSourceOffsetSeconds: number;
    pointerId: number | null;
  }>({
    mode: "none",
    clipId: null,
    trackId: null,
    anchorX: 0,
    anchorStartSeconds: 0,
    anchorDurationSeconds: 0,
    anchorSourceOffsetSeconds: 0,
    pointerId: null,
  });

  const automationDrawRef = useRef<{
    isDrawing: boolean;
    pointerId: number | null;
    trackId: string | null;
  }>({ isDrawing: false, pointerId: null, trackId: null });

  // Throttle drawing to improve performance
  let lastDrawTime = 0;
  const drawThrottle = 16; // ~60fps max

  const requestDraw = () => {
    if (rafDrawRef.current !== null) return;
    const now = performance.now();
    const timeSinceLastDraw = now - lastDrawTime;
    
    if (timeSinceLastDraw < drawThrottle) {
      // Schedule draw for next frame
      rafDrawRef.current = requestAnimationFrame(() => {
        rafDrawRef.current = null;
        lastDrawTime = performance.now();
        draw();
      });
    } else {
      // Draw immediately if enough time has passed
      rafDrawRef.current = requestAnimationFrame(() => {
        rafDrawRef.current = null;
        lastDrawTime = performance.now();
        draw();
      });
    }
  };

  const getCanvasMetrics = () => {
    const canvas = canvasRef.current;
    const wrapper = containerRef.current;
    if (!canvas || !wrapper) return null;

    const rect = wrapper.getBoundingClientRect();
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    // Ensure canvas backing store matches CSS pixels * DPR.
    const targetW = Math.floor(width * dpr);
    const targetH = Math.floor(height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    return { width, height, dpr, rect };
  };

  const timeAtX = (x: number, width: number) => {
    const { pxPerSecond, centerTimeSeconds } = viewRef.current;
    const centerX = width / 2;
    return centerTimeSeconds + (x - centerX) / pxPerSecond;
  };

  const snapTime = (t: number, enabled: boolean) => {
    if (!enabled) return t;
    const barSeconds = (4 * 60) / Math.max(1, bpm);
    return Math.round(t / barSeconds) * barSeconds;
  };

  const valueAtY = (y: number, laneTop: number, laneH: number) => {
    const t = clamp((y - laneTop) / Math.max(1, laneH), 0, 1);
    return clamp(1 - t, 0, 1);
  };

  const clampZoom = (z: number) => clamp(z, 30, 900);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const metrics = getCanvasMetrics();
    if (!metrics) return;
    const { width, height, dpr } = metrics;

    // Scale drawing to CSS pixels.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { pxPerSecond, centerTimeSeconds } = viewRef.current;
    const centerX = width / 2;

    // Background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, width, height);

    // Header strip
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, width, headerHeight);

    // Time grid (beats)
    const beatDur = 60 / Math.max(1, bpm);
    const startTime = centerTimeSeconds - centerX / pxPerSecond;
    const endTime = centerTimeSeconds + centerX / pxPerSecond;
    const firstBeat = Math.floor(startTime / beatDur) * beatDur;

    for (let t = firstBeat; t <= endTime; t += beatDur) {
      const x = Math.round((t - centerTimeSeconds) * pxPerSecond + centerX) + 0.5;
      const isBar = Math.round(t / beatDur) % 4 === 0;
      ctx.strokeStyle = isBar ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)";
      ctx.lineWidth = isBar ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Track lanes + clips
    tracks.forEach((track, idx) => {
      const y = headerHeight + idx * trackHeight;
      if (y > height) return;

      // Lane bg
      ctx.fillStyle = idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.03)";
      ctx.fillRect(0, y, width, trackHeight);

      // Lane label
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "700 11px var(--font-barlow), system-ui, sans-serif";
      ctx.fillText(track.name, 10, y + 16);

      // Lane divider
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + trackHeight + 0.5);
      ctx.lineTo(width, y + trackHeight + 0.5);
      ctx.stroke();

      for (const clip of track.clips) {
        const x0 = (clip.startSeconds - centerTimeSeconds) * pxPerSecond + centerX;
        const w = clip.durationSeconds * pxPerSecond;
        // Canvas culling: skip clips that are far off-screen
        if (x0 + w < -200 || x0 > width + 200) continue;

        const clipY = y + clipTopPad;
        const clipH = trackHeight - (clipTopPad + clipBottomPad);

        // Energy tint background (per second)
        if (clip.energyMap && clip.energyMap.length > 0) {
          const offsetSeconds = Math.floor(clip.sourceOffsetSeconds ?? 0);
          const segments = Math.max(1, Math.ceil(clip.durationSeconds));
          for (let s = 0; s < segments; s++) {
            const segX = x0 + s * pxPerSecond;
            if (segX > x0 + w) break;
            if (segX + pxPerSecond < x0) continue;
            const segW = Math.min(pxPerSecond, x0 + w - segX);
            const e = clip.energyMap[offsetSeconds + s] ?? 0;
            ctx.fillStyle = energyColor(e, 0.14);
            ctx.fillRect(segX, clipY, segW, clipH);
          }
        }

        // Clip body
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(x0, clipY, w, clipH);

        const isSelected = selectedClipId === clip.id;

        // Clip border/glow (selected clip thicker + brighter)
        ctx.strokeStyle = isSelected ? "rgba(255,215,0,0.95)" : track.color;
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.strokeRect(x0 + 0.5, clipY + 0.5, w - 1, clipH - 1);

        // Trim handles for selected clip (visual only)
        if (isSelected) {
          ctx.fillStyle = "rgba(255,215,0,0.25)";
          ctx.fillRect(x0, clipY, Math.min(handleWidth, w), clipH);
          ctx.fillRect(x0 + Math.max(0, w - handleWidth), clipY, Math.min(handleWidth, w), clipH);
        }

        // Clip label
        ctx.fillStyle = "rgba(255,255,255,0.78)";
        ctx.font = "900 11px var(--font-barlow), system-ui, sans-serif";
        ctx.save();
        ctx.beginPath();
        ctx.rect(x0 + 6, clipY + 4, Math.max(0, w - 12), 16);
        ctx.clip();
        ctx.fillText(clip.name, x0 + 8, clipY + 16);
        ctx.restore();

        // Camelot badge
        if (clip.camelot) {
          const badge = clip.camelot;
          const bx = x0 + Math.max(6, w - 52);
          const by = clipY + 6;
          ctx.fillStyle = "rgba(0,0,0,0.7)";
          ctx.fillRect(bx, by, 46, 18);
          ctx.strokeStyle = "rgba(255,255,255,0.22)";
          ctx.lineWidth = 1;
          ctx.strokeRect(bx + 0.5, by + 0.5, 45, 17);
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.font = "900 11px var(--font-barlow), system-ui, sans-serif";
          ctx.fillText(badge, bx + 10, by + 13);
        }

        // BPM readout
        if (clip.detectedBpm) {
          ctx.fillStyle = "rgba(255,255,255,0.55)";
          ctx.font = "700 10px var(--font-barlow), system-ui, sans-serif";
          ctx.fillText(`${Math.round(clip.detectedBpm)} BPM`, x0 + 8, clipY + clipH - 8);
        }

        // Waveform peaks
        if (clip.peaks && w >= 24) {
          const peaks = clip.peaks;
          const mid = clipY + clipH / 2;
          const ampH = clipH / 2 - 10;

          ctx.strokeStyle = "rgba(224,224,224,0.22)";
          ctx.lineWidth = 1;
          ctx.beginPath();

          const points = peaks.length;
          const sourceDur = Math.max(0.001, clip.sourceDurationSeconds ?? clip.durationSeconds);
          const startRatio = clamp((clip.sourceOffsetSeconds ?? 0) / sourceDur, 0, 1);
          const endRatio = clamp(((clip.sourceOffsetSeconds ?? 0) + clip.durationSeconds) / sourceDur, 0, 1);
          const i0 = Math.max(0, Math.floor(startRatio * points));
          const i1 = Math.max(i0 + 1, Math.floor(endRatio * points));
          const span = Math.max(1, i1 - i0);
          const stepPx = w / span;

          for (let i = i0; i < i1; i++) {
            const amp = peaks[i] || 0;
            const x = x0 + (i - i0) * stepPx;
            if (x < x0 || x > x0 + w) continue;
            const y1 = mid - amp * ampH;
            const y2 = mid + amp * ampH;
            ctx.moveTo(x, y1);
            ctx.lineTo(x, y2);
          }
          ctx.stroke();
        }
      }

      // Automation overlay (volume/filter)
      if (timelineMode === "automation") {
        const laneTop = y + clipTopPad;
        const laneH = trackHeight - (clipTopPad + clipBottomPad);
        const points = track.automation?.[selectedLane]?.points ?? [];

        // Grid
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        for (let g = 0; g <= 4; g++) {
          const yy = laneTop + (laneH * g) / 4 + 0.5;
          ctx.beginPath();
          ctx.moveTo(0, yy);
          ctx.lineTo(width, yy);
          ctx.stroke();
        }

        // Curve
        ctx.strokeStyle =
          selectedLane === "volume" ? "rgba(0,255,170,0.85)" : "rgba(255,0,255,0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (points.length > 0) {
          for (let i = 0; i < points.length; i++) {
            const p = points[i]!;
            const px = (p.timeSeconds - centerTimeSeconds) * pxPerSecond + centerX;
            const py = laneTop + (1 - p.value01) * laneH;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }

        // Points
        for (const p of points) {
          const px = (p.timeSeconds - centerTimeSeconds) * pxPerSecond + centerX;
          if (px < -20 || px > width + 20) continue;
          const py = laneTop + (1 - p.value01) * laneH;
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.3)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });

    // Center playhead (DAW behavior)
    ctx.strokeStyle = "rgba(255,215,0,0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX + 0.5, 0);
    ctx.lineTo(centerX + 0.5, height);
    ctx.stroke();

    // Top readout
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "700 11px var(--font-barlow), system-ui, sans-serif";
    ctx.fillText(
      `Zoom: ${Math.round(pxPerSecond)}px/s  •  Center: ${centerTimeSeconds.toFixed(2)}s  •  BPM: ${bpm}`,
      10,
      18
    );

  };

  // Drive draws from the Studio clock (no React state).
  useStudioClock((timeSeconds) => {
    // Follow playhead unless user is currently dragging/pinching.
    if (!dragRef.current?.isDragging && !pinchRef.current && viewRef.current.followPlayhead) {
      viewRef.current.centerTimeSeconds = lerp(viewRef.current.centerTimeSeconds, timeSeconds, 0.25);
    }
    requestDraw();
  });

  // Initial sizing draw + resize observer
  useEffect(() => {
    requestDraw();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => requestDraw());
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Analysis worker (BPM, energy, key/camelot)
  useEffect(() => {
    const worker = new Worker(new URL("../workers/analysis.worker.ts", import.meta.url), {
      type: "module",
    });
    analysisWorkerRef.current = worker;

    worker.onmessage = (evt: MessageEvent<AnalysisResponse>) => {
      const msg = evt.data;
      if (!msg || msg.type !== "result") return;
      updateTimelineClip(msg.clipId, {
        detectedBpm: msg.detectedBpm ?? undefined,
        energyMap: msg.energyMap,
        key: msg.key ?? undefined,
        camelot: msg.camelot ?? undefined,
      });
      requestDraw();
    };

    return () => {
      worker.terminate();
      analysisWorkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts (scoped to Studio timeline)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Avoid hijacking when typing in an input
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedClipId) {
          removeTimelineClip(selectedClipId);
          requestDraw();
        }
      }

      if (e.key.toLowerCase() === "s") {
        if (selectedClipId) {
          const splitAt = viewRef.current.centerTimeSeconds; // playhead is centered
          const res = splitTimelineClip(selectedClipId, splitAt);
          if (res) {
            // Ensure the new clip points at the same underlying buffer
            const buf = StudioBufferCache.getInstance().getClipBuffer(res.leftId);
            if (buf) StudioBufferCache.getInstance().setClipBuffer(res.rightId, buf);
            requestDraw();
          }
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClipId]);

  // Re-draw when track data changes (drop/import)
  useEffect(() => {
    requestDraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks]);

  const hitTestClip = (x: number, y: number, width: number) => {
    const { pxPerSecond, centerTimeSeconds } = viewRef.current;
    const centerX = width / 2;

    const laneIndex = Math.floor((y - headerHeight) / trackHeight);
    if (laneIndex < 0 || laneIndex >= tracks.length) return null;
    const track = tracks[laneIndex]!;

    const clipY = headerHeight + laneIndex * trackHeight + clipTopPad;
    const clipH = trackHeight - (clipTopPad + clipBottomPad);
    if (y < clipY || y > clipY + clipH) return null;

    for (const clip of track.clips) {
      const x0 = (clip.startSeconds - centerTimeSeconds) * pxPerSecond + centerX;
      const w = clip.durationSeconds * pxPerSecond;
      if (x >= x0 && x <= x0 + w) {
        const leftHandle = x <= x0 + handleWidth;
        const rightHandle = x >= x0 + Math.max(0, w - handleWidth);
        return {
          trackId: track.id,
          clip,
          zone: leftHandle ? "trim-left" : rightHandle ? "trim-right" : "move",
        } as const;
      }
    }

    return null;
  };

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    const metrics = getCanvasMetrics();
    if (!metrics) return;
    const { rect, width } = metrics;

    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pointersRef.current.set(e.pointerId, { x, y });

    // Start drag only if single pointer
    if (pointersRef.current.size === 1) {
      // Automation drawing (primary interaction in automation mode)
      if (timelineMode === "automation" && !e.altKey) {
        const laneIndex = Math.floor((y - headerHeight) / trackHeight);
        if (laneIndex >= 0 && laneIndex < tracks.length) {
          const track = tracks[laneIndex]!;
          const laneTop = headerHeight + laneIndex * trackHeight + clipTopPad;
          const laneH = trackHeight - (clipTopPad + clipBottomPad);
          const time = Math.max(0, timeAtX(x, width));
          const snapActive = snapEnabled && !e.shiftKey;
          const t = snapTime(time, snapActive);
          const v = valueAtY(y, laneTop, laneH);
          upsertAutomationPoint(track.id, selectedLane, { timeSeconds: t, value01: v });

          automationDrawRef.current = { isDrawing: true, pointerId: e.pointerId, trackId: track.id };
          viewRef.current.followPlayhead = false;
          dragRef.current = null;
          requestDraw();
          return;
        }
      }

      const hit = timelineMode === "clips" ? hitTestClip(x, y, width) : null;
      if (hit) {
        viewRef.current.followPlayhead = false;
        setSelectedClip(hit.clip.id, hit.trackId);
        clipEditRef.current = {
          mode: hit.zone,
          clipId: hit.clip.id,
          trackId: hit.trackId,
          anchorX: x,
          anchorStartSeconds: hit.clip.startSeconds,
          anchorDurationSeconds: hit.clip.durationSeconds,
          anchorSourceOffsetSeconds: hit.clip.sourceOffsetSeconds ?? 0,
          pointerId: e.pointerId,
        };
        dragRef.current = null;
      } else {
        if (timelineMode === "clips") setSelectedClip(null, null);
        // pan timeline
        viewRef.current.followPlayhead = false;
        dragRef.current = {
          isDragging: true,
          startX: x,
          startCenterTime: viewRef.current.centerTimeSeconds,
        };
      }
    }

    // Start pinch if 2 pointers
    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[0]!.x - pts[1]!.x;
      const dy = pts[0]!.y - pts[1]!.y;
      const dist = Math.hypot(dx, dy);
      const midX = (pts[0]!.x + pts[1]!.x) / 2;
      const anchorTime = timeAtX(midX, width);

      pinchRef.current = {
        startDistance: dist,
        startPxPerSecond: viewRef.current.pxPerSecond,
        anchorTimeSeconds: anchorTime,
        midX,
      };
      dragRef.current = null;
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const metrics = getCanvasMetrics();
    if (!metrics) return;
    const { rect, width } = metrics;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pointersRef.current.set(e.pointerId, { x, y });

    // Automation drawing
    const ad = automationDrawRef.current;
    if (timelineMode === "automation" && ad.isDrawing && ad.pointerId === e.pointerId && ad.trackId) {
      const laneIndex = tracks.findIndex((t) => t.id === ad.trackId);
      if (laneIndex >= 0) {
        const laneTop = headerHeight + laneIndex * trackHeight + clipTopPad;
        const laneH = trackHeight - (clipTopPad + clipBottomPad);
        const time = Math.max(0, timeAtX(x, width));
        const snapActive = snapEnabled && !e.shiftKey;
        const t = snapTime(time, snapActive);
        const v = valueAtY(y, laneTop, laneH);
        upsertAutomationPoint(ad.trackId, selectedLane, { timeSeconds: t, value01: v });
        requestDraw();
      }
      return;
    }

    // Clip editing (single pointer only)
    const edit = clipEditRef.current;
    if (timelineMode === "clips" && edit.mode !== "none" && edit.pointerId === e.pointerId && pointersRef.current.size === 1) {
      const dx = x - edit.anchorX;
      const dt = dx / viewRef.current.pxPerSecond;

      const snapActive = snapEnabled && !e.shiftKey;

      if (edit.mode === "move" && edit.clipId) {
        let nextStart = edit.anchorStartSeconds + dt;
        nextStart = Math.max(0, snapTime(nextStart, snapActive));
        updateTimelineClip(edit.clipId, { startSeconds: nextStart });
        requestDraw();
        return;
      }

      if (edit.clipId && (edit.mode === "trim-left" || edit.mode === "trim-right")) {
        // Resolve current clip from store to read sourceDurationSeconds
        const state = useStudioStore.getState();
        let clip: StudioTimelineClip | null = null;
        for (const t of state.timelineTracks) {
          const c = t.clips.find((cc) => cc.id === edit.clipId);
          if (c) {
            clip = c;
            break;
          }
        }
        if (!clip) return;

        const sourceDur = (clip.sourceDurationSeconds ?? clip.durationSeconds) as number;
        const baseStart = edit.anchorStartSeconds;
        const baseDur = edit.anchorDurationSeconds;
        const baseOffset = edit.anchorSourceOffsetSeconds;

        if (edit.mode === "trim-left") {
          let newStart = baseStart + dt;
          newStart = Math.max(0, snapTime(newStart, snapActive));
          const delta = newStart - baseStart;
          const newOffset = Math.max(0, Math.min(sourceDur - minClipSeconds, baseOffset + delta));
          const maxDur = Math.max(minClipSeconds, sourceDur - newOffset);
          const newDur = clamp(baseDur - delta, minClipSeconds, maxDur);

          updateTimelineClip(edit.clipId, {
            startSeconds: baseStart + (newOffset - baseOffset),
            sourceOffsetSeconds: newOffset,
            durationSeconds: newDur,
          });
          requestDraw();
          return;
        }

        if (edit.mode === "trim-right") {
          let newEnd = baseStart + baseDur + dt;
          newEnd = Math.max(baseStart + minClipSeconds, snapTime(newEnd, snapActive));
          const newDur = clamp(newEnd - baseStart, minClipSeconds, Math.max(minClipSeconds, sourceDur - baseOffset));
          updateTimelineClip(edit.clipId, { durationSeconds: newDur });
          requestDraw();
          return;
        }
      }
    }

    if (pinchRef.current && pointersRef.current.size >= 2) {
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[0]!.x - pts[1]!.x;
      const dy = pts[0]!.y - pts[1]!.y;
      const dist = Math.hypot(dx, dy);

      const pinch = pinchRef.current;
      const ratio = dist / Math.max(1, pinch.startDistance);
      const nextZoom = clampZoom(pinch.startPxPerSecond * ratio);

      // Keep anchorTime under current midpoint.
      const midX = (pts[0]!.x + pts[1]!.x) / 2;
      const centerX = width / 2;
      const nextCenterTime = pinch.anchorTimeSeconds - (midX - centerX) / nextZoom;

      viewRef.current.pxPerSecond = nextZoom;
      viewRef.current.centerTimeSeconds = nextCenterTime;

      requestDraw();
      return;
    }

    if (dragRef.current?.isDragging) {
      const d = dragRef.current;
      const dx = x - d.startX;
      viewRef.current.centerTimeSeconds = d.startCenterTime - dx / viewRef.current.pxPerSecond;
      requestDraw();
    }
  };

  const onPointerUpOrCancel = (e: PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(e.pointerId);
    try {
      (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // End clip editing
    if (clipEditRef.current.pointerId === e.pointerId) {
      clipEditRef.current = {
        mode: "none",
        clipId: null,
        trackId: null,
        anchorX: 0,
        anchorStartSeconds: 0,
        anchorDurationSeconds: 0,
        anchorSourceOffsetSeconds: 0,
        pointerId: null,
      };
    }

    // End automation drawing
    if (automationDrawRef.current.pointerId === e.pointerId) {
      automationDrawRef.current = { isDrawing: false, pointerId: null, trackId: null };
    }

    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }
    if (pointersRef.current.size === 0) {
      dragRef.current = null;
      // If playing, resume follow playhead automatically.
      viewRef.current.followPlayhead = true;
    }
  };

  const onWheel = (e: WheelEvent<HTMLCanvasElement>) => {
    const metrics = getCanvasMetrics();
    if (!metrics) return;
    const { rect, width } = metrics;

    const x = e.clientX - rect.left;
    const centerX = width / 2;

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      // Zoom around cursor anchor.
      const anchorTime = timeAtX(x, width);
      const zoom = viewRef.current.pxPerSecond;
      const zoomFactor = Math.exp(-e.deltaY * 0.0025); // smooth
      const nextZoom = clampZoom(zoom * zoomFactor);
      viewRef.current.pxPerSecond = nextZoom;
      viewRef.current.centerTimeSeconds = anchorTime - (x - centerX) / nextZoom;
      viewRef.current.followPlayhead = false;
      requestDraw();
      return;
    }

    // Horizontal pan (wheel or shift+wheel)
    const delta = e.shiftKey ? e.deltaY : e.deltaX !== 0 ? e.deltaX : e.deltaY;
    if (delta !== 0) {
      e.preventDefault();
      viewRef.current.followPlayhead = false;
      viewRef.current.centerTimeSeconds += delta / viewRef.current.pxPerSecond;
      requestDraw();
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const metrics = getCanvasMetrics();
    if (!metrics) return;
    const { rect, width } = metrics;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dropTime = Math.max(0, timeAtX(x, width));
    const laneIndex = Math.max(0, Math.floor((y - headerHeight) / trackHeight));
    const trackId = ensureTimelineTrack(laneIndex);

    const clipId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `clip-${crypto.randomUUID()}`
        : `clip-${Math.random().toString(16).slice(2)}`;

    // Add a placeholder clip immediately (fast UI feedback).
    addTimelineClip(trackId, {
      id: clipId,
      name: file.name.replace(/\.[^/.]+$/, ""),
      startSeconds: dropTime,
      durationSeconds: 1,
      sourceOffsetSeconds: 0,
      sourceDurationSeconds: 1,
    });

    try {
      const engine = StudioEngine.getInstance();
      const ctx = await engine.initFromUserGesture();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

      const peaks = peakCacheFromBuffer(audioBuffer, 2048);
      updateTimelineClip(clipId, {
        durationSeconds: audioBuffer.duration,
        sourceOffsetSeconds: 0,
        sourceDurationSeconds: audioBuffer.duration,
        peaks,
      });
      StudioBufferCache.getInstance().setClipBuffer(clipId, audioBuffer);

      // Kick analysis in background worker (copy mono samples; avoid transferring AudioBuffer).
      const mono = audioBuffer.getChannelData(0).slice(0);
      analysisWorkerRef.current?.postMessage(
        { type: "analyze", clipId, sampleRate: audioBuffer.sampleRate, mono },
        [mono.buffer]
      );
    } catch (err) {
      // Mark clip as failed (keep it visible but obvious).
      updateTimelineClip(clipId, { name: `${file.name} (decode failed)` });
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("[TimelineCanvas] decode failed:", err);
      }
    } finally {
      requestDraw();
    }
  };

  return (
    <div
      ref={containerRef}
      className={[
        "relative h-full w-full overflow-hidden",
        "border border-white/10 bg-black/30",
        isDragOver ? "ring-2 ring-[#FFD700]" : "",
      ].join(" ")}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => void onDrop(e)}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUpOrCancel}
        onPointerCancel={onPointerUpOrCancel}
        onWheel={onWheel}
        role="img"
        aria-label="Studio timeline"
      />

      {/* Drop overlay */}
      {isDragOver && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="px-4 py-3 border border-white/20 bg-black/60 backdrop-blur-xl text-white font-black uppercase tracking-wider">
            Drop audio file to import
          </div>
        </div>
      )}
    </div>
  );
}

