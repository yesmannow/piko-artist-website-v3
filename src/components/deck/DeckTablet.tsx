"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { DeckProps } from "@/components/deck/types";
import { JogArtwork, type JogArtworkHandle } from '@/components/ui/JogArtwork';
import { usePerformanceMode } from '@/hooks/usePerformanceMode';

export function DeckTablet(props: DeckProps) {
  const { deckId, isFocused, onFocus, isPlaying, onPlay, onPause, track } = props;
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

  return (
    <section
      role="region"
      aria-label={`Deck ${deckId} tablet`}
      className={`deck-full deck-tablet ${isFocused ? "deck-focused" : ""}`}
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
        <div className="wave-jog">
          <div className="waveform" role="img" aria-label={`Waveform for deck ${deckId}`} />
          <JogArtwork
            ref={jogRef}
            src={track?.cover}
            size={280}
            performanceMode={perf}
            energy={track?.energy ?? 0}
            trackTitle={track?.title}
            trackArtist={track?.artist}
            alt={`${track?.title || 'Track'} cover`}
            onScratch={handleScratch}
          />
        </div>

        <div className="compact-controls" role="group" aria-label="Compact performance controls">
          <div className="pads-row" role="group" aria-label="Hot cues">
            {Array.from({ length: 4 }).map((_, i) => (
              <button key={i} className="pad-sm" aria-label={`Hot cue ${i + 1}`} />
            ))}
          </div>

          <div className="mini-channel" role="group" aria-label="Mini channel">
            <input aria-label={`Gain ${deckId}`} type="range" />
            <div className="eq-mini">
              <input aria-label="High" type="range" />
              <input aria-label="Low" type="range" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
