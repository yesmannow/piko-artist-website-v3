"use client";

import React from "react";
import type { DeckProps } from "@/components/deck/types";

export function DeckDesktop(props: DeckProps) {
  const { deckId, isFocused, onFocus, isPlaying, onPlay, onPause } = props;

  return (
    <section
      role="region"
      aria-label={`Deck ${deckId} desktop`}
      className={`deck-full deck-desktop ${isFocused ? "deck-focused" : ""}`}
      data-deck-id={deckId}
      tabIndex={0}
      onFocus={onFocus}
    >
      <header className="deck-header">
        <h3 className="deck-title">Deck {deckId}</h3>
        <div className="transport">
          <button
            aria-pressed={!!isPlaying}
            aria-label={`Play ${deckId}`}
            onClick={isPlaying ? onPause : onPlay}
          />
          <button aria-label={`Cue ${deckId}`} />
        </div>
      </header>

      <div className="deck-body">
        <div className="jog-wheel-large" role="application" aria-label={`Jog wheel ${deckId}`} tabIndex={0} />

        <div className="waveform-full" role="img" aria-label={`Waveform for deck ${deckId}`} />

        <div className="channel-strip" role="group" aria-label="Channel strip">
          <div className="eq-full">
            <input aria-label="High" type="range" />
            <input aria-label="Mid" type="range" />
            <input aria-label="Low" type="range" />
          </div>
          <input aria-label={`Gain ${deckId}`} type="range" />
        </div>

        <div className="pads-grid" role="group" aria-label="Hot cues">
          {Array.from({ length: 8 }).map((_, i) => (
            <button key={i} className="pad" aria-label={`Hot cue ${i + 1}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
