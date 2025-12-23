"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play } from "lucide-react";
import { MediaItem } from "@/lib/data";

const categories = ["ALL", "HYPE", "CHILL", "STORYTELLING", "CLASSIC"];

export function VideoGrid({ videos, onPlay }: { videos: MediaItem[], onPlay: (id: string) => void }) {
  const [filter, setFilter] = useState("ALL");
  const filteredVideos = filter === "ALL"
    ? videos
    : videos.filter(v => v.vibe?.toUpperCase() === filter);

  return (
    <div>
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 text-xs font-bold rounded-full border border-zinc-800 transition-all ${
              filter === cat
                ? "bg-white text-black border-white"
                : "bg-transparent text-zinc-500 hover:text-white hover:border-zinc-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Animated Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredVideos.map((video) => (
            <motion.div
              layout
              key={video.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="group relative aspect-video bg-zinc-900 rounded-xl overflow-hidden cursor-pointer border border-zinc-800 hover:border-[#ccff00] transition-colors"
              onClick={() => onPlay(video.id)}
            >
              {/* Thumbnail - SAFE HQ Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100"
              />

              {/* Play Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                <div className="w-12 h-12 bg-[#ccff00] rounded-full flex items-center justify-center shadow-[0_0_20px_#ccff00]">
                  <Play className="w-5 h-5 text-black fill-current" />
                </div>
              </div>

              {/* Info Overlay */}
              <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                <h3 className="text-white font-bold truncate">{video.title}</h3>
                <p className="text-[#ccff00] text-xs font-mono uppercase tracking-wider mt-1">{video.vibe}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

