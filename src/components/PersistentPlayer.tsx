"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "@/context/AudioContext";
import { Play, Pause, SkipForward, SkipBack, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function PersistentPlayer() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    skipNext,
    skipPrevious,
    volume,
    setVolume,
    progress,
    audioRef,
  } = useAudio();

  const [visualizerData, setVisualizerData] = useState<number[]>([0, 0, 0]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Set up audio visualizer
  useEffect(() => {
    if (!audioRef.current || !isPlaying) {
      setVisualizerData([0, 0, 0]);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const audio = audioRef.current;
    let audioContext: AudioContext | null = null;
    let source: MediaElementAudioSourceNode | null = null;

    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;

      source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVisualizer = () => {
        if (!analyserRef.current || !isPlaying || !audioRef.current) {
          setVisualizerData([0, 0, 0]);
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);

        // Sample 3 frequency bands for mini visualizer
        const bands = 3;
        const samples: number[] = [];
        const step = Math.floor(dataArray.length / bands);

        for (let i = 0; i < bands; i++) {
          const index = i * step;
          const value = dataArray[index] / 255;
          samples.push(Math.max(0.1, value));
        }

        setVisualizerData(samples);

        if (isPlaying && audioRef.current) {
          animationFrameRef.current = requestAnimationFrame(updateVisualizer);
        }
      };

      updateVisualizer();
    } catch (error) {
      console.error("Error setting up audio visualizer:", error);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Note: We don't close the audioContext here as it's connected to the audio element
      // The browser will handle cleanup when the component unmounts
    };
  }, [isPlaying, audioRef, currentTrack]);

  // Show player only when a track is selected
  const shouldShow = currentTrack !== null;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 w-full"
        >
          {/* Progress bar at top */}
          <div className="h-1 bg-black/50 w-full">
            <motion.div
              className="h-full bg-neon-green"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Player container */}
          <div className="bg-black/90 backdrop-blur-xl border-t border-neon-green/30">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
              <div className="flex items-center gap-4 md:gap-6">
                {/* Left: Thumbnail + Scrolling Text */}
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  {currentTrack && (
                    <>
                      {/* Tiny thumbnail */}
                      <div
                        className={`w-12 h-12 md:w-16 md:h-16 rounded-lg bg-gradient-to-r ${currentTrack.coverArt} flex-shrink-0`}
                      />

                      {/* Scrolling marquee text */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="font-tag text-sm md:text-base text-white truncate">
                          <span>{currentTrack.title}</span>
                          <span className="text-muted-foreground text-xs md:text-sm">
                            {" "}• {currentTrack.artist}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Center: Play/Pause/Skip Controls */}
                <div className="flex items-center gap-2 md:gap-4">
                  <button
                    onClick={skipPrevious}
                    className="p-2 hover:bg-white/10 rounded transition-colors"
                    aria-label="Previous track"
                  >
                    <SkipBack className="w-4 h-4 md:w-5 md:h-5 text-neon-green" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="p-2 md:p-3 bg-neon-green/20 hover:bg-neon-green/30 border border-neon-green rounded-full transition-colors"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 md:w-6 md:h-6 text-neon-green" />
                    ) : (
                      <Play className="w-5 h-5 md:w-6 md:h-6 text-neon-green ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={skipNext}
                    className="p-2 hover:bg-white/10 rounded transition-colors"
                    aria-label="Next track"
                  >
                    <SkipForward className="w-4 h-4 md:w-5 md:h-5 text-neon-green" />
                  </button>
                </div>

                {/* Right: Volume + Mini Visualizer */}
                <div className="flex items-center gap-3 md:gap-4">
                  {/* Mini Audio Visualizer - 3 bouncing bars */}
                  <div className="hidden md:flex items-end gap-1 h-8">
                    {visualizerData.map((value, index) => (
                      <motion.div
                        key={index}
                        className="w-1.5 bg-neon-green rounded-t"
                        animate={{
                          height: `${Math.max(20, value * 100)}%`,
                        }}
                        transition={{
                          duration: 0.1,
                          ease: "easeOut",
                        }}
                        style={{
                          boxShadow: isPlaying
                            ? "0 0 4px hsl(var(--neon-green))"
                            : "none",
                        }}
                      />
                    ))}
                  </div>

                  {/* Volume slider */}
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-neon-green flex-shrink-0" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => {
                        const newVolume = parseFloat(e.target.value);
                        setVolume(newVolume);
                        if (audioRef.current) {
                          audioRef.current.volume = newVolume;
                        }
                      }}
                      className="w-20 md:w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-neon-green"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

