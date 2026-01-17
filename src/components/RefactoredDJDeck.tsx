"use client";

import { useEffect, useState, useMemo } from "react";
import { ensureAudioEngineReady } from "@/engine/AudioEngine";
import { useAudioStore } from "@/store/useAudioStore";
import { WaveformPreview } from "./WaveformPreview";

export interface RefactoredDJDeckProps {
  deckId: "deckA" | "deckB";
  initialTrackUrl?: string;
}

/**
 * Minimal deck component wired directly to AudioEngine.
 * - Playback/load/seek go through AudioEngine
 * - WaveformPreview is visual-only and drives engine.seek
 * - No local Web Audio graph
 */
export function RefactoredDJDeck({
  deckId,
  initialTrackUrl = "",
}: RefactoredDJDeckProps) {
  const [trackUrl, setTrackUrl] = useState(initialTrackUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const deckState = useAudioStore(
    useMemo(
      () => (state) => ({
        volume: state.decks[deckId]?.volume ?? 1,
      }),
      [deckId],
    ),
  );

  useEffect(() => {
    // Preload duration if initial track provided
    if (!initialTrackUrl) return;
    (async () => {
      const engine = await ensureAudioEngineReady();
      await engine.loadTrack(deckId, initialTrackUrl);
      setDuration(engine.getDuration(deckId));
    })();
  }, [deckId, initialTrackUrl]);

  const handleLoad = async () => {
    const engine = await ensureAudioEngineReady();
    await engine.loadTrack(deckId, trackUrl);
    setDuration(engine.getDuration(deckId));
  };

  const handlePlayPause = async () => {
    const engine = await ensureAudioEngineReady();
    if (isPlaying) {
      await engine.pause(deckId);
    } else {
      await engine.play(deckId);
    }
    setIsPlaying((prev) => !prev);
  };

  const handleSeek = async (progress: number) => {
    const engine = await ensureAudioEngineReady();
    const target = duration * progress;
    await engine.seek(deckId, target);
  };

  const handleVolumeChange = async (value: number) => {
    const engine = await ensureAudioEngineReady();
    await engine.setVolume(deckId, value);
  };

  return (
    <div className="space-y-3 rounded-lg border border-gray-800 p-4 bg-black/40">
      <div className="space-y-2">
        <label className="text-xs uppercase text-gray-400">Track URL</label>
        <input
          className="w-full rounded border border-gray-700 bg-gray-900 p-2 text-sm text-white"
          type="text"
          value={trackUrl}
          onChange={(e) => setTrackUrl(e.target.value)}
          placeholder="https://example.com/track.mp3"
        />
        <div className="flex gap-2">
          <button
            onClick={handleLoad}
            className="rounded bg-blue-600 px-3 py-2 text-xs font-semibold uppercase text-white hover:bg-blue-500"
          >
            Load
          </button>
          <button
            onClick={handlePlayPause}
            className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase text-white hover:bg-emerald-500"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      <WaveformPreview trackUrl={trackUrl || null} onSeek={handleSeek} />

      <div className="flex items-center gap-3">
        <label className="text-xs uppercase text-gray-400">Volume</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={deckState.volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="w-10 text-right text-xs text-gray-300">
          {(deckState.volume * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
