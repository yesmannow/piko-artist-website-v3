"use client";

/**
 * DeckWaveform - Waveform Display Wrapper
 *
 * Displays the full waveform for deck visualization
 * Uses the existing WaveformMini or MainWaveform component
 */

import { MainWaveform } from "./MainWaveform";

interface DeckWaveformProps {
  deckId: "A" | "B";
}

export function DeckWaveform({ deckId }: DeckWaveformProps) {
  return (
    <div className="flex-1 rounded-lg border border-white/5 bg-(--bg-secondary) p-2 overflow-hidden">
      <MainWaveform deckId={deckId} />
    </div>
  );
}
