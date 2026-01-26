"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

interface WaveformMiniProps {
  url: string;
  color: string;
  beatGrid?: number[];
  onSeek?: (seconds: number) => void;
}

export function WaveformMini({ url, color, beatGrid = [], onSeek }: WaveformMiniProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const waveRef = useRef<WaveSurfer | null>(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    waveRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgba(255,255,255,0.2)",
      progressColor: color,
      cursorWidth: 0,
      barWidth: 2,
      height: 64,
      normalize: true,
      interact: true,
    });

    waveRef.current.load(url);

    waveRef.current.on("ready", () => {
      setDuration(waveRef.current?.getDuration() || 0);
    });

    const ws = waveRef.current as WaveSurfer & { on(event: 'seek', cb: (progress: number) => void): void };
    ws.on("seek", (progress: number) => {
      if (typeof onSeek === "function" && duration > 0) {
        onSeek(progress * duration);
      }
    });

    return () => {
      waveRef.current?.destroy();
      waveRef.current = null;
    };
  }, [url, color, duration, onSeek]);

  return (
    <div className="relative w-full">
      <div ref={containerRef} className="w-full" />
      {beatGrid && beatGrid.length > 0 && duration > 0 && (
        <div className="pointer-events-none absolute inset-0">
          {beatGrid.map((beat) => {
            const pct = Math.min(1, Math.max(0, beat / duration));
            return (
              <div
                key={beat}
                className="absolute top-0 bottom-0 w-px bg-white/30"
                style={{ left: `${pct * 100}%` }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
