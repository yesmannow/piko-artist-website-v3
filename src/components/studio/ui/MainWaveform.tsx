"use client";

import { useEffect, useRef, useState } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { WaveformMini } from "./WaveformMini";

type MainWaveformProps = {
  deckId: "A" | "B";
  title?: string;
  url?: string;
  beatGrid?: number[];
};

export function MainWaveform({ deckId, title, url, beatGrid }: MainWaveformProps) {
  const { getPlaybackPosition, getDeckDuration, seekTo } = useAudioEngine();
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      setPosition(getPlaybackPosition(deckId));
      setDuration(getDeckDuration(deckId));
      frameRef.current = window.requestAnimationFrame(tick);
    };
    frameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [deckId, getDeckDuration, getPlaybackPosition]);

  if (!url) {
    return (
    <div className="main-waveform" data-testid="main-waveform">
      <div className="main-waveform-header">
        <span>{title ?? `Deck ${deckId}`}</span>
        <span className="main-waveform-status">No track loaded</span>
      </div>
      <div className="main-waveform-empty" />
      </div>
    );
  }

  return (
    <div className="main-waveform" data-testid="main-waveform">
      <div className="main-waveform-header">
        <span>{title ?? `Deck ${deckId}`}</span>
        <span className="main-waveform-status">{duration > 0 ? "Waveform" : "Analyzing"}</span>
      </div>
      <WaveformMini
        url={url}
        color={deckId === "A" ? "#4af2c5" : "#7c8dff"}
        beatGrid={beatGrid}
        playhead={position}
        durationSeconds={duration > 0 ? duration : undefined}
        onSeek={(seconds) => seekTo(deckId, seconds)}
      />
    </div>
  );
}
