"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGestures } from "@/hooks/useGestures";

interface WaveformMiniProps {
  url: string;
  color: string;
  beatGrid?: number[];
  playhead?: number;
  durationSeconds?: number;
  onSeek?: (seconds: number) => void;
}

type WaveformWorkerMessage =
  | {
      type: "init";
      canvas: OffscreenCanvas;
      color: string;
      dpr: number;
    }
  | {
      type: "render";
      peaks: Float32Array;
      duration: number;
      beatGrid?: number[];
      color: string;
      coverage?: number;
      isComplete?: boolean;
    }
  | {
      type: "resize";
      width: number;
      height: number;
      dpr: number;
    }
  | {
      type: "playhead";
      progress: number;
    };

const SAMPLE_POINTS = 768;
const CANVAS_HEIGHT = 76;
const LARGE_FILE_THRESHOLD_BYTES = 8 * 1024 * 1024; // 8MB
const CHUNK_SIZE_BYTES = 512 * 1024; // 512KB
const MIN_RENDER_INTERVAL_BYTES = CHUNK_SIZE_BYTES * 2;

function buildPeaks(audioBuffer: AudioBuffer, buckets: number) {
  const left = audioBuffer.getChannelData(0);
  const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : null;
  const samplesPerBucket = Math.max(1, Math.floor(left.length / buckets));
  const peaks = new Float32Array(buckets);

  for (let bucketIndex = 0; bucketIndex < buckets; bucketIndex++) {
    const start = bucketIndex * samplesPerBucket;
    const end = Math.min(left.length, start + samplesPerBucket);
    let sum = 0;
    const count = end - start || 1;

    for (let i = start; i < end; i++) {
      const value = right ? (left[i] + right[i]) * 0.5 : left[i];
      sum += value * value; // RMS for smoother energy curve
    }

    peaks[bucketIndex] = Math.min(1, Math.sqrt(sum / count));
  }

  return peaks;
}

