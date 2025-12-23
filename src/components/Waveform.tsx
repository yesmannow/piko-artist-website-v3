"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { useAudio } from "@/context/AudioContext";

interface WaveformProps {
  audioUrl: string;
  onReady?: () => void;
}

export function Waveform({ audioUrl, onReady }: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { isPlaying, audioRef, seek } = useAudio();
  const isSeekingRef = useRef(false);
  const progressUpdateRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize WaveSurfer - visualization only, no playback
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#3f3f46", // Zinc-700 - dark grey for unplayed part
      progressColor: "#ccff00", // Toxic Lime - for played part
      cursorColor: "#ffffff",
      barWidth: 2, // Bars look more "hip hop" than smooth line
      barRadius: 1,
      height: 40,
      normalize: true,
      interact: true, // Allow clicking to seek
      dragToSeek: true,
    });

    wavesurferRef.current = wavesurfer;

    // Load audio for visualization only
    wavesurfer.load(audioUrl);

    // Handle ready state
    wavesurfer.on("ready", () => {
      setIsReady(true);
      onReady?.();
    });

    // Handle seek - sync with audio element
    // @ts-expect-error - wavesurfer.js types may not include all event names
    wavesurfer.on("seek", (seekProgress: number) => {
      if (!audioRef.current || !audioRef.current.duration) return;
      isSeekingRef.current = true;
      const time = seekProgress * audioRef.current.duration;
      seek(time);
      // Reset flag after a short delay
      setTimeout(() => {
        isSeekingRef.current = false;
      }, 200);
    });

    // Cleanup
    return () => {
      if (progressUpdateRef.current) {
        cancelAnimationFrame(progressUpdateRef.current);
      }
      wavesurfer.destroy();
    };
  }, [audioUrl, onReady, seek, audioRef]);

  // Sync progress from audio element to waveform (but not when user is seeking)
  useEffect(() => {
    if (!wavesurferRef.current || !isReady || !audioRef.current) return;

    const updateProgress = () => {
      if (isSeekingRef.current) {
        progressUpdateRef.current = requestAnimationFrame(updateProgress);
        return;
      }

      if (audioRef.current && audioRef.current.duration && !audioRef.current.paused && wavesurferRef.current) {
        const currentProgress = audioRef.current.currentTime / audioRef.current.duration;
        wavesurferRef.current.seekTo(currentProgress);
      }

      progressUpdateRef.current = requestAnimationFrame(updateProgress);
    };

    progressUpdateRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (progressUpdateRef.current) {
        cancelAnimationFrame(progressUpdateRef.current);
      }
    };
  }, [isReady, audioRef, isPlaying]);

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full" />
    </div>
  );
}

