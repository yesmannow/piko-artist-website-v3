"use client";

import { useEffect, useMemo, useState } from "react";
import { ensureAudioEngineReady } from "@/engine/AudioEngine";
import { WaveformPreview } from "./WaveformPreview";

type DeckId = "deckA" | "deckB";

/**
 * Lightweight interface that routes all audio through AudioEngine.
 * WaveformPreview is visual-only; seeks call engine.seek().
 */
export function RefactoredDJInterface() {
  const [trackA, setTrackA] = useState("/audio/tracks/amor-sincero.mp3");
  const [trackB, setTrackB] = useState("/audio/tracks/entre-humos.mp3");
  const [durationA, setDurationA] = useState(0);
  const [durationB, setDurationB] = useState(0);
  const [crossfade, setCrossfade] = useState(0.5);

  const loadTrack = async (deck: DeckId, url: string) => {
    if (!url) return;
    const engine = await ensureAudioEngineReady();
    await engine.loadTrack(deck, url);
    const dur = engine.getDuration(deck);
    if (deck === "deckA") setDurationA(dur);
    else setDurationB(dur);
  };

  const handlePlay = async (deck: DeckId) => {
    const engine = await ensureAudioEngineReady();
    await engine.play(deck);
  };

  const handlePause = async (deck: DeckId) => {
    const engine = await ensureAudioEngineReady();
    await engine.pause(deck);
  };

  const handleSeek = async (deck: DeckId, progress: number, duration: number) => {
    const engine = await ensureAudioEngineReady();
    await engine.seek(deck, progress * duration);
  };

  const handleCrossfade = async (val: number) => {
    setCrossfade(val);
    const engine = await ensureAudioEngineReady();
    await engine.setCrossfader(val);
  };

  useEffect(() => {
    // Set initial crossfader on mount
    handleCrossfade(crossfade);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deckControls = useMemo(
    () => [
      { id: "deckA" as DeckId, track: trackA, setTrack: setTrackA, duration: durationA },
      { id: "deckB" as DeckId, track: trackB, setTrack: setTrackB, duration: durationB },
    ],
    [trackA, trackB, durationA, durationB],
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {deckControls.map(({ id, track, setTrack, duration }) => (
        <div key={id} className="space-y-3 rounded-lg border border-gray-800 bg-black/40 p-4">
          <h2 className="text-sm font-semibold uppercase text-gray-200">{id === "deckA" ? "Deck A" : "Deck B"}</h2>
          <div className="space-y-2">
            <label className="text-xs uppercase text-gray-400">Track URL</label>
            <input
              className="w-full rounded border border-gray-700 bg-gray-900 p-2 text-sm text-white"
              type="text"
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              placeholder="https://example.com/track.mp3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => loadTrack(id, track)}
                className="rounded bg-blue-600 px-3 py-2 text-xs font-semibold uppercase text-white hover:bg-blue-500"
              >
                Load
              </button>
              <button
                onClick={() => handlePlay(id)}
                className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase text-white hover:bg-emerald-500"
              >
                Play
              </button>
              <button
                onClick={() => handlePause(id)}
                className="rounded bg-red-600 px-3 py-2 text-xs font-semibold uppercase text-white hover:bg-red-500"
              >
                Pause
              </button>
            </div>
          </div>

          <WaveformPreview
            trackUrl={track || null}
            onSeek={(p) => handleSeek(id, p, duration || 0)}
          />
        </div>
      ))}

      <div className="col-span-1 lg:col-span-2 space-y-2 rounded-lg border border-gray-800 bg-black/40 p-4">
        <label className="text-xs uppercase text-gray-400">Crossfader</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={crossfade}
          onChange={(e) => handleCrossfade(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="text-xs text-gray-300">Position: {(crossfade * 100).toFixed(0)}%</div>
      </div>
    </div>
  );
}
