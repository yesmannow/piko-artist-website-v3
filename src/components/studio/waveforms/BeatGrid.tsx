"use client";

/**
 * BeatGrid - Beatgrid Overlay for Waveform (Phase S9 Starter)
 *
 * Renders beat tick marks aligned to detected BPM and first beat offset.
 * Provides visual reference for beatmatching and loop quantization.
 *
 * Features:
 * - Subtle beat ticks overlaid on waveform
 * - Downbeats (measure starts) highlighted
 * - Auto-scales with waveform zoom/scroll
 * - Gracefully hidden if no beat data available
 *
 * Integration:
 * - Reads BPM and offset from insights DB
 * - Positioned absolutely over waveform canvas
 * - Does not interfere with click-to-seek or regions
 */

import { useEffect, useState } from "react";
import { getInsights } from "@/db/studioDb";
import { calculateBeatGrid } from "@/features/insights/analyzeBeat";
import { useStore } from "@/store/useStore";
import { useAudioEngine } from "@/hooks/useAudioEngine";

interface BeatGridProps {
  readonly deckId: "A" | "B";
}

export function BeatGrid({ deckId }: Readonly<BeatGridProps>) {
  const [beatTimestamps, setBeatTimestamps] = useState<number[]>([]);
  const { getDeckDuration } = useAudioEngine();

  // Get track data from store
  const trackData = useStore((state) =>
    deckId === "A" ? state.deckA.trackData : state.deckB.trackData
  );

  const trackId = trackData?.trackId;

  // Load beat data when track changes
  useEffect(() => {
    let mounted = true;

    const loadBeatData = async () => {
      if (!trackId) {
        if (mounted) setBeatTimestamps([]);
        return;
      }

      try {
        const insights = await getInsights(trackId);
        if (!mounted || !insights || !insights.bpm || !insights.firstBeatOffsetSec) {
          if (mounted) setBeatTimestamps([]);
          return;
        }

        // Get duration from audio engine
        const duration = getDeckDuration(deckId);
        if (duration <= 0) {
          if (mounted) setBeatTimestamps([]);
          return;
        }

        const beats = calculateBeatGrid(
          insights.bpm,
          insights.firstBeatOffsetSec,
          duration
        );

        if (mounted) setBeatTimestamps(beats);
      } catch (error) {
        console.warn("[BeatGrid] Failed to load beat data:", error);
        if (mounted) setBeatTimestamps([]);
      }
    };

    void loadBeatData();

    return () => {
      mounted = false;
    };
  }, [trackId, deckId, getDeckDuration]);

  // Don't render if no beat data
  if (beatTimestamps.length === 0) {
    return null;
  }

  const duration = getDeckDuration(deckId);
  if (duration <= 0) {
    return null;
  }

  const deckColor = deckId === "A" ? "#4af2c5" : "#7c8dff";

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      {beatTimestamps.map((timestamp, index) => {
        // Position as percentage of track duration
        const position = (timestamp / duration) * 100;

        // Highlight downbeats (every 4 beats)
        const isDownbeat = index % 4 === 0;

        return (
          <div
            key={`beat-${index}`}
            className="absolute top-0 bottom-0"
            style={{
              left: `${position}%`,
              width: "1px",
              backgroundColor: deckColor,
              opacity: isDownbeat ? 0.3 : 0.15,
            }}
          />
        );
      })}
    </div>
  );
}
