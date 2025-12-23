"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";

export function VideoHero({ featuredVideo, onPlay }: { featuredVideo: any, onPlay: (id: string) => void }) {
  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] mb-12 rounded-3xl overflow-hidden border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] group cursor-pointer" onClick={() => onPlay(featuredVideo.id)}>
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
            <button className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-[#ccff00] transition-colors">
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

