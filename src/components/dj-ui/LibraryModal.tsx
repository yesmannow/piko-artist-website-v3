"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { tracks } from "@/lib/data";
import { useHaptic } from "@/hooks/useHaptic";
import {
  X,
  Search,
  Upload,
  ChevronLeft,
  ChevronRight,
  Music,
  Play,
  Pause,
} from "lucide-react";

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDeck: "A" | "B";
  onLoadTrack: (track: typeof tracks[0]) => void;
  currentTrack?: string | null;
}

export function LibraryModal({
  isOpen,
  onClose,
  targetDeck,
  onLoadTrack,
  currentTrack,
}: LibraryModalProps) {
  const { triggerHaptic } = useHaptic();
  const [searchQuery, setSearchQuery] = useState("");
  const [vibeFilter, setVibeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"title" | "artist" | "vibe">("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Helper function to check if coverArt is an image path
  const isImagePath = (coverArt: string): boolean => {
    return coverArt.startsWith("/");
  };

  // Filter and sort tracks
  const audioTracks = tracks
    .filter((track) => track.type === "audio")
    .filter((track) => {
      const matchesSearch =
        debouncedSearchQuery === "" ||
        track.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesVibe = vibeFilter === "all" || track.vibe === vibeFilter;
      return matchesSearch && matchesVibe;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "artist":
          comparison = a.artist.localeCompare(b.artist);
          break;
        case "vibe":
          comparison = a.vibe.localeCompare(b.vibe);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const handleTrackSelect = useCallback(
    (track: typeof tracks[0]) => {
      triggerHaptic();
      onLoadTrack(track);
      onClose();
    },
    [triggerHaptic, onLoadTrack, onClose]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div>
              <h2 className="text-2xl font-barlow uppercase tracking-wider text-white">
                TRACK LIBRARY
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Select track for Deck {targetDeck}
                {currentTrack && (
                  <span className="text-[#FFD700] ml-2">
                    • Currently: {currentTrack}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              aria-label="Close library"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Search and Filter Controls */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tracks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700] focus:ring-2 focus:ring-[#FFD700]/20 transition-colors"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-4">
                {/* Vibe Filter */}
                <div className="min-w-[120px]">
                  <select
                    value={vibeFilter}
                    onChange={(e) => setVibeFilter(e.target.value)}
                    className="w-full px-3 py-3 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#FFD700] focus:ring-2 focus:ring-[#FFD700]/20 transition-colors"
                  >
                    <option value="all">All Vibes</option>
                    <option value="chill">Chill</option>
                    <option value="hype">Hype</option>
                    <option value="storytelling">Storytelling</option>
                    <option value="classic">Classic</option>
                  </select>
                </div>

                {/* Sort Controls */}
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-3 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#FFD700] focus:ring-2 focus:ring-[#FFD700]/20 transition-colors"
                  >
                    <option value="title">Title</option>
                    <option value="artist">Artist</option>
                    <option value="vibe">Vibe</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="px-3 py-3 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white hover:border-[#FFD700] transition-colors"
                    title={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-400">
              {audioTracks.length} track{audioTracks.length !== 1 ? "s" : ""}
              {debouncedSearchQuery && ` matching "${debouncedSearchQuery}"`}
              {vibeFilter !== "all" && ` • ${vibeFilter}`}
            </div>
          </div>

          {/* Track Grid */}
          <div className="flex-1 overflow-y-auto max-h-96">
            <div className="p-6">
              {audioTracks.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-barlow uppercase text-gray-400 mb-2">
                    No tracks found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {audioTracks.map((track) => (
                    <motion.div
                      key={track.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`group relative p-4 bg-[#1a1a1a] border-2 rounded-lg cursor-pointer transition-all ${
                        currentTrack === track.title
                          ? "border-[#FFD700] bg-[#FFD700]/5"
                          : "border-gray-800 hover:border-gray-600"
                      }`}
                      onClick={() => handleTrackSelect(track)}
                    >
                      {/* Cover Art */}
                      <div className="relative w-full aspect-square mb-3 overflow-hidden rounded-lg bg-[#0a0a0a]">
                        {isImagePath(track.coverArt) ? (
                          <Image
                            src={track.coverArt}
                            alt={track.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div
                            className="w-full h-full bg-gradient-to-br"
                            style={{
                              background: track.coverArt.includes("from-")
                                ? `linear-gradient(135deg, var(--tw-gradient-stops))`
                                : track.coverArt,
                            }}
                          />
                        )}

                        {/* Play Indicator */}
                        {currentTrack === track.title && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <div className="flex items-center gap-2 text-[#FFD700]">
                              <Play className="w-8 h-8 fill-current" />
                              <span className="font-barlow uppercase font-bold text-sm">
                                LOADED
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Track Info */}
                      <div className="space-y-1">
                        <h3 className="font-barlow font-bold text-white text-lg leading-tight line-clamp-2">
                          {track.title}
                        </h3>
                        <p className="text-gray-400 text-sm">{track.artist}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-barlow uppercase text-gray-500 bg-gray-800 px-2 py-1 rounded">
                            {track.vibe}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