export function WaveformMini({
  url,
  color,
  beatGrid = [],
  playhead = 0,
  durationSeconds,
  onSeek,
}: Readonly<WaveformMiniProps>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const transferredRef = useRef(false);
  const teardownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supportsOffscreenRef = useRef<boolean | null>(null);
  const initialColorRef = useRef(color);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isScrubbing, setIsScrubbing] = useState(false);

  const resolvedDuration = useMemo(
    () => (durationSeconds && durationSeconds > 0 ? durationSeconds : duration),
    [durationSeconds, duration]
  );

  useEffect(() => {
    if (globalThis.window === undefined) return;
    const canvasEl = canvasRef.current;
    const containerEl = containerRef.current;
    if (!canvasEl || !containerEl) return;
    if (teardownTimerRef.current !== null) {
      globalThis.clearTimeout(teardownTimerRef.current);
      teardownTimerRef.current = null;
    }
    if (!("transferControlToOffscreen" in canvasEl)) {
      supportsOffscreenRef.current = false;
      console.warn("[WaveformMini] OffscreenCanvas not supported in this browser.");
      setIsLoading(false);
      return;
    }

    supportsOffscreenRef.current = true;

    if (!transferredRef.current) {
      const offscreen = canvasEl.transferControlToOffscreen();
      const worker = new Worker(new URL("../../../workers/waveform.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;
      transferredRef.current = true;

      const dpr = window.devicePixelRatio || 1;
      worker.postMessage(
        { type: "init", canvas: offscreen, color: initialColorRef.current, dpr } satisfies WaveformWorkerMessage,
        [offscreen]
      );
    }

    const resize = () => {
      const worker = workerRef.current;
      if (!worker) return;
      const rect = containerEl.getBoundingClientRect();
      worker.postMessage({
        type: "resize",
        width: Math.max(1, Math.floor(rect.width)),
        height: CANVAS_HEIGHT,
        dpr: window.devicePixelRatio || 1,
      } satisfies WaveformWorkerMessage);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(containerEl);

    return () => {
      resizeObserver.disconnect();
      if (workerRef.current) {
        teardownTimerRef.current = globalThis.setTimeout(() => {
          workerRef.current?.terminate();
          workerRef.current = null;
          transferredRef.current = false;
          teardownTimerRef.current = null;
        }, 100);
      }
    };
  }, []);

  useEffect(() => {
    if (globalThis.window === undefined) return;
    if (supportsOffscreenRef.current === false) return;
    const worker = workerRef.current;
    if (!worker) return;

    let cancelled = false;
    setIsLoading(true);
    setDuration(0);

    const decodeAndRender = async () => {
      const fetchHead = async () => {
        try {
          const head = await fetch(url, { method: "HEAD" });
          const length = Number(head.headers.get("content-length") || 0);
          const acceptsRanges = (head.headers.get("accept-ranges") || "").toLowerCase().includes("bytes");
          return { length, acceptsRanges };
        } catch (error) {
          console.warn("[WaveformMini] HEAD request failed, falling back to full fetch:", error);
          return { length: 0, acceptsRanges: false };
        }
      };

      let audioContext: AudioContext | null = null;
      try {
        const AudioContextCtor =
          globalThis.AudioContext ||
          (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        if (!AudioContextCtor) {
          throw new Error("AudioContext not supported");
        }

        audioContext = new AudioContextCtor();
        const { length, acceptsRanges } = await fetchHead();
        const shouldChunk = acceptsRanges && length > LARGE_FILE_THRESHOLD_BYTES;

        const renderFromBuffer = async (buffer: ArrayBuffer, isComplete: boolean, bytesFetched: number) => {
          if (!audioContext) return;
          const audioBuffer = await audioContext.decodeAudioData(buffer.slice(0));
          if (cancelled) {
            return;
          }
          if (isComplete) {
            setDuration(audioBuffer.duration);
          }
          const peaks = buildPeaks(audioBuffer, SAMPLE_POINTS);

          worker.postMessage(
            {
              type: "render",
              peaks,
              duration: audioBuffer.duration,
              beatGrid,
              color,
              coverage: length > 0 ? Math.min(1, bytesFetched / length) : 1,
              isComplete,
            } satisfies WaveformWorkerMessage,
            [peaks.buffer]
          );

          if (!cancelled && isComplete) {
            setIsLoading(false);
          }
        };

        if (shouldChunk) {
          let aggregated = new Uint8Array(0);
          let fetched = 0;
          let lastRenderAt = 0;

          while (!cancelled && fetched < length) {
            const start = fetched;
            const end = Math.min(length - 1, start + CHUNK_SIZE_BYTES - 1);
            const rangeResponse = await fetch(url, {
              headers: { Range: `bytes=${start}-${end}` },
            });

            if (!rangeResponse.ok) {
              throw new Error(`Range request failed with status ${rangeResponse.status}`);
            }

            const chunk = new Uint8Array(await rangeResponse.arrayBuffer());
            const next = new Uint8Array(aggregated.length + chunk.length);
            next.set(aggregated);
            next.set(chunk, aggregated.length);
            aggregated = next;
            fetched += chunk.length;

            const shouldRender = fetched === chunk.length || fetched - lastRenderAt >= MIN_RENDER_INTERVAL_BYTES || fetched >= length;
            if (!shouldRender) continue;

            lastRenderAt = fetched;
            try {
              await renderFromBuffer(
                aggregated.buffer.slice(aggregated.byteOffset, aggregated.byteOffset + aggregated.byteLength),
                fetched >= length,
                fetched
              );
            } catch (decodeError) {
              // For partial buffers, decoding might fail; keep fetching until final buffer
              if (fetched >= length) {
                throw decodeError;
              } else {
                console.warn("[WaveformMini] Partial decode failed, continuing:", decodeError);
              }
            }
          }

          if (!cancelled && fetched >= length) {
            setIsLoading(false);
          }
        } else {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          await renderFromBuffer(arrayBuffer.slice(0), true, arrayBuffer.byteLength);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("[WaveformMini] Failed to render waveform:", error);
        if (!cancelled) {
          setIsLoading(false);
        }
      } finally {
        // Close context to free memory on large decodes
        await audioContext?.close?.();
      }
    };

    decodeAndRender();

    return () => {
      cancelled = true;
    };
  }, [url, color, beatGrid]);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker || !resolvedDuration) return;
    const normalized = Math.max(0, Math.min(1, playhead / resolvedDuration));
    worker.postMessage({ type: "playhead", progress: normalized } satisfies WaveformWorkerMessage);
  }, [playhead, resolvedDuration]);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      if (!onSeek || resolvedDuration <= 0) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(pct * resolvedDuration);
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "playhead", progress: pct } satisfies WaveformWorkerMessage);
      }
    },
    [onSeek, resolvedDuration]
  );

  const gestureHandlers = useGestures({
    onDragStart: (event) => {
      if (!onSeek || resolvedDuration <= 0) return;
      setIsScrubbing(true);
      seekFromClientX(event.clientX);
    },
    onDrag: (_deltaX, _deltaY, event) => {
      if (!onSeek || resolvedDuration <= 0) return;
      seekFromClientX(event.clientX);
    },
    onDragEnd: () => {
      setIsScrubbing(false);
    },
    onVelocity: undefined,
  });

  // Extract only DOM-compatible props from gestureHandlers
  const domGestureHandlers = {
    onPointerDown: gestureHandlers.onPointerDown,
    onPointerMove: gestureHandlers.onPointerMove,
    onPointerUp: gestureHandlers.onPointerUp,
    onPointerCancel: gestureHandlers.onPointerCancel,
  };

  const formatTime = (value: number) => {
    if (!Number.isFinite(value)) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onSeek || resolvedDuration <= 0) return;
    const step = Math.max(1, resolvedDuration * 0.02);
    if (event.key === "ArrowRight") {
      onSeek(Math.min(resolvedDuration, playhead + step));
      event.preventDefault();
    } else if (event.key === "ArrowLeft") {
      onSeek(Math.max(0, playhead - step));
      event.preventDefault();
    } else if (event.key === "Home") {
      onSeek(0);
      event.preventDefault();
    } else if (event.key === "End") {
      onSeek(resolvedDuration);
      event.preventDefault();
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch waveform data: ${response.statusText}`);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("WaveformMini fetch error:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return (
    <>
      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden rounded-md border border-white/10 bg-black/40 backdrop-blur-md waveform-scrubber ${isScrubbing ? "is-scrubbing" : ""}`}
        {...domGestureHandlers}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        role="slider"
        tabIndex={0}
        aria-label="Waveform scrubber"
        aria-valuemin={0}
        aria-valuemax={Math.max(1, Math.floor(resolvedDuration))}
        aria-valuenow={Math.max(0, Math.floor(playhead))}
        aria-valuetext={formatTime(playhead)}
        aria-disabled={resolvedDuration <= 0}
        data-no-swipe="true"
      >
        <canvas ref={canvasRef} className="block w-full h-19" />
        {isLoading && (
          <div className="absolute inset-0 bg-white/5 animate-pulse" aria-hidden="true">
            <div className="absolute inset-y-3 left-4 right-4 rounded-full bg-white/10 blur-sm" />
          </div>
        )}
      </div>
      {showMenu && (
        <div
          className="fixed z-50 bg-black/80 border border-white/20 rounded-md p-2 shadow-lg"
          style={{ left: menuPosition.x, top: menuPosition.y }}
          onClick={() => setShowMenu(false)}
        >
          <button className="block w-full text-left px-2 py-1 hover:bg-white/10 rounded">Set Loop In</button>
          <button className="block w-full text-left px-2 py-1 hover:bg-white/10 rounded">Set Loop Out</button>
          <button className="block w-full text-left px-2 py-1 hover:bg-white/10 rounded">Add Cue</button>
          <button className="block w-full text-left px-2 py-1 hover:bg-white/10 rounded">Analyze Energy</button>
        </div>
      )}
    </>
  );
}
