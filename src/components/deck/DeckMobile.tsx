"use client";

import React, { useRef } from "react";
import type { DeckProps } from "@/components/deck/types";
import { useStudioGestures } from "@/hooks/useStudioGestures";

export function DeckMobile({ deckId, isFocused, onFocus, isPlaying, onPlay, onPause }: DeckProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  useStudioGestures({
    elementRef: rootRef,
    onSwipe: (dir) => {
      // parent should handle deck switching via context or prop
      const ev = new CustomEvent("piko:deck-swipe", { detail: { deckId, dir } });
      window.dispatchEvent(ev);
    },
    onLongPress: () => {
      const ev = new CustomEvent("piko:deck-longpress", { detail: { deckId } });
      window.dispatchEvent(ev);
    },
    onPinch: (scale) => {
      const ev = new CustomEvent("piko:deck-pinch", { detail: { deckId, scale } });
      window.dispatchEvent(ev);
    },
  });

  return (
    <section
      ref={rootRef}
      role="region"
      aria-label={`Deck ${deckId} mobile`}
      className={`deck-full deck-mobile ${isFocused ? "deck-focused" : ""}`}
      data-deck-id={deckId}
      tabIndex={0}
      onFocus={onFocus}
    >
      <header className="deck-header">
        <div className="deck-title-row">
          <h3 className="deck-title">Deck {deckId}</h3>
          <div className="mini-transport">
            <button
              aria-pressed={!!isPlaying}
              aria-label={`Play ${deckId}`}
              onClick={isPlaying ? onPause : onPlay}
            />
            <button aria-label={`Cue ${deckId}`} />
          </div>
        </div>
      </header>

      <div className="deck-body">
        <div className="waveform-large" role="img" aria-label={`Waveform for deck ${deckId}`} />
        <div className="touch-jog" role="application" aria-label={`Jog wheel ${deckId}`} tabIndex={0} />
      </div>

      <div className="deck-bottom-sheet" role="dialog" aria-label="Performance controls">
        <div className="pads-row" role="group" aria-label="Hot cues">
          {Array.from({ length: 4 }).map((_, i) => (
            <button key={i} className="pad-lg" aria-label={`Hot cue ${i + 1}`} />
          ))}
        </div>

        <div className="mobile-mixer" role="group" aria-label="Mixer controls">
          <button aria-label="Sync" className="btn-sync" />
          <button aria-label="Loop" className="btn-loop" />
          <button aria-label="Stem Mode" className="btn-stem" />
        </div>
      </div>
    </section>
  );
}
