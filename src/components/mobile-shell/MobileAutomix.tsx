"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getAudioEngine, ensureAudioEngineReady } from "@/engine/AudioEngine";
import { getAutomixEngine } from "@/engine/AutomixEngine";
import { useAudioStore } from "@/store/useAudioStore";
import { useAutomixStore } from "@/store/useAutomixStore";
import { tracks } from "@/lib/data";
import { Play, Pause, Shuffle, Power, Waves, Zap } from "lucide-react";

type DeckId = "deckA" | "deckB";

const swipeThreshold = 40;

export function MobileAutomix() {
  const audioTracks = useMemo(
    () => tracks.filter((t) => t.type === "audio"),
    [],
  );
  const [crossfade, setCrossfade] = useState(0.5);
  const [activeDeck, setActiveDeck] = useState<DeckId>("deckA");
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const {
    enabled,
    setEnabled,
    transitionDuration,
    setTransitionDuration,
    setMasterDeck,
  } = useAutomixStore();
  const deckState = useAudioStore((state) => state.decks);

  // Preload first two tracks
  useEffect(() => {
    const prime = async () => {
      const engine = await ensureAudioEngineReady();
      if (audioTracks[0]) {
        await engine.loadTrack("deckA", audioTracks[0].src);
      }
      if (audioTracks[1]) {
        await engine.loadTrack("deckB", audioTracks[1].src);
      }
      await engine.setCrossfader(0.5);
    };
    void prime();
  }, [audioTracks]);

  // Automix toggle side effect
  useEffect(() => {
    const engine = getAudioEngine();
    const automixEngine = getAutomixEngine();
    if (enabled) {
      const initial = audioTracks[0];
      if (initial) {
        void automixEngine.startAutomix(activeDeck, {
          id: initial.id,
          title: initial.title,
          artist: initial.artist,
          bpm: initial.bpm ?? undefined,
          camelot: initial.camelot ?? undefined,
          vibe: initial.vibe,
          type: initial.type,
          src: initial.src,
          duration: initial.duration ?? undefined,
        });
      }
    } else {
      automixEngine.stopAutomix();
      void engine.setVolume("deckA", 1);
      void engine.setVolume("deckB", 1);
    }
  }, [enabled, activeDeck, audioTracks]);

  const handleSwipe = (dx: number, dy: number) => {
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > swipeThreshold) {
      const delta = dx > 0 ? -0.1 : 0.1;
      const next = Math.min(1, Math.max(0, crossfade + delta));
      setCrossfade(next);
      void getAudioEngine().setCrossfader(next);
    } else if (dy < -swipeThreshold) {
      void getAudioEngine().pause(activeDeck);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    handleSwipe(dx, dy);
  };

  const togglePlay = async () => {
    const engine = await ensureAudioEngineReady();
    if (deckState[activeDeck]?.isPlaying) {
      await engine.pause(activeDeck);
    } else {
      await engine.play(activeDeck);
    }
  };

  const skip = async () => {
    const engine = await ensureAudioEngineReady();
    const nextDeck: DeckId = activeDeck === "deckA" ? "deckB" : "deckA";
    setActiveDeck(nextDeck);
    setMasterDeck(nextDeck);
    await engine.play(nextDeck);
  };

  return (
    <div
      className="md:hidden flex flex-col gap-4 bg-black text-white min-h-[calc(100vh-4rem)] p-4"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
            Mobile DJ
          </span>
          <span
            className={`inline-flex h-2 w-2 rounded-full ${enabled ? "bg-safety-yellow shadow-[0_0_10px_rgba(255,215,0,0.8)]" : "bg-white/40"}`}
          />
        </div>
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] border ${
            enabled
              ? "border-safety-yellow text-safety-yellow"
              : "border-white/30 text-white/70"
          }`}
        >
          <Power className="h-4 w-4" />
          Automix
        </button>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/60">
            Active Deck
          </span>
          <div className="text-lg font-semibold">
            {activeDeck === "deckA" ? "Deck A" : "Deck B"}
          </div>
        </div>
        <div className="flex gap-2">
          {(["deckA", "deckB"] as DeckId[]).map((deck) => (
            <button
              key={deck}
              type="button"
              onClick={() => {
                setActiveDeck(deck);
                setMasterDeck(deck);
              }}
              className={`rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] border ${
                deck === activeDeck
                  ? "border-safety-yellow text-safety-yellow"
                  : "border-white/20 text-white/70"
              }`}
            >
              {deck === "deckA" ? "Deck A" : "Deck B"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.18em] text-white/60">
            Transport
          </span>
          <span className="text-xs text-white/60">
            Swipe left/right to crossfade
          </span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={skip}
            className="rounded-full border border-white/20 p-3 text-white/80 hover:border-white/50"
          >
            <Shuffle className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="rounded-full bg-safety-yellow px-6 py-3 text-black font-bold uppercase tracking-[0.2em] flex items-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.4)]"
          >
            {deckState[activeDeck]?.isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
            {deckState[activeDeck]?.isPlaying ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => {
              const next = enabled ? Math.max(4, transitionDuration + 2) : 10;
              setTransitionDuration(next);
            }}
            className="rounded-full border border-white/20 p-3 text-white/80 hover:border-white/50"
          >
            <Zap className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Waves className="h-4 w-4 text-safety-yellow" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={crossfade}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setCrossfade(val);
              void getAudioEngine().setCrossfader(val);
            }}
            className="flex-1"
          />
          <span className="w-10 text-right text-xs text-white/60">
            {Math.round(crossfade * 100)}%
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.18em] text-white/60">
            Transition Time
          </span>
          <span className="text-xs text-white/60">{transitionDuration}s</span>
        </div>
        <input
          type="range"
          min={4}
          max={20}
          step={1}
          value={transitionDuration}
          onChange={(e) => setTransitionDuration(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>
    </div>
  );
}
