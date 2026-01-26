"use client";

import React, { useRef, useEffect, useCallback } from "react";
import type { DeckProps } from "@/components/deck/types";
import { useStudioGestures } from "@/hooks/useStudioGestures";
import { JogArtwork, type JogArtworkHandle } from '@/components/ui/JogArtwork';
import { usePerformanceMode } from '@/hooks/usePerformanceMode';

export function DeckMobile({ deckId, isFocused, onFocus, isPlaying, onPlay, onPause, track }: DeckProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const jogRef = useRef<JogArtworkHandle | null>(null);
  const perf = usePerformanceMode();

  // Rotate while playing, stop when paused
  useEffect(() => {
    if (!jogRef.current) return;
    jogRef.current.setSpinning(!!isPlaying);
  }, [isPlaying]);

  const handleScratch = useCallback((angle: number) => {
    // Could emit custom event or handle scratching logic here
    console.log(`Scratch on Deck ${deckId}: ${angle}°`);
  }, [deckId]);

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
        <JogArtwork
          ref={jogRef}
          src={track?.cover}
          size={220}
          performanceMode={perf}
          energy={track?.energy ?? 0}
          trackTitle={track?.title}
          trackArtist={track?.artist}
          alt={`${track?.title || 'Track'} cover`}
          onScratch={handleScratch}
        />
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
