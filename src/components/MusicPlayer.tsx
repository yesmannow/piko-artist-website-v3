"use client";

import { useAudio } from "@/context/AudioContext";
import { MediaItem } from "@/lib/data";
import { Play, Pause, List, Grid3x3, LayoutList, Clock, SkipForward, SkipBack } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useHaptic } from "@/hooks/useHaptic";
import { useState, useEffect, useMemo } from "react";

// Helper to check if coverArt is an image path (local or remote URL)
const isImagePath = (coverArt: string): boolean =>
  coverArt.startsWith("/") || coverArt.startsWith("http");

// Format duration in MM:SS format
const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Get vibe badge color
const vibeColors: Record<string, string> = {
  chill: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  hype: "bg-red-500/20 text-red-400 border-red-500/30",
  storytelling: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  classic: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

type ViewType = "list" | "card" | "compact";

// Track duration hook
function useTrackDuration(track: MediaItem): number {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (track.type !== "audio") {
      setDuration(0);
      return;
    }

    const audio = new Audio(track.src);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.load();

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      // Cancel any in-flight metadata fetch to avoid AbortError rejections
      audio.src = "";
      audio.load();
    };
  }, [track.src, track.type]);

  return duration;
}

// Cover Art Component – uses next/image for remote/local image paths
function CoverArt({
  coverArt,
  alt,
  className,
  sizes,
  priority,
}: {
  coverArt: string;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative flex-shrink-0 rounded overflow-hidden bg-zinc-800 ${className || ""}`}>
      {isImagePath(coverArt) ? (
        <Image
          src={coverArt}
          alt={alt ?? ""}
          fill
          className="object-cover"
          sizes={sizes ?? "40px"}
          priority={priority}
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-r ${coverArt}`} />
      )}
    </div>
  );
}

