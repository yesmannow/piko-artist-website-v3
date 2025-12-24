"use client";

import { useAudio } from "@/context/AudioContext";
import { tracks } from "@/lib/data";
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
          <div className="mb-6 md:mb-8 lg:mb-12 text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-header mb-3 md:mb-4 text-foreground">
              MUSIC LIBRARY
            </h1>
            <p className="text-foreground/60 font-industrial text-sm md:text-base tracking-wider">
              STREAMING • DOWNLOAD • SHARE
            </p>
          </div>

          {/* Track Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {audioTracks.map((track, index) => {
              const isActive = currentTrack?.id === track.id;

              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 shadow-lg ${
                    isActive
                      ? "border-toxic-lime shadow-[0_0_20px_rgba(204,255,0,0.3)] ring-2 ring-toxic-lime"
                      : "border-zinc-800 hover:border-toxic-lime/50 hover:shadow-xl"
                  }`}
                  style={{
                    boxShadow: isActive
                      ? "0 4px 6px rgba(0,0,0,0.1), 0 0 20px rgba(204,255,0,0.3)"
                      : "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                  onClick={() => {
                    triggerHaptic();
                    playTrack(track);
                  }}
                >
                  {/* Cover Art */}
                  <div className="relative aspect-square w-full overflow-hidden bg-zinc-900 rounded-t-lg">
                    {/* Graffiti Texture Overlay - Subtle */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none z-10"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='graffiti'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23graffiti)' opacity='0.3'/%3E%3C/svg%3E")`,
                        mixBlendMode: "overlay",
                      }}
                    />

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

                    {/* Dark-to-Bright Gradient Overlay on Hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20"
                      initial={false}
                    />

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
                    <p className="font-industrial text-zinc-400 text-xs md:text-sm truncate">{track.artist}</p>
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
