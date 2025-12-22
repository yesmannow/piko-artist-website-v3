"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { MediaItem } from "@/lib/data";
import { CinemaModal } from "./CinemaModal";

interface VideoGalleryProps {
  videos: MediaItem[];
}

export function VideoGallery({ videos }: VideoGalleryProps) {
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(null);

  // Create staggered heights for masonry effect
  const getStaggeredHeight = (index: number) => {
    const heights = [280, 320, 300, 340, 310, 290];
    return heights[index % heights.length];
  };

  return (
    <>
      {/* TV Stack Masonry Layout */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 space-y-4 md:space-y-6">
        {videos.map((video, index) => {
          const height = getStaggeredHeight(index);
          
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
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${video.coverArt} transition-all duration-500 group-hover:grayscale-0 group-hover:contrast-100 grayscale contrast-125`}
                    style={{
                      backgroundImage: "url(https://img.youtube.com/vi/" + video.id + "/maxresdefault.jpg)",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {/* Grain overlay - disappears on hover */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjkiIG51bU9jdGF2ZXM9IjQiLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjYSkiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-100 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" />
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

