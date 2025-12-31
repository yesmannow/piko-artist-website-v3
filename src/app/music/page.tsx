"use client";

import { useAudio } from "@/context/AudioContext";
import { tracks, MediaItem } from "@/lib/data";
import { Play, List, Grid3x3, LayoutList, Clock } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useHaptic } from "@/hooks/useHaptic";
import { useState, useEffect, useMemo } from "react";

// Helper to check if coverArt is an image path
const isImagePath = (coverArt: string): boolean => {
  return coverArt.startsWith("/");
};

// Format duration in MM:SS format
const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Get vibe badge color
const getVibeColor = (vibe: string): string => {
  switch (vibe) {
    case "chill":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "hype":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "storytelling":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "classic":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    default:
      return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  }
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
    };
  }, [track.src, track.type]);

  return duration;
}

// List View Track Item
function ListViewItem({ track, index, isActive, onPlay }: { track: MediaItem; index: number; isActive: boolean; onPlay: () => void }) {
  const duration = useTrackDuration(track);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={onPlay}
      className={`group relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:bg-zinc-900/50 ${
        isActive
          ? "border-toxic-lime bg-toxic-lime/10 shadow-[0_0_15px_rgba(204,255,0,0.2)]"
          : "border-zinc-800 hover:border-zinc-700"
      }`}
    >
      {/* Track Art */}
      <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-zinc-800">
        {isImagePath(track.coverArt) ? (
          <Image
            src={track.coverArt}
            alt={track.title}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-r ${track.coverArt}`} />
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-5 h-5 text-white" fill="currentColor" />
        </div>
        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-toxic-lime rounded-full animate-pulse" />
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3
            className={`font-header font-bold text-sm truncate ${
              isActive ? "text-toxic-lime" : "text-white"
            }`}
          >
            {track.title}
          </h3>
        </div>
        <p className="font-industrial text-zinc-400 text-xs truncate mb-1">
          {track.artist}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-industrial font-semibold uppercase border ${getVibeColor(
              track.vibe
            )}`}
          >
            {track.vibe}
          </span>
          {duration > 0 && (
            <span className="flex items-center gap-1 text-zinc-500 text-xs font-industrial">
              <Clock className="w-3 h-3" />
              {formatDuration(duration)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// List View Component (Two-column default)
function ListView({ tracks, currentTrack, onPlay }: { tracks: MediaItem[]; currentTrack: MediaItem | null; onPlay: (track: MediaItem) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {tracks.map((track, index) => {
        const isActive = currentTrack?.id === track.id;

        return (
          <ListViewItem
            key={track.id}
            track={track}
            index={index}
            isActive={isActive}
            onPlay={() => onPlay(track)}
          />
        );
      })}
    </div>
  );
}

// Card View Track Item
function CardViewItem({ track, index, isActive, onPlay }: { track: MediaItem; index: number; isActive: boolean; onPlay: () => void }) {
  const duration = useTrackDuration(track);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onPlay}
      className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 shadow-lg ${
        isActive
          ? "border-toxic-lime shadow-[0_0_20px_rgba(204,255,0,0.3)] ring-2 ring-toxic-lime"
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
              style={{
                filter: `drop-shadow(0 0 15px #ccff00)`,
              }}
            />
          </motion.div>
        </div>

        {/* Active Indicator */}
        {isActive && (
          <div className="absolute top-2 right-2 z-30">
            <div className="w-3 h-3 bg-toxic-lime rounded-full animate-pulse shadow-[0_0_8px_#ccff00]" />
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="p-3 md:p-4 bg-zinc-900 rounded-b-lg border-t-2 border-zinc-800/50">
        <h3
          className={`font-header font-bold text-sm md:text-base mb-1 truncate ${
            isActive ? "text-toxic-lime" : "text-white"
          }`}
        >
          {track.title}
        </h3>
        <p className="font-industrial text-zinc-400 text-xs md:text-sm truncate mb-2">
          {track.artist}
        </p>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className={`px-2 py-1 rounded text-[10px] font-industrial font-semibold uppercase border ${getVibeColor(
              track.vibe
            )}`}
          >
            {track.vibe}
          </span>
          {duration > 0 && (
            <span className="flex items-center gap-1 text-zinc-500 text-xs font-industrial">
              <Clock className="w-3 h-3" />
              {formatDuration(duration)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Card View Component (Grid)
function CardView({ tracks, currentTrack, onPlay }: { tracks: MediaItem[]; currentTrack: MediaItem | null; onPlay: (track: MediaItem) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {tracks.map((track, index) => {
        const isActive = currentTrack?.id === track.id;

        return (
          <CardViewItem
            key={track.id}
            track={track}
            index={index}
            isActive={isActive}
            onPlay={() => onPlay(track)}
          />
        );
      })}
    </div>
  );
}

// Compact View Track Item
function CompactViewItem({ track, index, isActive, onPlay }: { track: MediaItem; index: number; isActive: boolean; onPlay: () => void }) {
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
          <span className="text-zinc-500 text-xs font-industrial group-hover:hidden">
            {index + 1}
          </span>
        )}
        <Play
          className={`w-4 h-4 hidden group-hover:block ${
            isActive ? "text-toxic-lime" : "text-zinc-400"
          }`}
          fill={isActive ? "currentColor" : "none"}
        />
      </div>

      {/* Track Art - Small */}
      <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-zinc-800">
        {isImagePath(track.coverArt) ? (
          <Image
            src={track.coverArt}
            alt={track.title}
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-r ${track.coverArt}`} />
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h3
          className={`font-header font-bold text-sm truncate ${
            isActive ? "text-toxic-lime" : "text-white"
          }`}
        >
          {track.title}
        </h3>
        <p className="font-industrial text-zinc-400 text-xs truncate">
          {track.artist} • {track.vibe}
        </p>
      </div>

      {/* Duration */}
      {duration > 0 && (
        <div className="flex-shrink-0 text-zinc-500 text-xs font-industrial">
          {formatDuration(duration)}
        </div>
      )}
    </motion.div>
  );
}

// Compact View Component (Minimal list)
function CompactView({ tracks, currentTrack, onPlay }: { tracks: MediaItem[]; currentTrack: MediaItem | null; onPlay: (track: MediaItem) => void }) {
  return (
    <div className="space-y-1">
      {tracks.map((track, index) => {
        const isActive = currentTrack?.id === track.id;

        return (
          <CompactViewItem
            key={track.id}
            track={track}
            index={index}
            isActive={isActive}
            onPlay={() => onPlay(track)}
          />
        );
      })}
    </div>
  );
}

export default function MusicPage() {
  const { currentTrack, playTrack } = useAudio();
  const triggerHaptic = useHaptic();
  const [viewType, setViewType] = useState<ViewType>("list");

  // Filter to only audio tracks
  const audioTracks = useMemo(() => tracks.filter((t) => t.type === "audio"), []);

  const handlePlay = (track: MediaItem) => {
    triggerHaptic();
    playTrack(track);
  };

  const viewIcons = {
    list: List,
    card: Grid3x3,
    compact: LayoutList,
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-12 md:py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8 lg:mb-12">
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-header mb-3 md:mb-4 text-foreground">
                MUSIC LIBRARY
              </h1>
              <p className="text-foreground/60 font-industrial text-sm md:text-base tracking-wider">
                STREAMING • DOWNLOAD • SHARE
              </p>
            </div>

            {/* View Toggle Buttons */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {(["list", "card", "compact"] as ViewType[]).map((view) => {
                const Icon = viewIcons[view];
                const isActive = viewType === view;
                return (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setViewType(view)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 font-industrial text-sm uppercase tracking-wider ${
                      isActive
                        ? "border-toxic-lime bg-toxic-lime/10 text-toxic-lime shadow-[0_0_10px_rgba(204,255,0,0.2)]"
                        : "border-zinc-800 text-foreground/70 hover:border-zinc-700 hover:text-foreground"
                    }`}
                    aria-label={`Switch to ${view} view`}
                    aria-pressed={isActive}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{view}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Track Views */}
          {viewType === "list" && (
            <ListView tracks={audioTracks} currentTrack={currentTrack} onPlay={handlePlay} />
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
