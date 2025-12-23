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

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#3f3f46", // Zinc 700 - unplayed
      progressColor: "#ccff00", // Toxic Lime - played
      cursorColor: "rgba(255, 255, 255, 0.3)", // Thin white cursor
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: height,
      normalize: true,
      interact: true,
      dragToSeek: true,
      backend: "WebAudio",
      mediaControls: false,
    });

    wavesurferRef.current = wavesurfer;

    // Load audio
    wavesurfer.load(audioUrl);

    // Handle ready state
    wavesurfer.on("ready", () => {
      setIsReady(true);
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
      setTimeout(() => {
        isSeekingRef.current = false;
      }, 200);
    });

    // Cleanup
    return () => {
      wavesurfer.destroy();
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
        boxShadow: "0 0 15px rgba(204, 255, 0, 0.1)",
      }}
    >
      <div ref={containerRef} className="w-full" />
    </div>
  );
}

