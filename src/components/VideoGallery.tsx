"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MediaItem, tracks } from "@/lib/data";
import { CinemaModal } from "./CinemaModal";

interface VideoGalleryProps {
  featuredOnly?: boolean;
}

export function VideoGallery({ featuredOnly = false }: VideoGalleryProps) {
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(null);

  const videos = tracks.filter((t) => t.type === "video");
  const visibleVideos = featuredOnly ? videos.slice(0, 3) : videos;

  return (
    <>
      {featuredOnly ? (
        <>
          {/* TV Stack Masonry Layout - Home Featured Mode */}
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 md:gap-6">
            {visibleVideos.map((video, index) => {
              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="break-inside-avoid mb-4 md:mb-6 group cursor-pointer"
                  onClick={() => setSelectedVideo(video)}
                >
                  {/* TV Frame */}
                  <div className="relative bg-gray-800 rounded-lg p-3 md:p-4 shadow-2xl">
                    {/* TV Screen */}
                    <div className="relative aspect-video bg-black rounded overflow-hidden">
                      {/* Thumbnail - Standby Mode (B&W + Grain) */}
                      <div className="relative w-full h-full">
                        <Image
                          src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                          alt={video.title}
                          fill
                          className="object-cover transition-all duration-500 group-hover:grayscale-0 group-hover:contrast-100 grayscale contrast-125"
                          unoptimized
                        />
                        {/* Grain overlay - disappears on hover */}
                        <div
                          className="absolute inset-0 opacity-100 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`,
                            mixBlendMode: "overlay",
                          }}
                        />
                      </div>

                      {/* Chromatic Aberration on Hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div
                          className="absolute inset-0 mix-blend-screen"
                          style={{
                            background: `linear-gradient(90deg,
                              transparent 0%,
                              rgba(255, 0, 0, 0.3) 25%,
                              transparent 50%,
                              rgba(0, 255, 0, 0.3) 75%,
                              transparent 100%)`,
                            transform: "translateX(-2px)",
                          }}
                        />
                        <div
                          className="absolute inset-0 mix-blend-screen"
                          style={{
                            background: `linear-gradient(90deg,
                              transparent 0%,
                              rgba(0, 0, 255, 0.3) 25%,
                              transparent 50%,
                              rgba(255, 0, 255, 0.3) 75%,
                              transparent 100%)`,
                            transform: "translateX(2px)",
                          }}
                        />
                      </div>

                      {/* Play Icon Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-16 h-16 rounded-full bg-neon-green/90 flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-black ml-1"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Tape Label */}
                    <div className="mt-3 flex justify-center">
                      <motion.div
                        className="bg-white px-4 py-2 rounded shadow-lg"
                        style={{ transform: "rotate(-2deg)" }}
                        whileHover={{ rotate: "-1deg", scale: 1.05 }}
                      >
                        <p className="font-tag text-black text-sm md:text-base font-bold">
                          {video.title}
                        </p>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/videos"
              className="px-6 py-3 rounded-full border border-neon-green/50 bg-neon-green/10 text-neon-green font-tag tracking-wider hover:bg-neon-green/20 transition-colors"
            >
              Watch All Visuals
            </Link>
          </div>
        </>
      ) : (
        <>
          {/* Video Feed Layout - Full Archive Mode */}
          <div className="flex flex-col gap-10">
            {visibleVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.25) }}
                viewport={{ once: true }}
                className="group"
              >
                <button
                  type="button"
                  onClick={() => setSelectedVideo(video)}
                  className="w-full text-left"
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
                    <Image
                      src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                      alt={video.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      unoptimized
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-neon-green/90 flex items-center justify-center shadow-lg">
                        <svg
                          className="w-8 h-8 text-black ml-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-tag text-xl md:text-2xl text-white">
                        {video.title}
                      </h3>
                      <span className="px-3 py-1 rounded-full border text-[11px] font-tag tracking-[0.2em] uppercase bg-white/5 text-white/80 border-white/15">
                        {video.vibe}
                      </span>
                    </div>
                    <p className="mt-2 text-sm md:text-base text-white/60">
                      {video.artist} • Official Visual • {video.vibe} energy
                    </p>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Cinema Modal */}
      {selectedVideo && (
        <CinemaModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </>
  );
}

