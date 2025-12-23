"use client";

import { useAudio } from "@/context/AudioContext";
import { tracks, MediaItem } from "@/lib/data";
import { Play } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useHaptic } from "@/hooks/useHaptic";

// Helper to check if coverArt is an image path
const isImagePath = (coverArt: string): boolean => {
  return coverArt.startsWith("/");
};

export default function MusicPage() {
  const { currentTrack, playTrack } = useAudio();
  const triggerHaptic = useHaptic();

  // Filter to only audio tracks
  const audioTracks = tracks.filter((t) => t.type === "audio");

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-12 md:py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 md:mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-graffiti mb-4 bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-transparent">
              MUSIC LIBRARY
            </h1>
            <p className="text-foreground/60 font-industrial text-sm md:text-base tracking-wider">
              STREAMING • DOWNLOAD • SHARE
            </p>
          </div>

          {/* Track Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {audioTracks.map((track, index) => {
              const isActive = currentTrack?.id === track.id;

              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    isActive
                      ? "border-toxic-lime shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                      : "border-zinc-800 hover:border-zinc-700"
                  }`}
                  onClick={() => {
                    triggerHaptic();
                    playTrack(track);
                  }}
                >
                  {/* Cover Art */}
                  <div className="relative aspect-square w-full overflow-hidden bg-zinc-900">
                    {isImagePath(track.coverArt) ? (
                      <Image
                        src={track.coverArt}
                        alt={track.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-r ${track.coverArt}`}
                      />
                    )}

                    {/* Hover Overlay with Play Button */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-toxic-lime/20 rounded-full blur-xl" />
                        <Play
                          className="relative w-16 h-16 text-white"
                          fill="currentColor"
                          style={{
                            filter: `drop-shadow(0 0 10px #ccff00)`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-toxic-lime rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="p-4 bg-zinc-900">
                    <h3
                      className={`font-bold text-base md:text-lg mb-1 truncate ${
                        isActive ? "text-toxic-lime" : "text-white"
                      }`}
                    >
                      {track.title}
                    </h3>
                    <p className="text-zinc-400 text-sm truncate">{track.artist}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
