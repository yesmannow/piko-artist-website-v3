"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";

interface WaveformProps {
  audioUrl: string;
  progress: number; // 0-100
  isPlaying: boolean; // Kept for potential future use
  onSeek: (time: number) => void;
  height?: number;
  hotCues?: Record<number, number>; // Hot cue points (index -> time in seconds)
  loopStart?: number | null; // Loop start time in seconds
  loopEnd?: number | null; // Loop end time in seconds
}

export function Waveform({
  audioUrl,
  progress,
  isPlaying: _isPlaying, // eslint-disable-line @typescript-eslint/no-unused-vars
  onSeek,
  height = 60,
  hotCues = {},
  loopStart = null,
  loopEnd = null,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<RegionsPlugin | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isSeekingRef = useRef(false);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    // Create regions plugin
    const regionsPlugin = RegionsPlugin.create();
    regionsPluginRef.current = regionsPlugin;

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
      backend: "WebAudio",
      mediaControls: false,
      plugins: [regionsPlugin],
    });

    wavesurferRef.current = wavesurfer;

    // Load audio with abort guard
    try {
      // Some builds return a promise; guard aborts
      const maybePromise = wavesurfer.load(audioUrl) as unknown;
      if (
        maybePromise &&
        typeof (maybePromise as Promise<unknown>).catch === "function"
      ) {
        (maybePromise as Promise<unknown>).catch(() => {});
      }
    } catch {
      // Ignore race conditions on teardown
    }

    // Handle ready state
    wavesurfer.on("ready", () => {
      setIsReady(true);
    });
    // Swallow benign errors from abort/destroy
    wavesurfer.on("error", () => {});

    // Handle seek - sync with audio element
    // @ts-expect-error - WaveSurfer types may not include all events
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

  // Update hot cue markers
  useEffect(() => {
    if (!regionsPluginRef.current || !isReady || !wavesurferRef.current) return;

    const regions = regionsPluginRef.current;
    const duration = wavesurferRef.current.getDuration();

    // Clear existing cue markers (regions with id starting with "cue-")
    regions.getRegions().forEach((region) => {
      if (region.id.startsWith("cue-")) {
        region.remove();
      }
    });

    // Add new cue markers
    Object.entries(hotCues).forEach(([index, time]) => {
      if (time >= 0 && time <= duration) {
        regions.addRegion({
          id: `cue-${index}`,
          start: time,
          end: time + 0.1, // Small width for visibility
          color: "rgba(255, 215, 0, 0.3)", // Safety Yellow with transparency
          drag: false,
          resize: false,
        });
      }
    });
  }, [hotCues, isReady]);

  // Update loop region
  useEffect(() => {
    if (!regionsPluginRef.current || !isReady || !wavesurferRef.current) return;

    const regions = regionsPluginRef.current;
    const duration = wavesurferRef.current.getDuration();

    // Clear existing loop region
    const existingLoop = regions.getRegions().find((r) => r.id === "loop");
    if (existingLoop) {
      existingLoop.remove();
    }

    // Add new loop region if both start and end are defined
    if (
      loopStart !== null &&
      loopEnd !== null &&
      loopStart >= 0 &&
      loopEnd <= duration &&
      loopStart < loopEnd
    ) {
      regions.addRegion({
        id: "loop",
        start: loopStart,
        end: loopEnd,
        color: "rgba(255, 215, 0, 0.15)", // Semi-transparent Safety Yellow
        drag: false,
        resize: false,
      });
    }
  }, [loopStart, loopEnd, isReady]);

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
