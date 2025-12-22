"use client";

import { motion } from "framer-motion";
import { useAudio } from "@/context/AudioContext";
import { tracks } from "@/lib/data";
import { Play } from "lucide-react";

const vibeColors = {
  chill: "bg-neon-green/20 text-neon-green border-neon-green",
  hype: "bg-neon-pink/20 text-neon-pink border-neon-pink",
  classic: "bg-amber-500/20 text-amber-400 border-amber-400",
  storytelling: "bg-purple-500/20 text-purple-400 border-purple-400",
};

const vibeIcons = {
  chill: "🌊",
  hype: "🔥",
  classic: "👑",
  storytelling: "📖",
};

export function TrackList() {
  const { playTrack, currentTrack } = useAudio();

  // Filter to only audio tracks (exclude videos)
  const audioTracks = tracks.filter((track) => track.type === "audio");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {audioTracks.map((track, index) => (
        <motion.div
          key={track.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.05 }}
          viewport={{ once: true }}
          className="group relative cursor-pointer"
          onClick={() => playTrack(track)}
        >
          {/* Vinyl Sleeve Card */}
          <div className="relative overflow-hidden rounded-lg">
            {/* Album Art (Sleeve) */}
            <div
              className={`aspect-square rounded-lg bg-gradient-to-r ${track.coverArt} relative overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]`}
            >
              {/* Play Button Overlay */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                whileHover={{ scale: 1.1 }}
              >
                <div className="w-16 h-16 rounded-full bg-neon-green/90 flex items-center justify-center shadow-lg">
                  <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
                </div>
              </motion.div>

              {/* Vinyl Record - Slides out on hover */}
              <motion.div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-black border-4 border-gray-800 shadow-2xl z-20"
                initial={{ x: "100%" }}
                whileHover={{ x: "-20%" }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                {/* Inner label */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-black"></div>
                </div>
                {/* Vinyl grooves */}
                <div className="absolute inset-0 rounded-full border border-gray-600/30"></div>
                <div className="absolute inset-2 rounded-full border border-gray-600/20"></div>
                <div className="absolute inset-4 rounded-full border border-gray-600/10"></div>
              </motion.div>
            </div>

            {/* Track Details */}
            <div className="mt-4">
              <h3 className="font-tag text-lg md:text-xl text-foreground mb-2 group-hover:text-neon-green transition-colors">
                {track.title}
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{track.artist}</p>
                {/* Vibe Badge */}
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${vibeColors[track.vibe]}`}
                >
                  <span>{vibeIcons[track.vibe]}</span>
                  <span className="uppercase tracking-wider font-tag">
                    {track.vibe}
                  </span>
                </div>
              </div>
            </div>

            {/* Active indicator */}
            {currentTrack?.id === track.id && (
              <motion.div
                className="absolute top-2 right-2 w-3 h-3 rounded-full bg-neon-green"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  boxShadow: "0 0 10px hsl(var(--neon-green))",
                }}
              />
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

