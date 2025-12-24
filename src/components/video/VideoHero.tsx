"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { MediaItem } from "@/lib/data";

export function VideoHero({ featuredVideo, onPlay }: { featuredVideo: MediaItem, onPlay: (id: string) => void }) {
  if (!featuredVideo?.id) return null;

  return (
    <div
      className="relative w-full h-[60vh] md:h-[70vh] mb-8 md:mb-12 rounded-lg overflow-hidden border-2 border-zinc-800 shadow-2xl group cursor-pointer focus-within:ring-2 focus-within:ring-toxic-lime focus-within:ring-offset-2"
      onClick={() => onPlay(featuredVideo.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay(featuredVideo.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Play featured video: ${featuredVideo.title}`}
    >
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
           style={{ backgroundImage: `url(https://img.youtube.com/vi/${featuredVideo.id}/hqdefault.jpg)` }} />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full md:w-2/3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <span className="inline-block px-3 py-1 mb-4 text-xs font-bold text-black bg-[#ccff00] rounded-full uppercase tracking-widest">
            Latest Drop
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 uppercase leading-none tracking-tighter">
            {featuredVideo.title}
          </h1>
          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-toxic-lime transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-toxic-lime focus:ring-offset-2 focus:ring-offset-black"
              aria-label="Watch featured video"
            >
              <Play className="w-5 h-5 fill-current" />
              WATCH NOW
            </button>
            <span className="text-zinc-400 font-mono text-sm uppercase tracking-wider">
              {featuredVideo.vibe} EDITION
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

