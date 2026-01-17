"use client";

import { useState } from "react";
import { ensureAudioEngineReady } from "@/engine/AudioEngine";

/**
 * Mixer control surface wired to AudioEngine.
 * Knobs/sliders call engine setters; loops and hot cues are lightweight wrappers.
 */
export function RefactoredDJMixerModule() {
  const [crossfader, setCrossfader] = useState(0.5);
  const [master, setMaster] = useState(1);
  const [fxLevel, setFxLevel] = useState(0);
  const [loopStart, setLoopStart] = useState(0);

  const setDeckVolume = async (deck: "deckA" | "deckB", value: number) => {
    const engine = await ensureAudioEngineReady();
    await engine.setVolume(deck, value);
  };

  const setEQ = async (deck: "deckA" | "deckB", band: "low" | "mid" | "high", value: number) => {
    const engine = await ensureAudioEngineReady();
    await engine.setEQ(deck, { [band]: value });
  };

  const setFX = async (type: "delay" | "reverb" | "filter", value: number) => {
    setFxLevel(value);
    const engine = await ensureAudioEngineReady();
    await engine.setFX("deckA", type, value);
    await engine.setFX("deckB", type, value);
  };

  const setXFade = async (value: number) => {
    setCrossfader(value);
    const engine = await ensureAudioEngineReady();
    await engine.setCrossfader(value);
  };

  const setMasterVolume = async (value: number) => {
    setMaster(value);
    const engine = await ensureAudioEngineReady();
    await engine.setMasterVolume(value);
  };

  const applyLoop = async (deck: "deckA" | "deckB") => {
    const engine = await ensureAudioEngineReady();
    await engine.setLoop(deck, loopStart, loopStart + 4); // simple 4s loop
  };

  const setCue = async (deck: "deckA" | "deckB", idx: number) => {
    const engine = await ensureAudioEngineReady();
    engine.setHotCue(deck, idx);
  };

  const triggerCue = async (deck: "deckA" | "deckB", idx: number) => {
    const engine = await ensureAudioEngineReady();
    await engine.triggerHotCue(deck, idx);
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-800 bg-black/40 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase text-gray-400">Crossfader</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={crossfader}
            onChange={(e) => setXFade(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase text-gray-400">Master</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={master}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(["deckA", "deckB"] as const).map((deck) => (
          <div key={deck} className="space-y-2 rounded-md border border-gray-800/80 bg-black/30 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">{deck === "deckA" ? "Deck A" : "Deck B"}</p>
            <label className="text-xs uppercase text-gray-400">Volume</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              onChange={(e) => setDeckVolume(deck, parseFloat(e.target.value))}
              className="w-full"
            />
            {(["low", "mid", "high"] as const).map((band) => (
              <div key={band} className="flex items-center gap-2">
                <label className="w-10 text-[11px] uppercase text-gray-400">{band}</label>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={0.5}
                  defaultValue={0}
                  onChange={(e) => setEQ(deck, band, parseFloat(e.target.value))}
                  className="flex-1"
                />
              </div>
            ))}
            <div className="flex gap-2">
              {[1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  onClick={() => setCue(deck, idx)}
                  className="flex-1 rounded bg-gray-800 px-2 py-1 text-[11px] uppercase text-gray-200 hover:bg-gray-700"
                >
                  Set Cue {idx}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  onClick={() => triggerCue(deck, idx)}
                  className="flex-1 rounded bg-emerald-700 px-2 py-1 text-[11px] uppercase text-white hover:bg-emerald-600"
                >
                  Jump {idx}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-md border border-gray-800/80 bg-black/30 p-3">
        <label className="text-xs uppercase text-gray-400">FX Send (both decks)</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={fxLevel}
          onChange={(e) => setFX("filter", parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setFX("delay", fxLevel)}
            className="flex-1 rounded bg-purple-700 px-3 py-2 text-[11px] uppercase text-white hover:bg-purple-600"
          >
            Delay
          </button>
          <button
            onClick={() => setFX("reverb", fxLevel)}
            className="flex-1 rounded bg-indigo-700 px-3 py-2 text-[11px] uppercase text-white hover:bg-indigo-600"
          >
            Reverb
          </button>
        </div>
      </div>

      <div className="space-y-2 rounded-md border border-gray-800/80 bg-black/30 p-3">
        <label className="text-xs uppercase text-gray-400">Loop Start (seconds)</label>
        <input
          type="number"
          min={0}
          step={0.5}
          value={loopStart}
          onChange={(e) => setLoopStart(parseFloat(e.target.value) || 0)}
          className="w-full rounded border border-gray-700 bg-gray-900 p-2 text-sm text-white"
        />
        <div className="flex gap-2">
          <button
            onClick={() => applyLoop("deckA")}
            className="flex-1 rounded bg-amber-700 px-3 py-2 text-[11px] uppercase text-white hover:bg-amber-600"
          >
            Loop A
          </button>
          <button
            onClick={() => applyLoop("deckB")}
            className="flex-1 rounded bg-amber-700 px-3 py-2 text-[11px] uppercase text-white hover:bg-amber-600"
          >
            Loop B
          </button>
        </div>
      </div>
    </div>
  );
}