// Hero Section for Currently Playing Track
function TrackHero({
  track,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
}: {
  track: MediaItem | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const duration = useTrackDuration(
    track ?? ({ type: "audio", src: "", title: "", coverArt: "", vibe: "chill" } as MediaItem)
  );

  if (!track) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-8 md:mb-12 rounded-xl overflow-hidden border-2 border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 p-6 md:p-8 lg:p-12">
        {/* Left: Large Cover Art */}
        <motion.div
          className="relative aspect-square w-full max-w-md mx-auto lg:max-w-none"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative w-full h-full rounded-lg overflow-hidden bg-zinc-900 shadow-2xl">
            {isImagePath(track.coverArt) ? (
              <Image
                src={track.coverArt}
                alt={track.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-r ${track.coverArt}`} />
            )}
            {/* Animated overlay when playing */}
            <AnimatePresence>
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-toxic-lime mix-blend-overlay"
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right: Track Info & Controls */}
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <div className="mb-2">
              <span
                className={`inline-block px-3 py-1 rounded-full border text-xs font-industrial font-bold tracking-wider uppercase ${
                  vibeColors[track.vibe] ?? vibeColors.chill
                }`}
              >
                {track.vibe}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-header mb-3 text-foreground">
              {track.title}
            </h2>
            <p className="text-xl md:text-2xl font-industrial text-foreground/80 mb-4 font-medium">
              {track.artist}
            </p>
            {duration > 0 && (
              <div className="flex items-center gap-2 text-foreground/60 font-industrial">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(duration)}</span>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={onPrevious}
              className="p-3 rounded-full border-2 border-zinc-700 hover:border-toxic-lime transition-colors"
              aria-label="Previous track"
            >
              <SkipBack className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={isPlaying ? onPause : onPlay}
              className="relative p-6 rounded-full bg-toxic-lime text-black hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,215,0,0.5)]"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" fill="currentColor" />
              ) : (
                <Play className="w-8 h-8" fill="currentColor" />
              )}
            </button>
            <button
              onClick={onNext}
              className="p-3 rounded-full border-2 border-zinc-700 hover:border-toxic-lime transition-colors"
              aria-label="Next track"
            >
              <SkipForward className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Glow effect when playing */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle at center, rgba(255,215,0,0.1) 0%, transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Table Row Item Component
function TableRowItem({
  track,
  index,
  isActive,
  onPlay,
}: {
  track: MediaItem;
  index: number;
  isActive: boolean;
  onPlay: () => void;
}) {
  const duration = useTrackDuration(track);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.25) }}
      onClick={onPlay}
      className={[
        "group w-full text-left",
        "grid grid-cols-[56px_minmax(260px,1.6fr)_minmax(160px,1fr)_120px_72px]",
        "px-4 py-3 md:py-4",
        "hover:bg-foreground/5 transition-colors",
        isActive ? "text-toxic-lime" : "text-foreground",
      ].join(" ")}
    >
      {/* Col 1: Index / Play icon / Active Equalizer */}
      <div className="relative flex items-center justify-center">
        {isActive ? (
          <div className="flex items-end gap-0.5 h-4">
            {[0.3, 0.6, 0.4, 0.8, 0.5].map((height, eqIdx) => (
              <motion.div
                key={eqIdx}
                className="w-0.5 bg-toxic-lime rounded-t"
                animate={{ height: `${height * 100}%` }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: eqIdx * 0.1,
                  ease: "easeInOut",
                }}
                style={{ boxShadow: "0 0 4px #FFD700" }}
              />
            ))}
          </div>
        ) : (
          <>
            <span
              className={[
                "text-sm font-industrial font-bold",
                "group-hover:opacity-0 transition-opacity",
                "opacity-100 text-white/70",
              ].join(" ")}
            >
              {index + 1}
            </span>
            <span
              className={["absolute", "opacity-0 group-hover:opacity-100 transition-opacity"].join(" ")}
              aria-hidden="true"
            >
              <Play className="w-4 h-4" fill="currentColor" />
            </span>
          </>
        )}
      </div>

      {/* Col 2: Cover + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <CoverArt coverArt={track.coverArt} alt={track.title} className="w-10 h-10" sizes="40px" />
        <div className="min-w-0">
          <div
            className={[
              "truncate font-industrial font-semibold uppercase tracking-tight text-sm md:text-base",
              isActive ? "text-toxic-lime" : "text-foreground",
            ].join(" ")}
          >
            {track.title}
          </div>
        </div>
      </div>

      {/* Col 3: Artist */}
      <div className={["flex items-center", isActive ? "text-toxic-lime/80" : "text-foreground/80"].join(" ")}>
        <span className="truncate text-sm font-medium">{track.artist}</span>
      </div>

      {/* Col 4: Vibe badge */}
      <div className="flex items-center">
        <span
          className={[
            "px-3 py-1 rounded-full border text-[11px] font-industrial font-bold tracking-[0.2em] uppercase",
            vibeColors[track.vibe] ?? vibeColors.chill,
          ].join(" ")}
        >
          {track.vibe}
        </span>
      </div>

      {/* Col 5: Duration */}
      <div
        className={[
          "flex items-center justify-end text-sm font-mono",
          isActive ? "text-toxic-lime/80" : "text-foreground/70",
        ].join(" ")}
      >
        {duration > 0 ? formatDuration(duration) : "0:00"}
      </div>
    </motion.button>
  );
}

// Table List View
function TableListView({
  tracks,
  currentTrack,
  isPlaying,
  onPlay,
}: {
  tracks: MediaItem[];
  currentTrack: MediaItem | null;
  isPlaying: boolean;
  onPlay: (track: MediaItem) => void;
}) {
  return (
    <div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 md:mx-0">
      <div className="min-w-[min(100%,760px)] rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm overflow-hidden mx-4 md:mx-0">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-black/70 backdrop-blur-md border-b border-white/10">
          <div className="grid grid-cols-[56px_minmax(260px,1.6fr)_minmax(160px,1fr)_120px_72px] px-4 py-3 text-xs tracking-[0.25em] text-white/60 font-industrial font-bold">
            <div>#</div>
            <div>TITLE</div>
            <div>ARTIST</div>
            <div>VIBE</div>
            <div className="text-right">TIME</div>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/10">
          {tracks.map((track, idx) => {
            const isActive = currentTrack?.id === track.id && isPlaying;
            return (
              <TableRowItem
                key={track.id}
                track={track}
                index={idx}
                isActive={isActive}
                onPlay={() => onPlay(track)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Card View Item
function CardViewItem({
  track,
  index,
  isActive,
  onPlay,
}: {
  track: MediaItem;
  index: number;
  isActive: boolean;
  onPlay: () => void;
}) {
  const duration = useTrackDuration(track);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onPlay}
      className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 shadow-lg ${
        isActive
          ? "border-toxic-lime shadow-[0_0_20px_rgba(255,215,0,0.3)] ring-2 ring-toxic-lime"
          : "border-zinc-800 hover:border-toxic-lime/50 hover:shadow-xl"
      }`}
    >
      {/* Cover Art */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-900 rounded-t-lg">
        {isImagePath(track.coverArt) ? (
          <motion.div
            className="relative w-full h-full"
            whileHover={{ scale: 1.08, y: -4 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Image
              src={track.coverArt}
              alt={track.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </motion.div>
        ) : (
          <motion.div
            className={`w-full h-full bg-gradient-to-r ${track.coverArt}`}
            whileHover={{ scale: 1.08, y: -4 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        )}

        {/* Hover Overlay with Play Button */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-30">
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-toxic-lime/30 rounded-full blur-xl animate-pulse" />
            <Play
              className="relative w-16 h-16 text-white"
              fill="currentColor"
              style={{ filter: "drop-shadow(0 0 15px #FFD700)" }}
            />
          </motion.div>
        </div>

        {/* Active Indicator */}
        {isActive && (
          <div className="absolute top-2 right-2 z-30">
            <div className="w-3 h-3 bg-toxic-lime rounded-full animate-pulse shadow-[0_0_8px_#FFD700]" />
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="p-3 md:p-4 bg-zinc-900 rounded-b-lg border-t-2 border-zinc-800/50">
        <h3
          className={`font-header font-semibold text-sm md:text-base mb-1 truncate tracking-tight ${
            isActive ? "text-toxic-lime" : "text-white"
          }`}
        >
          {track.title}
        </h3>
        <p className="font-industrial text-zinc-300 text-xs md:text-sm truncate mb-2">{track.artist}</p>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className={`px-2 py-1 rounded text-[10px] font-industrial font-semibold uppercase border ${
              vibeColors[track.vibe] ?? vibeColors.chill
            }`}
          >
            {track.vibe}
          </span>
          {duration > 0 && (
            <span className="flex items-center gap-1 text-zinc-400 text-xs font-industrial">
              <Clock className="w-3 h-3" />
              {formatDuration(duration)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Card View Grid
function CardView({
  tracks,
  currentTrack,
  onPlay,
}: {
  tracks: MediaItem[];
  currentTrack: MediaItem | null;
  onPlay: (track: MediaItem) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {tracks.map((track, index) => (
        <CardViewItem
          key={track.id}
          track={track}
          index={index}
          isActive={currentTrack?.id === track.id}
          onPlay={() => onPlay(track)}
        />
      ))}
    </div>
  );
}

// Compact View Track Item
function CompactViewItem({
  track,
  index,
  isActive,
  onPlay,
}: {
  track: MediaItem;
  index: number;
  isActive: boolean;
  onPlay: () => void;
}) {
  const duration = useTrackDuration(track);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.01 }}
      onClick={onPlay}
      className={`group relative flex items-center gap-3 p-2 rounded-md transition-all duration-150 cursor-pointer ${
        isActive
          ? "bg-toxic-lime/10 border-l-2 border-toxic-lime"
          : "hover:bg-zinc-900/50 border-l-2 border-transparent"
      }`}
    >
      {/* Track Number / Play Icon */}
      <div className="w-6 flex-shrink-0 flex items-center justify-center">
        {isActive ? (
          <div className="w-4 h-4 bg-toxic-lime rounded-full animate-pulse" />
        ) : (
          <span className="text-zinc-400 text-xs font-industrial group-hover:hidden">{index + 1}</span>
        )}
        <Play
          className={`w-4 h-4 hidden group-hover:block ${isActive ? "text-toxic-lime" : "text-zinc-300"}`}
          fill={isActive ? "currentColor" : "none"}
        />
      </div>

      {/* Track Art */}
      <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-zinc-800">
        {isImagePath(track.coverArt) ? (
          <Image src={track.coverArt} alt={track.title} fill className="object-cover" sizes="40px" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-r ${track.coverArt}`} />
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h3
          className={`font-header font-semibold text-sm truncate tracking-tight ${
            isActive ? "text-toxic-lime" : "text-white"
          }`}
        >
          {track.title}
        </h3>
        <p className="font-industrial text-zinc-300 text-xs truncate">
          {track.artist} • {track.vibe}
        </p>
      </div>

      {/* Duration */}
      {duration > 0 && (
        <div className="flex-shrink-0 text-zinc-400 text-xs font-industrial">{formatDuration(duration)}</div>
      )}
    </motion.div>
  );
}

// Compact View List
function CompactView({
  tracks,
  currentTrack,
  onPlay,
}: {
  tracks: MediaItem[];
  currentTrack: MediaItem | null;
  onPlay: (track: MediaItem) => void;
}) {
  return (
    <div className="space-y-1">
      {tracks.map((track, index) => (
        <CompactViewItem
          key={track.id}
          track={track}
          index={index}
          isActive={currentTrack?.id === track.id}
          onPlay={() => onPlay(track)}
        />
      ))}
    </div>
  );
}

/**
 * MusicPlayer — the interactive client component for the music page.
 *
 * Receives the pre-fetched vault tracks as a prop (or falls back to the
 * static tracks). On mount it registers the list with the AudioContext so
 * the global persistent player's skip buttons navigate within the same set.
 */
export function MusicPlayer({ tracks }: { tracks: MediaItem[] }) {
  const { currentTrack, isPlaying, playTrack, togglePlay, skipNext, skipPrevious, setPlaylist } =
    useAudio();
  const { triggerHaptic } = useHaptic();
  const [viewType, setViewType] = useState<ViewType>("list");

  // Sync vault tracks into the AudioContext playlist once on mount / when tracks change
  useEffect(() => {
    if (tracks.length > 0) {
      setPlaylist(tracks);
    }
  }, [tracks, setPlaylist]);

  // Only audio tracks are shown in the player list
  const audioTracks = useMemo(() => tracks.filter((t) => t.type === "audio"), [tracks]);

  const handlePlay = (track: MediaItem) => {
    triggerHaptic();
    playTrack(track);
  };

  const handleHeroPlayPause = () => {
    triggerHaptic();

    if (!featuredTrack) return;

    if (!currentTrack || currentTrack.id !== featuredTrack.id) {
      playTrack(featuredTrack);
      return;
    }

    togglePlay();
  };

  const viewIcons = { list: List, card: Grid3x3, compact: LayoutList };

  // Featured track: currently playing, or the first vault track
  const featuredTrack = currentTrack || audioTracks[0] || null;

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-12 md:py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 md:mb-12">
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-header mb-3 md:mb-4 text-foreground">
                MUSIC LIBRARY
              </h1>
              <p className="text-foreground/70 font-industrial text-sm md:text-base tracking-normal font-medium">
                STREAMING • DOWNLOAD • SHARE
              </p>
            </div>

            {/* View Toggle Buttons */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {(["list", "card", "compact"] as ViewType[]).map((view) => {
                const Icon = viewIcons[view];
                const isViewActive = viewType === view;
                return (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setViewType(view)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 font-industrial text-sm uppercase tracking-wider ${
                      isViewActive
                        ? "border-toxic-lime bg-toxic-lime/10 text-toxic-lime shadow-[0_0_10px_rgba(255,215,0,0.2)]"
                        : "border-zinc-800 text-foreground/70 hover:border-zinc-700 hover:text-foreground"
                    }`}
                    aria-label={`Switch to ${view} view`}
                    aria-pressed={isViewActive}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{view}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hero Section – Currently Playing Track */}
          <TrackHero
            track={featuredTrack}
            isPlaying={isPlaying && currentTrack?.id === featuredTrack?.id}
            onPlay={handleHeroPlayPause}
            onPause={handleHeroPlayPause}
            onNext={() => {
              triggerHaptic();
              skipNext();
            }}
            onPrevious={() => {
              triggerHaptic();
              skipPrevious();
            }}
          />

          {/* Track Views */}
          {viewType === "list" && (
            <TableListView
              tracks={audioTracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlay={handlePlay}
            />
          )}
          {viewType === "card" && (
            <CardView tracks={audioTracks} currentTrack={currentTrack} onPlay={handlePlay} />
          )}
          {viewType === "compact" && (
            <CompactView tracks={audioTracks} currentTrack={currentTrack} onPlay={handlePlay} />
          )}
        </div>
      </section>
    </div>
  );
}
