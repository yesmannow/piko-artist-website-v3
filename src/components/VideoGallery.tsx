"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { tracks } from "@/lib/data";
import { useVideo } from "@/context/VideoContext";

interface VideoGalleryProps {
  featuredOnly?: boolean;
}

export function VideoGallery({ featuredOnly = false }: VideoGalleryProps) {
  const { playVideo } = useVideo();

  const videos = tracks.filter((t) => t.type === "video");
  const visibleVideos = featuredOnly ? videos.slice(0, 3) : videos;

  // Generate fake duration for YouTube-style timestamp
  const getFakeDuration = (index: number) => {
    const durations = ["3:45", "4:12", "2:58", "5:23", "3:19", "4:56", "2:34", "3:47"];
    return durations[index % durations.length];
  };

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
                  onClick={() => playVideo(video.id)}
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
          {/* YouTube-Style Grid Layout - Full Archive Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {visibleVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.25) }}
                viewport={{ once: true }}
                className="group cursor-pointer"
                onClick={() => playVideo(video.id)}
              >
                {/* YouTube-Style Card */}
                <div className="bg-card rounded-lg overflow-hidden border border-white/10 hover:border-neon-green/50 transition-colors">
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <Image
                      src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                      alt={video.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />

                    {/* Duration Badge (Bottom-Right) */}
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-xs font-tag text-white">
                      {getFakeDuration(index)}
                    </div>

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                      <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                        <svg
                          className="w-7 h-7 text-black ml-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-3 md:p-4">
                    <h3 className="font-tag text-base md:text-lg text-white line-clamp-2 mb-2 group-hover:text-neon-green transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs md:text-sm text-white/60">
                        {video.artist}
                      </p>
                      <span className="text-white/40">•</span>
                      <span className="px-2 py-0.5 rounded text-[10px] md:text-xs font-tag uppercase bg-white/5 text-white/70 border border-white/10">
                        {video.vibe}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

