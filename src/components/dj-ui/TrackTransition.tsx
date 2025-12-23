"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface TrackTransitionProps {
  isTransitioning: boolean;
  fromTrack?: string;
  toTrack?: string;
  onTransitionComplete?: () => void;
}

export function TrackTransition({
  isTransitioning,
  fromTrack,
  toTrack,
  onTransitionComplete,
}: TrackTransitionProps) {
  const [showTransition, setShowTransition] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      setShowTransition(true);
      const timer = setTimeout(() => {
        setShowTransition(false);
        onTransitionComplete?.();
      }, 1000); // 1 second transition
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, onTransitionComplete]);

  return (
    <AnimatePresence>
      {showTransition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none"
        >
          {/* Waveform Transition Effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: [0, 1.5, 1], rotate: 360 }}
              exit={{ scale: 0, rotate: 720 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="w-64 h-64 rounded-full border-4 border-cyan-500/50"
              style={{
                background: "radial-gradient(circle, transparent 0%, rgba(0, 217, 255, 0.1) 100%)",
              }}
            />
          </div>

          {/* Track Name Transition */}
          {(fromTrack || toTrack) && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center"
            >
              {fromTrack && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-white text-xl font-bold mb-2"
                >
                  {fromTrack}
                </motion.div>
              )}
              {toTrack && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className="text-cyan-400 text-2xl font-bold"
                >
                  → {toTrack}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Particle Effects */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: "50%",
                y: "50%",
                opacity: 1,
                scale: 0,
              }}
              animate={{
                x: `${50 + (Math.random() - 0.5) * 100}%`,
                y: `${50 + (Math.random() - 0.5) * 100}%`,
                opacity: [1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 1,
                delay: Math.random() * 0.5,
                ease: "easeOut",
              }}
              className="absolute w-2 h-2 rounded-full bg-cyan-400"
              style={{
                left: "50%",
                top: "50%",
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

