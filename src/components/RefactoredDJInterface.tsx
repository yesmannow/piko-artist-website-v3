"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ensureAudioEngineReady } from "@/engine/AudioEngine";
import { tracks, type MediaItem } from "@/lib/data";
import { TrackList } from "./TrackList";
import { WaveformPreview } from "./WaveformPreview";
import { DevAudioDebug } from "./DevAudioDebug";
import { useDeckMixerStore } from "@/store/useDeckMixerStore";
import { useAudioStore } from "@/store/useAudioStore";
import { Pause, Play } from "lucide-react";
import { useMIDI } from "@/lib/hooks/useMIDI";

type DeckId = "deckA" | "deckB";
type EQState = {
  low: number;
  mid: number;
  high: number;
};

interface DeckPanelProps {
  deckId: DeckId;
  track: MediaItem | null;
  duration: number;
  isPlaying: boolean;
  keyInfo: MediaItem["keyInfo"];
  onDropTrack: (trackId: string) => void;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (progress: number) => void;
}

function DeckPanel({
  deckId,
  track,
  duration,
  isPlaying,
  keyInfo,
  onDropTrack,
  onPlay,
  onPause,
  onSeek,
}: DeckPanelProps) {
  const [dragging, setDragging] = useState(false);
  const deckLabel = deckId === "deckA" ? "Deck A" : "Deck B";

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const payload = event.dataTransfer.getData("application/json");
    const fromText = event.dataTransfer.getData("text/plain");
    try {
      if (payload) {
        const parsed = JSON.parse(payload) as { trackId?: string };
        if (parsed?.trackId) {
          onDropTrack(parsed.trackId);
          return;
        }
      }
    } catch {
      // ignore parse errors, fallback to text payload
    }
    if (fromText) {
      onDropTrack(fromText);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const isImagePath = (cover?: string) => !!cover && cover.startsWith("/");

  return (
    <div
      className={[
        "flex flex-col gap-4 rounded-xl border-2 p-4 lg:p-6 transition-all duration-200",
        dragging
          ? "border-safety-yellow bg-black/60 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
          : "border-white/10 bg-black/40",
      ].join(" ")}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.28em] text-white/70">
            {deckLabel}
          </span>
          <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/60">
            Drag track here
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/70">
          <span
            className={`inline-flex h-2 w-2 rounded-full ${
              isPlaying
                ? "bg-safety-yellow shadow-[0_0_10px_rgba(255,215,0,0.8)]"
                : "bg-white/40"
            }`}
          />
          {isPlaying ? "Playing" : "Idle"}
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-3">
        <div className="relative h-16 w-16 overflow-hidden rounded-md border border-white/10 bg-black/60">
          {track && isImagePath(track.coverArt) ? (
            <Image
              src={track.coverArt}
              alt={track.title}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div
              className={[
                "h-full w-full bg-gradient-to-br",
                track?.coverArt ? track.coverArt : "from-zinc-700 to-zinc-900",
              ].join(" ")}
            />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-sm font-semibold text-white">
            {track ? track.title : "Drop a track to load"}
          </p>
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">
            {track ? track.artist : "Piko Catalog"}
          </p>
          {keyInfo?.camelot ? (
            <p className="text-[11px] uppercase tracking-[0.2em] text-safety-yellow">
              Key: {keyInfo.camelot}
              {keyInfo.root
                ? ` (${keyInfo.root}${keyInfo.scale === "minor" ? "m" : ""})`
                : ""}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPlay}
              className="inline-flex items-center gap-1 rounded border border-safety-yellow bg-safety-yellow px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-black hover:brightness-110"
            >
              <Play className="h-3 w-3" />
              Play
            </button>
            <button
              type="button"
              onClick={onPause}
              className="inline-flex items-center gap-1 rounded border border-white/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white hover:border-white/40"
            >
              <Pause className="h-3 w-3" />
              Pause
            </button>
          </div>
        </div>
        <div className="text-right text-xs text-white/60">
          <div>Len: {duration ? `${duration.toFixed(0)}s` : "--"}</div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/50 p-3">
        <WaveformPreview
          trackUrl={track?.src ?? null}
          onSeek={(progress) => onSeek(progress)}
          waveColor="#4B5563"
          progressColor="#FFD700"
          height={90}
        />
        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/60">
          Drag & drop tracks into this deck to update waveform and load audio
        </p>
      </div>
    </div>
  );
}

/**
 * Desktop studio surface with drag-and-drop track library + dual decks.
 * Tracks are loaded through AudioEngine; state is mirrored in Zustand for UI cues.
 */
export function RefactoredDJInterface() {
  const audioTracks = useMemo(
    () => tracks.filter((t) => t.type === "audio"),
    [],
  );
  const initialDecks = useMemo(
    () => ({
      deckA: audioTracks[0] ?? null,
      deckB: audioTracks[1] ?? audioTracks[0] ?? null,
    }),
    [audioTracks],
  );
  const [durations, setDurations] = useState<Record<DeckId, number>>({
    deckA: 0,
    deckB: 0,
  });

  const deckMeta = useDeckMixerStore((state) => state.decks);
  const keyWarning = useDeckMixerStore((state) => state.keyWarning);
  const allowKeyClash = useDeckMixerStore((state) => state.allowKeyClash);
  const toggleAllowKeyClash = useDeckMixerStore(
    (state) => state.toggleAllowKeyClash,
  );
  const loadTrackToDeck = useDeckMixerStore((state) => state.loadTrackToDeck);
  const playbackStore = useAudioStore((state) => ({
    deckA: state.decks.deckA,
    deckB: state.decks.deckB,
  }));

  const updateDuration = useCallback(async (deck: DeckId) => {
    const engine = await ensureAudioEngineReady();
    setDurations((prev) => ({ ...prev, [deck]: engine.getDuration(deck) }));
  }, []);
  const [, setCrossfade] = useState(0.5);

  const handleLoadTrack = useCallback(
    async (deck: DeckId, track: MediaItem) => {
      await loadTrackToDeck(deck, track);
      await updateDuration(deck);
    },
    [loadTrackToDeck, updateDuration],
  );

  const handleDropToDeck = useCallback(
    (deck: DeckId, trackId: string) => {
      const match = audioTracks.find((t) => t.id === trackId);
      if (match && match.type === "audio") {
        void handleLoadTrack(deck, match);
      }
    },
    [audioTracks, handleLoadTrack],
  );

  useEffect(() => {
    const prime = async () => {
      if (initialDecks.deckA) {
        await handleLoadTrack("deckA", initialDecks.deckA);
      }
      if (initialDecks.deckB) {
        await handleLoadTrack("deckB", initialDecks.deckB);
      }
    };
    void prime();
  }, [handleLoadTrack, initialDecks]);

  const handlePlay = async (deck: DeckId) => {
    const engine = await ensureAudioEngineReady();
    await engine.play(deck);
  };

  const handlePause = async (deck: DeckId) => {
    const engine = await ensureAudioEngineReady();
    await engine.pause(deck);
  };

  const handleSeek = async (deck: DeckId, progress: number) => {
    const engine = await ensureAudioEngineReady();
    const target = progress * (durations[deck] || 0);
    await engine.seek(deck, target);
  };

  // MIDI mapping: CC7 -> crossfader, CC20/21/22 -> Deck A EQ low/mid/high, CC23/24/25 -> Deck B EQ
  useMIDI((data) => {
    const [status, control, value] = data;
    const isCC = status === 176;
    const isNoteOn = status === 144;
    if (isCC && control === 7) {
      const v = value / 127;
      setCrossfade(v);
      void ensureAudioEngineReady().then((engine) => engine.setCrossfader(v));
    }
    if (isCC && control >= 20 && control <= 22) {
      const band: keyof EQState =
        control === 20 ? "low" : control === 21 ? "mid" : "high";
      const v = (value / 127) * 12 - 6; // +/-6dB-ish
      void ensureAudioEngineReady().then((engine) =>
        engine.setEQ("deckA", { [band]: v }),
      );
    }
    if (isCC && control >= 23 && control <= 25) {
      const band: keyof EQState =
        control === 23 ? "low" : control === 24 ? "mid" : "high";
      const v = (value / 127) * 12 - 6;
      void ensureAudioEngineReady().then((engine) =>
        engine.setEQ("deckB", { [band]: v }),
      );
    }
    if (isNoteOn && control === 60) {
      void ensureAudioEngineReady().then((engine) =>
        engine.triggerHotCue("deckA", 1),
      );
    }
    if (isNoteOn && control === 61) {
      void ensureAudioEngineReady().then((engine) =>
        engine.triggerHotCue("deckB", 1),
      );
    }
  });

  return (
    <>
      {process.env.NODE_ENV !== "production" ? (
        <DevAudioDebug intervalMs={800} />
      ) : null}
      {keyWarning ? (
        <div className="rounded-lg border border-amber-400/60 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.25)] flex items-center justify-between gap-3">
          <span>{keyWarning}</span>
          <label className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-amber-100">
            <input
              type="checkbox"
              checked={allowKeyClash}
              onChange={(e) => toggleAllowKeyClash(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-amber-300 bg-transparent text-amber-300 accent-amber-300"
            />
            Allow key clashes
          </label>
        </div>
      ) : null}
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
                Piko Catalog
              </p>
              <span className="rounded border border-safety-yellow px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-safety-yellow">
                Drag to load Decks
              </span>
            </div>
            <TrackList />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <DeckPanel
              deckId="deckA"
              track={deckMeta.deckA.track ?? initialDecks.deckA}
              duration={durations.deckA}
              isPlaying={playbackStore.deckA.isPlaying}
              keyInfo={
                deckMeta.deckA.keyInfo || deckMeta.deckA.track?.keyInfo || null
              }
              onDropTrack={(id) => handleDropToDeck("deckA", id)}
              onPlay={() => handlePlay("deckA")}
              onPause={() => handlePause("deckA")}
              onSeek={(p) => handleSeek("deckA", p)}
            />
            <DeckPanel
              deckId="deckB"
              track={deckMeta.deckB.track ?? initialDecks.deckB}
              duration={durations.deckB}
              isPlaying={playbackStore.deckB.isPlaying}
              keyInfo={
                deckMeta.deckB.keyInfo || deckMeta.deckB.track?.keyInfo || null
              }
              onDropTrack={(id) => handleDropToDeck("deckB", id)}
              onPlay={() => handlePlay("deckB")}
              onPause={() => handlePause("deckB")}
              onSeek={(p) => handleSeek("deckB", p)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
