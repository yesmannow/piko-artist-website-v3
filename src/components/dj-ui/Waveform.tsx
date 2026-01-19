"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

interface WaveformProps {
  audioUrl: string;
  progress: number; // 0-100
  isPlaying: boolean; // Kept for potential future use
  onSeek: (time: number) => void;
  height?: number;
}

function isAbortError(err: unknown) {
  if (!err) return false;
  // DOMException in browsers
  if (err instanceof DOMException && err.name === "AbortError") return true;
  // Some libs throw plain Error
  if (err instanceof Error && err.name === "AbortError") return true;
  // Or they throw a plain object
  if (typeof err === "object" && err !== null && "name" in err && (err as { name?: unknown }).name === "AbortError") {
    return true;
  }
  const msg =
    typeof err === "object" && err !== null && "message" in err
      ? (err as { message?: unknown }).message
      : undefined;
  return typeof msg === "string" && msg.toLowerCase().includes("aborted");
}

export function Waveform({
  audioUrl,
  progress,
  isPlaying: _isPlaying, // eslint-disable-line @typescript-eslint/no-unused-vars
  onSeek,
  height = 60,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isSeekingRef = useRef(false);
  const seekTimeoutRef = useRef<number | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    let isUnmounting = false;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#3f3f46", // Zinc 700 - unplayed
      progressColor: "#FFD700", // Safety Yellow - played
      cursorColor: "rgba(255, 255, 255, 0.3)", // Thin white cursor
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: height,
      normalize: true,
      interact: true,
      dragToSeek: true,
      // MediaElement backend is more abort-tolerant during unmount / StrictMode double-invoke
      backend: "MediaElement",
      mediaControls: false,
    });

    wavesurferRef.current = wavesurfer;

    // Load audio
    try {
      wavesurfer.load(audioUrl);
    } catch (err) {
      // If unmount happens mid-load in dev strict mode, ignore abort-like errors
      if (!isAbortError(err) && process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Waveform load error:", err);
      }
    }

    // Handle ready state
    wavesurfer.on("ready", () => {
      setIsReady(true);
    });

    // Handle internal load errors (AbortError is expected on fast unmount)
    wavesurfer.on("error", (err) => {
      if (isUnmounting && isAbortError(err)) return;
      if (isAbortError(err)) return;
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Waveform error:", err);
      }
    });

    // Handle seek - sync with audio element
    // @ts-expect-error - wavesurfer.js types may not include all event names
    wavesurfer.on("seek", (seekProgress: number) => {
      if (!wavesurferRef.current) return;
      isSeekingRef.current = true;

      // Get duration from wavesurfer and calculate time
      const duration = wavesurferRef.current.getDuration();
      if (duration) {
        const time = seekProgress * duration;
        onSeek(time);
      }

      // Reset flag after a short delay
      if (seekTimeoutRef.current) window.clearTimeout(seekTimeoutRef.current);
      seekTimeoutRef.current = window.setTimeout(() => {
        isSeekingRef.current = false;
      }, 200);
    });

    // Cleanup
    return () => {
      isUnmounting = true;
      if (seekTimeoutRef.current) {
        window.clearTimeout(seekTimeoutRef.current);
        seekTimeoutRef.current = null;
      }
      try {
        wavesurfer.destroy();
      } catch (err) {
        // WaveSurfer may abort an in-flight request during destroy() → ignore AbortError
        if (!isAbortError(err) && process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.error("Waveform destroy error:", err);
        }
      }
    };
  }, [audioUrl, onSeek, height]);

  // Note: WaveSurfer is visualization-only, actual playback is handled by AudioContext
  // We just sync the progress visualization

  // Sync progress from audio element to waveform (but not when user is seeking)
  useEffect(() => {
    // Sync progress only if not dragging
    if (!wavesurferRef.current || !isReady || isSeekingRef.current) return;

    const duration = wavesurferRef.current.getDuration();
    if (duration > 0) {
      const time = (progress / 100) * duration;
      // Prevent feedback loop: only seek if difference is significant
      const currentTime = wavesurferRef.current.getCurrentTime();
      if (Math.abs(currentTime - time) > 0.2) {
        wavesurferRef.current.setTime(time);
      }
    }
  }, [progress, isReady]);

  return (
    <div
      className="w-full"
      style={{
        boxShadow: "0 0 15px rgb(204 255 0 / 0.1)",
      }}
    >
      <div ref={containerRef} className="w-full" />
    </div>
  );
}

