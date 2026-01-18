"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Download,
  Headphones,
  Pause,
  Play,
  Share2,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { LibraryHeader, type LibraryView } from "@/components/LibraryHeader";
import { useAudio } from "@/context/AudioContext";
import { useHaptic } from "@/hooks/useHaptic";
import { tracks, MediaItem } from "@/lib/data";

const isImagePath = (coverArt: string): boolean => coverArt.startsWith("/");

function useImageFallback(initialSrc: string, theme: string) {
  const [src, setSrc] = useState(initialSrc);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    setSrc(initialSrc);
    setAttempted(false);
  }, [initialSrc]);

  const onError = () => {
    if (attempted) return;
    setAttempted(true);
    fetch(`/api/visuals?theme=${encodeURIComponent(theme)}&count=1`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => {
        const next = d?.images?.[0]?.src as string | undefined;
        if (next) setSrc(next);
      })
      .catch(() => {});
  };

  return { src, onError } as const;
}

const formatDuration = (seconds?: number | null): string => {
  if (!seconds || Number.isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const vibeColors: Record<string, string> = {
  chill: "bg-blue-500/20 text-blue-200 border-blue-400/40",
  hype: "bg-red-500/20 text-red-200 border-red-400/40",
  storytelling: "bg-purple-500/20 text-purple-200 border-purple-400/40",
  classic: "bg-amber-500/20 text-amber-100 border-amber-400/40",
};

function useTrackDuration(track: MediaItem | null) {
  const [duration, setDuration] = useState<number | null>(
    track?.duration ?? null,
  );

  useEffect(() => {
    if (track?.type !== "audio") return;
    if (track.duration) {
      setDuration(track.duration);
      return;
    }

    const audio = new Audio(track.src);
    const onLoaded = () => setDuration(audio.duration || null);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.load();

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [track]);

  return duration;
}

function CoverArt({
  track,
  className,
  priority = false,
}: {
  track: MediaItem;
  className?: string;
  priority?: boolean;
}) {
  const { src, onError } = useImageFallback(
    track.coverArt,
    "graffiti hip hop rap album cover street urban",
  );
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 ${className}`}
    >
      {isImagePath(track.coverArt) ? (
        <Image
          src={src}
          alt={track.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 320px"
          priority={priority}
          onError={onError}
        />
      ) : (
        <div className={`h-full w-full bg-gradient-to-br ${track.coverArt}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
    </div>
  );
}

function VibeBadge({ vibe }: { vibe: MediaItem["vibe"] }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
        vibeColors[vibe] || "border-white/20 text-white/70"
      }`}
    >
      {vibe}
    </span>
  );
}

function KeyBadge({ camelot }: { camelot?: string | null }) {
  if (!camelot) return null;
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
      Key {camelot}
    </span>
  );
}

function NowPlayingCard({
  track,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onShare,
  onDownload,
}: {
  track: MediaItem | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onShare: () => void;
  onDownload: () => void;
}) {
  const duration = useTrackDuration(track);
  if (!track) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b0f1c] via-[#0c1022] to-[#0e172a] p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.55)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(193,255,0,0.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(124,58,237,0.22),transparent_32%)]" />
      <div className="relative grid gap-6 lg:grid-cols-[320px,1fr] lg:items-center">
        <div className="relative">
          <CoverArt track={track} className="h-[280px] w-full" priority />
          <div className="absolute left-4 top-4 flex flex-col gap-2">
            <VibeBadge vibe={track.vibe} />
            <KeyBadge camelot={track.camelot} />
          </div>
          <AnimatePresence>
            {isPlaying ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#c1ff00]/20"
              />
            ) : null}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/70">
              Now Playing
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/70">
              Stream • Download • Share
            </span>
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
              {track.title}
            </h2>
            <p className="text-white/70 text-lg font-semibold">
              {track.artist}
            </p>
            <p className="flex items-center gap-2 text-sm text-white/60">
              <Clock className="h-4 w-4" />
              {formatDuration(duration)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onPlayPause}
              className="inline-flex items-center gap-3 rounded-full bg-[#c1ff00] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black shadow-[0_10px_30px_rgba(193,255,0,0.35)] transition-transform hover:scale-[1.02]"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Stream
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:border-[#c1ff00]/50"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:border-[#c1ff00]/50"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-[#c1ff00]" />
              <span className="text-sm text-white/70">Live signal ready</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onPrevious}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.16em]"
              >
                <SkipBack className="mr-1 h-3.5 w-3.5" />
                Prev
              </button>
              <button
                type="button"
                onClick={onNext}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.16em]"
              >
                Next
                <SkipForward className="ml-1 h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function TrackRow({
  track,
  index,
  isActive,
  onPlay,
  onShare,
  onDownload,
}: {
  track: MediaItem;
  index: number;
  isActive: boolean;
  onPlay: () => void;
  onShare: () => void;
  onDownload: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.25) }}
      className={`grid grid-cols-[60px_minmax(220px,1.4fr)_minmax(160px,1fr)_120px_110px_100px] items-center gap-4 px-4 py-3 text-sm ${
        isActive ? "bg-[#c1ff00]/5 text-[#c1ff00]" : "text-white/80"
      }`}
    >
      <button
        type="button"
        onClick={onPlay}
        className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition"
        aria-label={`Play ${track.title}`}
      >
        {isActive ? (
          <div className="flex items-end gap-0.5">
            {[0.25, 0.6, 0.4, 0.7].map((height, idx) => (
              <motion.span
                key={idx}
                className="w-0.5 bg-[#c1ff00]"
                animate={{ height: `${height * 100}%` }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: idx * 0.1,
                }}
              />
            ))}
          </div>
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>
      <div className="flex items-center gap-3 truncate">
        <div className="h-12 w-12 overflow-hidden rounded-lg border border-white/10 bg-white/5">
          <CoverArt track={track} className="h-full w-full" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{track.title}</p>
          <p className="truncate text-xs uppercase tracking-[0.18em] text-white/60">
            {track.artist}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <VibeBadge vibe={track.vibe} />
        <KeyBadge camelot={track.camelot} />
      </div>
      <div className="text-white/60">{formatDuration(track.duration)}</div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onShare}
          className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/80 hover:border-[#c1ff00]/40"
        >
          Share
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/80 hover:border-[#c1ff00]/40"
        >
          DL
        </button>
      </div>
      <div className="justify-self-end text-xs uppercase tracking-[0.2em] text-white/50">
        #{index + 1}
      </div>
    </motion.div>
  );
}

function TableListView({
  tracks,
  currentTrack,
  isPlaying,
  onPlay,
  onShare,
  onDownload,
}: {
  tracks: MediaItem[];
  currentTrack: MediaItem | null;
  isPlaying: boolean;
  onPlay: (track: MediaItem) => void;
  onShare: (track: MediaItem) => void;
  onDownload: (track: MediaItem) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
      <div className="grid grid-cols-[60px_minmax(220px,1.4fr)_minmax(160px,1fr)_120px_110px_100px] items-center gap-4 border-b border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-white/60">
        <span>Play</span>
        <span>Track</span>
        <span>Vibe / Key</span>
        <span>Length</span>
        <span>Actions</span>
        <span className="justify-self-end">#</span>
      </div>
      <div className="divide-y divide-white/5">
        {tracks.map((track, idx) => (
          <TrackRow
            key={track.id}
            track={track}
            index={idx}
            isActive={currentTrack?.id === track.id && isPlaying}
            onPlay={() => onPlay(track)}
            onShare={() => onShare(track)}
            onDownload={() => onDownload(track)}
          />
        ))}
      </div>
    </div>
  );
}

function CardGridView({
  tracks,
  currentTrack,
  onPlay,
  onShare,
}: {
  tracks: MediaItem[];
  currentTrack: MediaItem | null;
  onPlay: (track: MediaItem) => void;
  onShare: (track: MediaItem) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tracks.map((track, idx) => {
        const active = currentTrack?.id === track.id;
        return (
          <motion.article
            key={track.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className={`group relative overflow-hidden rounded-2xl border bg-white/5 ${
              active
                ? "border-[#c1ff00] shadow-[0_0_30px_rgba(193,255,0,0.35)]"
                : "border-white/10 hover:border-[#c1ff00]/40"
            }`}
          >
            <button
              type="button"
              onClick={() => onPlay(track)}
              className="absolute inset-0 z-10 focus:outline-none"
              aria-label={`Play ${track.title}`}
            />
            <div className="relative h-48 overflow-hidden">
              <CoverArt track={track} className="h-full w-full" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg">
                  <Play className="h-5 w-5" />
                </div>
              </div>
              <div className="absolute left-3 top-3 flex flex-col gap-2">
                <VibeBadge vibe={track.vibe} />
                <KeyBadge camelot={track.camelot} />
              </div>
            </div>
            <div className="space-y-2 p-4">
              <h3 className="truncate text-lg font-semibold text-white">
                {track.title}
              </h3>
              <p className="truncate text-xs uppercase tracking-[0.2em] text-white/60">
                {track.artist}
              </p>
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>{formatDuration(track.duration)}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(track);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 uppercase tracking-[0.18em] text-white/80 transition hover:border-[#c1ff00]/40"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

function CompactListView({
  tracks,
  currentTrack,
  onPlay,
}: {
  tracks: MediaItem[];
  currentTrack: MediaItem | null;
  onPlay: (track: MediaItem) => void;
}) {
  return (
    <div className="space-y-1.5">
      {tracks.map((track, idx) => {
        const active = currentTrack?.id === track.id;
        return (
          <motion.button
            key={track.id}
            type="button"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.01 }}
            onClick={() => onPlay(track)}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
              active
                ? "border-[#c1ff00] bg-[#c1ff00]/10 text-[#c1ff00]"
                : "border-white/10 bg-white/5 text-white/80 hover:border-[#c1ff00]/30"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              {active ? (
                <div className="flex items-end gap-0.5">
                  {[0.3, 0.6, 0.4].map((h, bar) => (
                    <motion.span
                      key={bar}
                      className="w-0.5 bg-[#c1ff00]"
                      animate={{ height: `${h * 100}%` }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    />
                  ))}
                </div>
              ) : (
                <Headphones className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-base font-semibold">{track.title}</p>
              <p className="truncate text-xs uppercase tracking-[0.18em] text-white/60">
                {track.artist} • {track.vibe}
              </p>
            </div>
            <span className="text-xs text-white/60">
              {formatDuration(track.duration)}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

export default function MusicPage() {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    skipNext,
    skipPrevious,
  } = useAudio();
  const { triggerHaptic } = useHaptic();
  const [viewType, setViewType] = useState<LibraryView>("list");

  const audioTracks = useMemo(
    () => tracks.filter((t) => t.type === "audio"),
    [],
  );

  const vibeList = useMemo(
    () =>
      Array.from(new Set(audioTracks.map((t) => t.vibe.toUpperCase()))).sort(),
    [audioTracks],
  );

  const featuredTrack =
    currentTrack?.type === "audio" ? currentTrack : (audioTracks[0] ?? null);

  const handlePlay = (track: MediaItem) => {
    triggerHaptic();
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  const handleShare = async (track: MediaItem) => {
    triggerHaptic();
    try {
      const shareUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/music`
          : undefined;
      if (navigator.share && shareUrl) {
        await navigator.share({
          title: track.title,
          text: `${track.title} — ${track.artist}`,
          url: shareUrl,
        });
      } else if (navigator.clipboard && shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (shareUrl) {
        window.open(shareUrl, "_blank", "noopener");
      }
    } catch {
      // Silent fallback
    }
  };

  const handleDownload = (track: MediaItem) => {
    triggerHaptic();
    if (typeof window === "undefined") return;
    const link = document.createElement("a");
    link.href = track.src;
    link.download = `${track.title}.mp3`;
    link.rel = "noopener";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(193,255,0,0.12),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(124,58,237,0.18),transparent_32%),radial-gradient(circle_at_50%_80%,rgba(34,211,238,0.12),transparent_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:120px_120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <LibraryHeader
          view={viewType}
          onViewChange={setViewType}
          tracksCount={audioTracks.length}
          vibes={vibeList}
          lastSession={currentTrack?.title ?? null}
        />

        <NowPlayingCard
          track={featuredTrack}
          isPlaying={
            Boolean(featuredTrack) &&
            Boolean(currentTrack?.id === featuredTrack?.id && isPlaying)
          }
          onPlayPause={() => featuredTrack && handlePlay(featuredTrack)}
          onNext={() => {
            triggerHaptic();
            skipNext();
          }}
          onPrevious={() => {
            triggerHaptic();
            skipPrevious();
          }}
          onShare={() => featuredTrack && handleShare(featuredTrack)}
          onDownload={() => featuredTrack && handleDownload(featuredTrack)}
        />

        {viewType === "list" ? (
          <TableListView
            tracks={audioTracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onShare={handleShare}
            onDownload={handleDownload}
          />
        ) : null}

        {viewType === "card" ? (
          <CardGridView
            tracks={audioTracks}
            currentTrack={currentTrack}
            onPlay={handlePlay}
            onShare={handleShare}
          />
        ) : null}

        {viewType === "compact" ? (
          <CompactListView
            tracks={audioTracks}
            currentTrack={currentTrack}
            onPlay={handlePlay}
          />
        ) : null}
      </div>
    </div>
  );
}
