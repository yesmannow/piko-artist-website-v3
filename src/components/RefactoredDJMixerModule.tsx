"use client";

import { useState } from "react";
import { ensureAudioEngineReady } from "@/engine/AudioEngine";

/**
 * Minimal mixer module wired to AudioEngine FX.
 */
export function RefactoredDJMixerModule() {
  const [fxLevel, setFxLevel] = useState(0);

  const applyFX = async () => {
    const engine = await ensureAudioEngineReady();
    await engine.setFX("deckA", "delay", fxLevel);
    await engine.setFX("deckB", "reverb", fxLevel);
  };

  return (
    <div className="space-y-3 rounded-lg border border-gray-800 bg-black/40 p-4">
      <label className="text-xs uppercase text-gray-400">Global FX Level</label>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={fxLevel}
        onChange={(e) => setFxLevel(parseFloat(e.target.value))}
        className="w-full"
      />
      <button
        onClick={applyFX}
        className="rounded bg-purple-600 px-3 py-2 text-xs font-semibold uppercase text-white hover:bg-purple-500"
      >
        Apply FX to A & B
      </button>
    </div>
  );
}

