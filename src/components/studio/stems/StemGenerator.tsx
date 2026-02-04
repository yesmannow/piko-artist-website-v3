"use client";

import { useStudioStore } from "@/store/useStudioStore";
import { useStore } from "@/store/useStore";

export function StemGenerator() {
  const focusedDeckId = useStudioStore((state) => state.focusedDeckId);
  const setFocusedDeckId = useStudioStore((state) => state.setFocusedDeckId);
  const requestStemGeneration = useStudioStore((state) => state.requestStemGeneration);
  const stems = useStudioStore((state) => state.stems);
  const deckA = useStore((state) => state.deckA);
  const deckB = useStore((state) => state.deckB);

  const activeDeck = focusedDeckId ?? "A";
  const hasStems = Object.values(stems[activeDeck]).some(Boolean);
  const hasTrack = activeDeck === "A" ? Boolean(deckA.trackData?.url) : Boolean(deckB.trackData?.url);

  return (
    <div className="stem-generator" data-testid="stem-generator">
      <div className="stem-generator-row">
        <div className="stem-generator-tabs">
          {(["A", "B"] as const).map((deckId) => (
            <button
              key={deckId}
              type="button"
              className={`btn btn-ghost ${activeDeck === deckId ? "btn-active" : ""}`}
              onClick={() => setFocusedDeckId(deckId)}
            >
              Deck {deckId}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          data-testid="generate-stems"
          onClick={() => requestStemGeneration(activeDeck)}
          disabled={!hasTrack || hasStems}
          aria-disabled={!hasTrack || hasStems}
          aria-label="Generate stems"
          title={!hasTrack ? "Load a track to generate stems" : hasStems ? "Stems already generated" : "Generate stems"}
        >
          {hasStems ? "Stems Ready" : "Generate Stems"}
        </button>
      </div>
    </div>
  );
}
