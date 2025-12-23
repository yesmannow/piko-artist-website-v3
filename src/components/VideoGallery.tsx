"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { tracks } from "@/lib/data";
import { useVideo } from "@/context/VideoContext";
import { useState } from "react";

interface VideoGalleryProps {
  featuredOnly?: boolean;
}

// VideoCard component for Full Archive Mode
interface VideoCardProps {
  video: (typeof tracks)[0];
  index: number;
  onPlay: () => void;
}

function VideoCard({ video, index, onPlay }: VideoCardProps) {
  // Random rotation for pasted-on-wall effect
  const rotation = (Math.random() * 2 - 1).toFixed(2);
  const tapeRotation = (Math.random() * 8 - 4).toFixed(2);
  const [isHovered, setIsHovered] = useState(false);

  // Generate fake duration for YouTube-style timestamp
  const getFakeDuration = (index: number) => {
    const durations = ["3:45", "4:12", "2:58", "5:23", "3:19", "4:56", "2:34", "3:47"];
    return durations[index % durations.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.25) }}
      viewport={{ once: true }}
      className="group cursor-pointer relative overflow-visible"
      onClick={onPlay}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Duct Tape Element - Top Center */}
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-12 md:w-16 h-4 md:h-6 bg-tape-gray opacity-80"
        style={{ transform: `translateX(-50%) rotate(${tapeRotation}deg)` }}
      >
        <div className="w-full h-full bg-tape-gray border border-black/20" />
      </div>

      {/* Poster Card */}
      <div
        className="bg-concrete overflow-hidden border-2 border-black transition-all hover:scale-[1.02] relative"
        style={{
          boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
        }}
      >
        {/* Wrinkled Paper Texture Overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            mixBlendMode: "multiply",
          }}
        />
        {/* Thumbnail Container / CCTV Video */}
        <div className="relative aspect-video bg-black overflow-hidden">
          {/* Static Thumbnail (default) */}
          {!isHovered && (
            <Image
              src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
              alt={video.title}
              fill
              className="object-cover transition-transform duration-300"
              unoptimized
            />
          )}

          {/* CCTV Video (on hover) */}
          {isHovered && (
            <div className="relative w-full h-full">
              <iframe
                title={`${video.title} - CCTV Preview`}
                src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&start=10&controls=0&modestbranding=1&rel=0&loop=1&playlist=${video.id}`}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                style={{
                  filter: "grayscale(100%) sepia(100%) hue-rotate(80deg) contrast(150%)",
                  border: "none",
                }}
              />
              {/* Scanline Overlay */}
              <div
                className="absolute inset-0 pointer-events-none z-10 opacity-30"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0, 255, 0, 0.1) 2px,
                    rgba(0, 255, 0, 0.1) 4px
                  )`,
                  mixBlendMode: "screen",
                }}
              />
            </div>
          )}

          {/* Duration Badge (Bottom-Right) */}
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-xs font-industrial font-bold text-white border border-black z-20">
            {getFakeDuration(index)}
          </div>

          {/* Play Button Overlay (only when not hovering) */}
          {!isHovered && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
              <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border-2 border-black">
                <svg
                  className="w-7 h-7 text-black ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Card Info */}
        <div className="p-3 md:p-4">
          <h3 className="font-header text-base md:text-lg text-foreground line-clamp-2 mb-2 group-hover:text-toxic-lime transition-colors font-bold">
            {video.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs md:text-sm text-foreground/60">
              {video.artist}
            </p>
            <span className="text-foreground/40">•</span>
            <span className="px-2 py-0.5 rounded text-[10px] md:text-xs font-industrial font-bold uppercase bg-foreground/5 text-foreground/70 border border-black">
              {video.vibe}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function VideoGallery({ featuredOnly = false }: VideoGalleryProps) {
  const { playVideo } = useVideo();

  const videos = tracks.filter((t) => t.type === "video");
  const visibleVideos = featuredOnly ? videos.slice(0, 3) : videos;

  return (
    <>
      {featuredOnly ? (
        <>
          {/* TV Stack Masonry Layout - Home Featured Mode */}
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 md:gap-6 snap-y snap-mandatory">
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
                        <div className="w-16 h-16 rounded-full bg-toxic-lime/90 flex items-center justify-center border-2 border-black">
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
                        <p className="font-industrial font-bold uppercase tracking-wider text-black text-sm md:text-base">
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
              className="px-6 py-3 rounded-full border-2 border-black bg-toxic-lime/10 text-toxic-lime font-industrial font-bold tracking-wider hover:bg-toxic-lime/20 transition-colors shadow-hard"
            >
              Watch All Visuals
            </Link>
          </div>
        </>
      ) : (
        <>
          {/* Wheatpaste Wall Grid Layout - Full Archive Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-2 md:px-0 snap-y snap-mandatory overflow-y-auto">
            {visibleVideos.map((video, index) => (
              <div key={video.id} className="snap-center">
                <VideoCard
                  video={video}
                  index={index}
                  onPlay={() => playVideo(video.id)}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

