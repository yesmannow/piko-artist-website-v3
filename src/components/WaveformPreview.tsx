"use client";

import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

interface WaveformPreviewProps {
  trackUrl: string | null;
  onSeek?: (progress: number) => void; // progress 0..1
  height?: number;
  waveColor?: string;
  progressColor?: string;
}

/**
 * Visual-only WaveSurfer wrapper.
 * Loads the track for display and emits seek progress, but does not route audio.
 */
export function WaveformPreview({
  trackUrl,
  onSeek,
  height = 80,
  waveColor = "#888",
  progressColor = "#fff",
}: WaveformPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy any previous instance before creating a new one
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor,
      barWidth: 2,
      height,
      interact: true,
      backend: "MediaElement", // Visual-only; no routing needed
    });

    const ws = wavesurferRef.current;

    if (trackUrl) {
      ws.load(trackUrl);
    }

    const handleSeek = (progress: number) => {
      onSeek?.(progress);
    };

    // Wavesurfer types don't declare "seek" event; cast to any to register safely
    ws.on("seek" as any, handleSeek);

    return () => {
      ws.un("seek" as any, handleSeek);
      ws.destroy();
      wavesurferRef.current = null;
    };
  }, [trackUrl, height, waveColor, progressColor, onSeek]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
