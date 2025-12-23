"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "@/context/AudioContext";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useHaptic } from "@/hooks/useHaptic";
import Image from "next/image";

// Type declaration for webkit prefixed AudioContext
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export function PersistentPlayer() {
  const triggerHaptic = useHaptic();
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
  const [isMobile, setIsMobile] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const previousVolumeRef = useRef<number>(1);

  // Helper to check if coverArt is an image path
  const isImagePath = (coverArt: string): boolean => {
    return coverArt.startsWith("/");
  };

  // Detect mobile for proper positioning
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Toggle mute/unmute
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;

    if (isMuted) {
      // Unmute: restore previous volume
      setVolume(previousVolumeRef.current);
      audioRef.current.volume = previousVolumeRef.current;
      setIsMuted(false);
    } else {
      // Mute: save current volume and set to 0
      previousVolumeRef.current = volume;
      setVolume(0);
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
    triggerHaptic();
  }, [isMuted, volume, setVolume, triggerHaptic, audioRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          triggerHaptic();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skipPrevious();
          triggerHaptic();
          break;
        case "ArrowRight":
          e.preventDefault();
          skipNext();
          triggerHaptic();
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [togglePlay, skipPrevious, skipNext, toggleMute, triggerHaptic]);

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
          className={`fixed left-0 right-0 w-full z-40 md:z-50 ${
            isMobile ? "bottom-[64px] pb-[env(safe-area-inset-bottom)]" : "bottom-0"
          }`}
        >
          {/* Progress bar at top */}
          <div className="h-1 bg-black/50 w-full">
            <motion.div
              className="h-full bg-toxic-lime"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Player container with glassmorphism */}
          <div
            className="relative border-t-2 border-black/20 overflow-hidden backdrop-blur-xl bg-black/60"
            style={{
              boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Album art background with blur */}
            {currentTrack && (
              <>
                {isImagePath(currentTrack.coverArt) ? (
                  <Image
                    src={currentTrack.coverArt}
                    alt={currentTrack.title}
                    fill
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 -z-10"
                    sizes="100vw"
                    priority
                  />
                ) : (
                  <div
                    className={`absolute inset-0 w-full h-full bg-gradient-to-r ${currentTrack.coverArt} blur-2xl opacity-40 -z-10`}
                  />
                )}
              </>
            )}
            <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
              <div className="flex items-center gap-4 md:gap-6">
                {/* Left: Thumbnail + Scrolling Text */}
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  {currentTrack && (
                    <>
                      {/* Tiny thumbnail */}
                      {isImagePath(currentTrack.coverArt) ? (
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                          <Image
                            src={currentTrack.coverArt}
                            alt={currentTrack.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 48px, 64px"
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-12 h-12 md:w-16 md:h-16 rounded-lg bg-gradient-to-r ${currentTrack.coverArt} flex-shrink-0`}
                        />
                      )}

                      {/* Scrolling marquee text */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="font-industrial font-bold uppercase tracking-wider text-sm md:text-base text-foreground truncate">
                          <span>{currentTrack.title}</span>
                          <span className="text-foreground/60 text-xs md:text-sm">
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
                    onClick={() => {
                      triggerHaptic();
                      skipPrevious();
                    }}
                    className="p-2 hover:bg-foreground/10 rounded transition-colors"
                    aria-label="Previous track"
                  >
                    <SkipBack className="w-4 h-4 md:w-5 md:h-5 text-toxic-lime" />
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic();
                      togglePlay();
                    }}
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
                    onClick={() => {
                      triggerHaptic();
                      skipNext();
                    }}
                    className="p-2 hover:bg-foreground/10 rounded transition-colors"
                    aria-label="Next track"
                  >
                    <SkipForward className="w-4 h-4 md:w-5 md:h-5 text-toxic-lime" />
                  </button>
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
                    <button
                      onClick={toggleMute}
                      className="p-1 hover:bg-foreground/10 rounded transition-colors"
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-toxic-lime flex-shrink-0" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-toxic-lime flex-shrink-0" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const newVolume = parseFloat(e.target.value);
                        if (newVolume > 0 && isMuted) {
                          setIsMuted(false);
                        }
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

