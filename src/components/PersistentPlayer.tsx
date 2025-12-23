"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "@/context/AudioContext";
import { Play, Pause, SkipForward, SkipBack, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Ad-Lib sample files
const adLibSamples = [
  "/audio/sfx/spray-shake.mp3",
  "/audio/sfx/dice-throw.mp3",
  "/audio/sfx/dice-shake.mp3",
];

// Type declaration for webkit prefixed AudioContext
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

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
  const adLibAudioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  // Initialize ad-lib audio elements
  useEffect(() => {
    adLibAudioRefs.current = adLibSamples.map((src) => {
      const audio = new Audio(src);
      audio.volume = 0.6; // Slightly lower volume to layer over music
      return audio;
    });

    return () => {
      adLibAudioRefs.current.forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = "";
        }
      });
    };
  }, []);

  // Play ad-lib sample
  const playAdLib = (index: number) => {
    const audio = adLibAudioRefs.current[index];
    if (audio) {
      audio.currentTime = 0; // Reset to start
      audio.play().catch((error) => {
        console.error("Error playing ad-lib:", error);
      });
    }
  };

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
      const windowWithWebkit = window as WindowWithWebkit;
      audioContext = new (window.AudioContext || windowWithWebkit.webkitAudioContext!)();
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
              className="h-full bg-toxic-lime"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Player container */}
          <div className="bg-concrete/95 backdrop-blur-xl border-t-2 border-black">
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
                        <div className="font-tag text-sm md:text-base text-foreground truncate">
                          <span>{currentTrack.title}</span>
                          <span className="text-foreground/60 text-xs md:text-sm">
                            {" "}• {currentTrack.artist}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Center: Play/Pause/Skip Controls + Ad-Lib Buttons */}
                <div className="flex items-center gap-2 md:gap-4">
                  <button
                    onClick={skipPrevious}
                    className="p-2 hover:bg-foreground/10 rounded transition-colors"
                    aria-label="Previous track"
                  >
                    <SkipBack className="w-4 h-4 md:w-5 md:h-5 text-toxic-lime" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="p-2 md:p-3 bg-toxic-lime/20 hover:bg-toxic-lime/30 border-2 border-black rounded-full transition-colors shadow-hard"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 md:w-6 md:h-6 text-toxic-lime" />
                    ) : (
                      <Play className="w-5 h-5 md:w-6 md:h-6 text-toxic-lime ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={skipNext}
                    className="p-2 hover:bg-foreground/10 rounded transition-colors"
                    aria-label="Next track"
                  >
                    <SkipForward className="w-4 h-4 md:w-5 md:h-5 text-toxic-lime" />
                  </button>

                  {/* Ad-Lib Spray Can Cap Buttons */}
                  <div className="flex items-center gap-1.5 ml-2 pl-2 border-l-2 border-black">
                    {adLibSamples.map((_, index) => {
                      const colors = ["#ff0099", "#ccff00", "#ff6600"]; // spray-magenta, toxic-lime, safety-orange
                      return (
                        <button
                          key={index}
                          onClick={() => playAdLib(index)}
                          className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-black transition-all hover:scale-110 active:scale-95 shadow-hard"
                          style={{
                            backgroundColor: colors[index],
                            boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                          }}
                          aria-label={`Play ad-lib ${index + 1}`}
                        >
                          <div className="w-full h-full rounded-full flex items-center justify-center">
                            <div
                              className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-black/30"
                              style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)" }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Volume + Mini Visualizer */}
                <div className="flex items-center gap-3 md:gap-4">
                  {/* Mini Audio Visualizer - 3 bouncing bars */}
                  <div className="hidden md:flex items-end gap-1 h-8">
                    {visualizerData.map((value, index) => (
                      <motion.div
                        key={index}
                        className="w-1.5 bg-toxic-lime rounded-t border border-black"
                        animate={{
                          height: `${Math.max(20, value * 100)}%`,
                        }}
                        transition={{
                          duration: 0.1,
                          ease: "easeOut",
                        }}
                        style={{
                          boxShadow: isPlaying
                            ? "0 0 4px #ccff00"
                            : "none",
                        }}
                      />
                    ))}
                  </div>

                  {/* Volume slider */}
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-toxic-lime flex-shrink-0" />
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
                      aria-label="Volume control"
                      className="w-20 md:w-24 h-1 bg-foreground/20 rounded-lg appearance-none cursor-pointer"
                      style={{
                        accentColor: "#ccff00",
                      }}
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

