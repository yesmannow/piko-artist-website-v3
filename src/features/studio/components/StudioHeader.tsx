"use client";

import { useCallback, useState } from "react";
import { Play, Pause, Download, Disc3, Mic } from "lucide-react";
import { useStudioStore } from "../stores/useStudioStore";
import { useTrackLoader } from "../hooks/useTrackLoader";
import { StudioEngine } from "../lib/StudioEngine";
import { ExportModal } from "./ExportModal";
import { TimelineEngine } from "../lib/TimelineEngine";
import { useVoiceoverRecorder } from "../hooks/useVoiceoverRecorder";

export function StudioHeader() {
  const [exportOpen, setExportOpen] = useState(false);
  const isPlaying = useStudioStore((s) => s.isPlaying);
  const timelineIsPlaying = useStudioStore((s) => s.timelineIsPlaying);
  const bpm = useStudioStore((s) => s.bpm);
  const activeDeck = useStudioStore((s) => s.activeDeck);
  const masterVolume = useStudioStore((s) => s.masterVolume);
  const deckTrackIds = useStudioStore((s) => s.deckTrackIds);
  const tracks = useStudioStore((s) => s.tracks);
  const timelineTracks = useStudioStore((s) => s.timelineTracks);

  const setPlaying = useStudioStore((s) => s.setPlaying);
  const setBpm = useStudioStore((s) => s.setBpm);
  const setActiveDeck = useStudioStore((s) => s.setActiveDeck);
  const setMasterVolume = useStudioStore((s) => s.setMasterVolume);
  const setTimelinePlaying = useStudioStore((s) => s.setTimelinePlaying);

  const { audioBuffer, isLoading, error, loadTrack } = useTrackLoader();
  const { isRecording, error: recordError, start: startRecording, stop: stopRecording } =
    useVoiceoverRecorder();

  const activeTrackId = deckTrackIds[activeDeck];
  const activeTrack = tracks.find((t) => t.id === activeTrackId) ?? tracks[0] ?? null;

  const handlePlayPause = useCallback(async () => {
    const engine = StudioEngine.getInstance();

    if (isPlaying) {
      if (activeTrack) engine.pauseTrack(activeTrack.id);
      setPlaying(false);
      return;
    }

    if (!activeTrack) return;

    // Load once, then reuse buffer for play/pause toggles.
    const buffer = audioBuffer ?? (await loadTrack(activeTrack.url));
    if (!buffer) return;

    // Set buffer as the default "other" stem until pre-separated stems are provided.
    await engine.initFromUserGesture();
    // TEMP (until pre-separated stems are provided):
    // Use the full mix buffer for all stems so the StemDeck controls audibly work.
    (["vocal", "drum", "bass", "other"] as const).forEach((stem) => {
      engine.setStemBuffer(activeTrack.id, stem, buffer);
    });

    // Apply current stem toggles + track volume to the audio graph.
    engine.setTrackVolume(activeTrack.id, activeTrack.volume);
    (Object.entries(activeTrack.stems) as Array<[keyof typeof activeTrack.stems, boolean]>).forEach(
      ([stem, enabled]) => {
        engine.setStemActive(activeTrack.id, stem, enabled);
      }
    );

    engine.playTrack(activeTrack.id);
    setPlaying(true);
  }, [activeTrack, audioBuffer, isPlaying, loadTrack, setPlaying]);

  const handleTimelinePlayPause = useCallback(async () => {
    const engine = TimelineEngine.getInstance();
    if (timelineIsPlaying) {
      engine.pause();
      setTimelinePlaying(false);
      return;
    }

    if (!timelineTracks.some((t) => t.clips.length > 0)) return;
    await engine.play(timelineTracks);
    setTimelinePlaying(true);
  }, [setTimelinePlaying, timelineIsPlaying, timelineTracks]);

  return (
    <header className="glass-panel w-full px-3 py-2 flex items-center gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handlePlayPause()}
          disabled={isLoading || !activeTrack}
          className="px-3 py-2 border border-white/10 bg-black/50 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        <button
          type="button"
          onClick={() => void handleTimelinePlayPause()}
          disabled={!timelineTracks.some((t) => t.clips.length > 0)}
          className={[
            "px-3 py-2 border border-white/10 bg-black/50 hover:bg-black/70",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            timelineIsPlaying ? "text-[#FFD700] border-[#FFD700]/40" : "text-white/80",
          ].join(" ")}
          aria-label={timelineIsPlaying ? "Pause timeline" : "Play timeline"}
          title="Timeline playback"
        >
          {timelineIsPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        <button
          type="button"
          onClick={() => void (isRecording ? stopRecording() : startRecording())}
          className={[
            "px-3 py-2 border border-white/10 bg-black/50 hover:bg-black/70 flex items-center gap-2",
            isRecording ? "text-red-300 border-red-500/40 shadow-[0_0_14px_rgba(239,68,68,0.25)]" : "text-white/80",
          ].join(" ")}
          aria-label={isRecording ? "Stop voiceover recording" : "Record voiceover"}
          title="Record voiceover (mic)"
        >
          <Mic className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-white/70">
          <Disc3 className="w-4 h-4" />
          <span className="uppercase tracking-wider">
            Deck {activeDeck} · {activeTrack?.id ?? "no-track"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-2">
        <button
          type="button"
          onClick={() => setActiveDeck("A")}
          className={`px-2 py-1 border text-xs font-bold ${
            activeDeck === "A"
              ? "border-[#FFD700] text-[#FFD700] bg-black/60"
              : "border-white/10 text-white/60 bg-black/40"
          }`}
        >
          A
        </button>
        <button
          type="button"
          onClick={() => setActiveDeck("B")}
          className={`px-2 py-1 border text-xs font-bold ${
            activeDeck === "B"
              ? "border-[#FFD700] text-[#FFD700] bg-black/60"
              : "border-white/10 text-white/60 bg-black/40"
          }`}
        >
          B
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-white/70">
          BPM
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-20 bg-black/50 border border-white/10 px-2 py-1 text-white"
          />
        </label>

        <label className="hidden md:flex items-center gap-2 text-xs text-white/70">
          Master
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setMasterVolume(v);
              StudioEngine.getInstance().setMasterVolume(v);
            }}
          />
        </label>

        <button
          type="button"
          onClick={() => setExportOpen(true)}
          className="px-3 py-2 border border-white/10 bg-black/50 hover:bg-black/70 text-white/80 flex items-center gap-2"
          aria-label="Export"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Export</span>
        </button>
      </div>

      {(error || isLoading) && (
        <div className="hidden lg:block ml-4 text-xs text-white/50 max-w-[320px] truncate">
          {isLoading ? "Loading audio…" : error}
        </div>
      )}

      {recordError && (
        <div className="hidden lg:block ml-4 text-xs text-red-200 max-w-[320px] truncate">
          {recordError}
        </div>
      )}

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </header>
  );
}

