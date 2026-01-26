"use client";

import { useStudioStore } from "@/store/useStudioStore";

type StemWaveformsProps = {
  deckId: "A" | "B";
  performanceMode: "high" | "balanced" | "low";
};

const STEMS = ["vocals", "drums", "bass", "other"] as const;

export function StemWaveforms({ deckId, performanceMode }: StemWaveformsProps) {
  const showStemWaveforms = useStudioStore((state) => state.showStemWaveforms);
  const stems = useStudioStore((state) => state.stems[deckId]);
  const hasStems = Object.values(stems).some(Boolean);

  if (!showStemWaveforms || performanceMode === "low") {
    return null;
  }

  return (
    <div className="stem-waveforms">
      <div className="stem-waveforms-header">Stem Waveforms</div>
      {!hasStems && <div className="stem-waveforms-empty">Generate stems to unlock per-stem waveforms.</div>}
      {hasStems && (
        <div className="stem-waveforms-grid">
          {STEMS.map((stem) => (
            <div key={stem} className="stem-waveform-row" data-stem={stem}>
              <span className="stem-label">{stem}</span>
              <div className="stem-waveform-track">
                <div className="stem-waveform-scan" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
