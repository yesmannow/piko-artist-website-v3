"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useVideo } from "@/context/VideoContext";
import { tracks } from "@/lib/data";
import { X, ChevronDown, Maximize2 } from "lucide-react";
import Image from "next/image";

export function FloatingVideoPlayer() {
  const { currentVideoId, isMinimized, closeVideo, toggleMinimize } = useVideo();

  if (!currentVideoId) return null;

  const video = tracks.find((t) => t.id === currentVideoId && t.type === "video");

  if (!video) return null;

  return (
    <AnimatePresence>
      {!isMinimized ? (
        // Full-size player (centered)
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-md"
            onClick={closeVideo}
          />

          {/* Player Container */}
          <motion.div
            className="relative z-10 w-full max-w-5xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* YouTube Embed */}
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Video Title */}
            <div className="mt-4 text-center">
              <h3 className="font-tag text-xl md:text-2xl text-white">
                {video.title}
              </h3>
            </div>

            {/* Control Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <motion.button
                onClick={toggleMinimize}
                className="w-10 h-10 rounded-full bg-black/80 border-2 border-white/20 flex items-center justify-center hover:bg-black/90 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </motion.button>
              <motion.button
                onClick={closeVideo}
                className="w-10 h-10 rounded-full bg-black/80 border-2 border-white/20 flex items-center justify-center hover:bg-red-500/80 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        // Minimized PiP (bottom-right, above music player)
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-24 right-4 z-[90] w-[320px] md:w-[400px] bg-black/95 backdrop-blur-md rounded-lg overflow-hidden shadow-2xl border-2 border-white/10"
        >
          <div className="flex gap-3 p-3">
            {/* Thumbnail */}
            <div className="relative w-24 h-16 flex-shrink-0 rounded overflow-hidden bg-black">
              <Image
                src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                alt={video.title}
                fill
                className="object-cover"
                unoptimized
              />
              {/* Play indicator */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[6px] border-l-black border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5" />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-tag text-sm text-white line-clamp-2 mb-1">
                {video.title}
              </h4>
              <p className="text-xs text-white/60 line-clamp-1">
                {video.artist}
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-1">
              <motion.button
                onClick={toggleMinimize}
                className="w-7 h-7 rounded bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </motion.button>
              <motion.button
                onClick={closeVideo}
                className="w-7 h-7 rounded bg-white/10 flex items-center justify-center hover:bg-red-500/80 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </div>

          {/* Click to expand */}
          <button
            onClick={toggleMinimize}
            className="absolute inset-0 z-10"
            aria-label="Expand video"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

