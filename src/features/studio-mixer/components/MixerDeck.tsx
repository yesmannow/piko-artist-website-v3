"use client";

import { useMemo, useState } from "react";
import { Play, Pause, Link2, RotateCw } from "lucide-react";
import { AudioContextManager } from "@/features/audio-engine/lib/AudioContextManager";
import { Waveform } from "@/features/audio-engine/components/Waveform";
import { useDeck } from "@/features/audio-engine/hooks/useDeck";
import { useMixerGraphOrNull } from "../lib/MixerGraphContext";
import { useMixerStore } from "../stores/useMixerStore";

export function MixerDeck({ deckId }: { deckId: "A" | "B" }) {
  const url = useMixerStore((s) => s.deckUrl[deckId]);
  const bpm = useMixerStore((s) => s.bpm);

  const graph = useMixerGraphOrNull();
  const [pitch01, setPitch01] = useState(0.5); // 0..1 maps -8..+8%

  // Get channel strip - use null if graph isn't ready (useDeck can handle null)
  const channelStrip = graph?.deck[deckId].channel ?? null;
  
  // Call useDeck unconditionally to follow Rules of Hooks
  const deck = useDeck(url, channelStrip);

  // Calculate playbackRate before early return (Rules of Hooks)
  const playbackRate = useMemo(() => {
    // -8%..+8% roughly
    const pct = (pitch01 - 0.5) * 0.16;
    return 1 + pct;
  }, [pitch01]);

  // Color constant (used in JSX)
  const color = deckId === "A" ? "#00d9ff" : "#ff00d9";

  // Show loading state if graph isn't ready yet (AFTER all hooks are called)
  if (!graph) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="text-xs font-mono text-white/40 uppercase tracking-[0.25em]">
          Initializing audio...
        </div>
      </div>
    );
  }

  const handlePlayPause = async () => {
    const mgr = AudioContextManager.getInstance();
    await mgr.resume();
    if (deck.state.isPlaying) deck.pause();
    else deck.play();
  };

  const applyPitch = async (v01: number) => {
    setPitch01(v01);
    deck.setPlaybackRate(playbackRate);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => void handlePlayPause()}
          className="relative w-16 h-16 rounded-full bg-[#1a1a1a] border-2 border-gray-700 flex items-center justify-center transition-all hover:border-gray-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 touch-manipulation"
          style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)" }}
          aria-label={deck.state.isPlaying ? "Pause" : "Play"}
        >
          {deck.state.isPlaying ? (
            <Pause className="w-8 h-8" style={{ color }} />
          ) : (
            <Play className="w-8 h-8 ml-1" style={{ color }} />
          )}
        </button>

        <button
          type="button"
          className="relative w-14 h-14 rounded-lg bg-[#1a1a1a] border-2 flex items-center justify-center transition-all hover:border-gray-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500 touch-manipulation border-gray-700"
          title="Sync (MVP)"
          aria-label="Sync BPM"
          onClick={() => {
            // MVP: normalize pitch back to 0 and keep global BPM display.
            setPitch01(0.5);
            deck.setPlaybackRate(1);
          }}
        >
          <Link2 className="w-6 h-6" style={{ color }} />
        </button>

        <button
          type="button"
          className="relative w-14 h-14 rounded-lg bg-[#1a1a1a] border-2 flex items-center justify-center transition-all hover:border-gray-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500 touch-manipulation border-gray-700"
          title="Reverse (UI stub)"
          aria-label="Reverse"
          onClick={() => {
            // Reverse is implemented in a later pass (requires buffer reversal + time mapping).
          }}
        >
          <RotateCw className="w-6 h-6" style={{ color }} />
        </button>
      </div>

      <div className="mt-4">
        <Waveform
          audioBuffer={deck.audioBuffer}
          progress={deck.state.duration > 0 ? deck.state.currentTime / deck.state.duration : 0}
          isPlaying={deck.state.isPlaying}
          onSeek={(t) => deck.seek(t)}
          onNudge={(r) => deck.setPlaybackRate(r)}
          height={90}
        />
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs font-barlow uppercase text-gray-400 tracking-wider">PITCH</div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={pitch01}
            onChange={(e) => void applyPitch(Number(e.target.value))}
            className="w-52"
            style={{ accentColor: color }}
            aria-label="Pitch"
          />
          <div className="text-xs font-barlow uppercase text-gray-400 tracking-wider">
            {(Math.round(((pitch01 - 0.5) * 16) * 10) / 10).toFixed(1)}%
          </div>
        </div>

        <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.25em]">
          BPM {bpm} • {deck.state.currentTime.toFixed(1)} / {deck.state.duration.toFixed(1)}
        </div>
      </div>
    </div>
  );
}

