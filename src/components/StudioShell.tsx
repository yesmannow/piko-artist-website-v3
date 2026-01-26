"use client";

import React, { useState } from "react";
import { DeckWrapper } from "@/components/deck/DeckWrapper";
import { StudioControlBar } from "@/components/StudioControlBar";

export function StudioShell() {
  const [focusedDeck, setFocusedDeck] = useState<"A" | "B">("A");
  const [deckAPlaying, setDeckAPlaying] = useState(false);
  const [deckBPlaying, setDeckBPlaying] = useState(false);

  const handleDeckAPlay = () => {
    setDeckAPlaying(true);
    setDeckBPlaying(false);
  };

  const handleDeckAPause = () => {
    setDeckAPlaying(false);
  };

  const handleDeckBPlay = () => {
    setDeckBPlaying(true);
    setDeckAPlaying(false);
  };

  const handleDeckBPause = () => {
    setDeckBPlaying(false);
  };

  return (
    <div className="studio-shell" role="application" aria-label="Piko Studio">
      <StudioControlBar />

      <main className="studio-main">
        <aside className="library-drawer" aria-label="Library">
          {/* Library component goes here */}
        </aside>

        <section className="decks-area" aria-label="Decks and mixer">
          <DeckWrapper
            deckId="A"
            isFocused={focusedDeck === "A"}
            onFocus={() => setFocusedDeck("A")}
            isPlaying={deckAPlaying}
            onPlay={handleDeckAPlay}
            onPause={handleDeckAPause}
          />
          <DeckWrapper
            deckId="B"
            isFocused={focusedDeck === "B"}
            onFocus={() => setFocusedDeck("B")}
            isPlaying={deckBPlaying}
            onPlay={handleDeckBPlay}
            onPause={handleDeckBPause}
          />
        </section>

        <aside className="fx-rack" aria-label="FX and Stem Rack">
          {/* FX and Stem Panel */}
        </aside>
      </main>
    </div>
  );
}
