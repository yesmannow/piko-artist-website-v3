"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { X } from "lucide-react";
import { MediaItem } from "@/lib/data";
import { useAudio } from "@/context/AudioContext";

interface CinemaModalProps {
  video: MediaItem;
  onClose: () => void;
}

export function CinemaModal({ video, onClose }: CinemaModalProps) {
  const { isPlaying, audioRef } = useAudio();

  // Pause music when modal opens
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      // The audio element's onPause event will update the state
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - intentionally ignoring deps

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-5xl mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Retro TV Frame */}
          <div className="relative bg-gray-900 rounded-lg p-3 md:p-6 shadow-2xl">
            {/* TV Bezel */}
            <div className="relative bg-gray-800 rounded p-2 md:p-4">
              {/* Screen */}
              <div className="relative w-full aspect-video bg-black rounded overflow-hidden">
                {/* YouTube iframe */}
                <iframe
                  src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />

                {/* Scanline Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `repeating-linear-gradient(
                      0deg,
                      transparent,
                      transparent 2px,
                      rgba(0, 0, 0, 0.15) 2px,
                      rgba(0, 0, 0, 0.15) 4px
                    )`,
                    animation: "scanlines 8s linear infinite",
                  }}
                />

                {/* CRT Flicker */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    animation: "flicker 0.15s infinite",
                  }}
                />
              </div>

              {/* TV Controls (Decorative) */}
              <div className="flex justify-center gap-2 mt-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-gray-600"
                  />
                ))}
              </div>
            </div>

            {/* Video Title */}
            <div className="mt-4 text-center">
              <h3 className="font-tag text-xl md:text-2xl text-white">
                {video.title}
              </h3>
            </div>
          </div>

          {/* Close Button - Spray Painted X */}
          <motion.button
            onClick={onClose}
            className="absolute -top-4 -right-4 w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/90 border-4 border-neon-green flex items-center justify-center group hover:scale-110 transition-transform"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              boxShadow: "0 0 20px hsl(var(--neon-green))",
            }}
          >
            <X
              className="w-6 h-6 md:w-8 md:h-8 text-neon-green"
              strokeWidth={4}
              style={{
                filter: "drop-shadow(0 0 4px hsl(var(--neon-green)))",
              }}
            />
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Scanline Animation */}
      <style jsx>{`
        @keyframes scanlines {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 100%;
          }
        }

        @keyframes flicker {
          0% {
            opacity: 0.95;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.98;
          }
        }
      `}</style>
    </AnimatePresence>
  );
}

