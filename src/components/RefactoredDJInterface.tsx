"use client";

import { useEffect, useMemo, useState } from "react";
import { ensureAudioEngineReady } from "@/engine/AudioEngine";
import { useAudioStore } from "@/store/useAudioStore";
import { WaveformPreview } from "./WaveformPreview";
import { DevAudioDebug } from "./DevAudioDebug";

type DeckId = "deckA" | "deckB";

type EQState = {
  low: number;
  mid: number;
  high: number;
};

const initialTrack = {
  deckA: "/audio/tracks/amor-sincero.mp3",
  deckB: "/audio/tracks/entre-humos.mp3",
};

/**
 * Lightweight interface that routes all audio through AudioEngine.
 * WaveformPreview is visual-only; seeks call engine.seek().
 * All controls (play/pause/seek/load/volume/EQ/FX/crossfader) go through AudioEngine.
 */
export function RefactoredDJInterface() {
  const [tracks, setTracks] = useState<Record<DeckId, string>>(initialTrack);
  const [durations, setDurations] = useState<Record<DeckId, number>>({ deckA: 0, deckB: 0 });
  const [crossfade, setCrossfade] = useState(0.5);
  const [eqState, setEqState] = useState<Record<DeckId, EQState>>({
    deckA: { low: 0, mid: 0, high: 0 },
    deckB: { low: 0, mid: 0, high: 0 },
  });
  const [fxAmount, setFxAmount] = useState(0);

  const deckInfo = useAudioStore(
    useMemo(
      () => (state) => ({
        deckA: state.decks.deckA,
        deckB: state.decks.deckB,
      }),
      [],
    ),
  );

  const loadTrack = async (deck: DeckId, url: string) => {
    if (!url) return;
    const engine = await ensureAudioEngineReady();
    await engine.loadTrack(deck, url);
    const dur = engine.getDuration(deck);
    setDurations((prev) => ({ ...prev, [deck]: dur }));
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

  const handleVolume = async (deck: DeckId, value: number) => {
    const engine = await ensureAudioEngineReady();
    await engine.setVolume(deck, value);
  };

  const handleEQ = async (deck: DeckId, band: keyof EQState, value: number) => {
    setEqState((prev) => ({
      ...prev,
      [deck]: { ...prev[deck], [band]: value },
    }));
    const engine = await ensureAudioEngineReady();
    await engine.setEQ(deck, { [band]: value });
  };

  const handleFX = async (type: "delay" | "reverb" | "filter", value: number) => {
    setFxAmount(value);
    const engine = await ensureAudioEngineReady();
    await engine.setFX("deckA", type, value);
    await engine.setFX("deckB", type, value);
  };

  const deckControls = useMemo(
    () => [
      { id: "deckA" as DeckId, label: "Deck A" },
      { id: "deckB" as DeckId, label: "Deck B" },
    ],
    [],
  );

  useEffect(() => {
    // Only mount DevAudioDebug in dev
  }, []);

  return (
    <>
      {process.env.NODE_ENV !== "production" ? <DevAudioDebug intervalMs={800} /> : null}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {deckControls.map(({ id, label }) => (
          <div key={id} className="space-y-4 rounded-lg border border-gray-800 bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase text-gray-200">{label}</h2>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-500">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                {deckInfo[id]?.isPlaying ? "Playing" : "Idle"}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase text-gray-400">Track URL</label>
              <input
                className="w-full rounded border border-gray-700 bg-gray-900 p-2 text-sm text-white"
                type="text"
                value={tracks[id]}
                onChange={(e) => setTracks((prev) => ({ ...prev, [id]: e.target.value }))}
                placeholder="https://example.com/track.mp3"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => loadTrack(id, tracks[id])}
                  className="rounded bg-blue-600 px-3 py-2 text-[11px] font-semibold uppercase text-white hover:bg-blue-500"
                >
                  Load
                </button>
                <button
                  onClick={() => handlePlay(id)}
                  className="rounded bg-emerald-600 px-3 py-2 text-[11px] font-semibold uppercase text-white hover:bg-emerald-500"
                >
                  Play
                </button>
                <button
                  onClick={() => handlePause(id)}
                  className="rounded bg-red-600 px-3 py-2 text-[11px] font-semibold uppercase text-white hover:bg-red-500"
                >
                  Pause
                </button>
              </div>
            </div>

            <WaveformPreview
              trackUrl={tracks[id] || null}
              onSeek={(p) => handleSeek(id, p, durations[id] || 0)}
            />

            <div className="space-y-3 rounded-md border border-gray-800/80 bg-black/40 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Volume & EQ</p>
              <div className="flex items-center gap-3">
                <label className="text-xs uppercase text-gray-400">Vol</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={deckInfo[id]?.volume ?? 1}
                  onChange={(e) => handleVolume(id, parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="w-10 text-right text-xs text-gray-300">
                  {((deckInfo[id]?.volume ?? 1) * 100).toFixed(0)}%
                </span>
              </div>
              {(["low", "mid", "high"] as (keyof EQState)[]).map((band) => (
                <div key={band} className="flex items-center gap-3">
                  <label className="w-10 text-xs uppercase text-gray-400">{band}</label>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={0.5}
                    value={eqState[id][band]}
                    onChange={(e) => handleEQ(id, band, parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-12 text-right text-xs text-gray-300">{eqState[id][band].toFixed(1)} dB</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="col-span-1 space-y-4 rounded-lg border border-gray-800 bg-black/40 p-4 lg:col-span-2">
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

          <div className="space-y-3 rounded-md border border-gray-800/80 bg-black/40 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Global FX (visual)</p>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={fxAmount}
              onChange={(e) => handleFX("filter", parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex gap-2 text-[11px] text-gray-400">
              <button
                onClick={() => handleFX("delay", fxAmount)}
                className="rounded bg-purple-700/80 px-3 py-2 text-white transition hover:bg-purple-600"
              >
                Send Delay
              </button>
              <button
                onClick={() => handleFX("reverb", fxAmount)}
                className="rounded bg-indigo-700/80 px-3 py-2 text-white transition hover:bg-indigo-600"
              >
                Send Reverb
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
