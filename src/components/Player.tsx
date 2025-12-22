"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import WaveSurfer from "wavesurfer.js";
import Image from "next/image";
import { Play, Pause, Volume2 } from "lucide-react";
import { DiceRoller } from "./DiceRoller";
import { tracks, MediaItem } from "@/lib/data";

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

const vibeTooltips = {
  chill: "Entre Humos y Pensamientos",
  hype: "Pura Energía Callejera",
  storytelling: "Historias Reales",
  classic: "El Sonido Original",
};

export function Player() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const visualizerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [currentTrack, setCurrentTrack] = useState<MediaItem | null>(null);
  const [visualizerData, setVisualizerData] = useState<number[]>([0, 0, 0, 0, 0]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDiceRoll = (result: number) => {
    // Map dice result (1-6) to track index (0-5)
    const trackIndex = result - 1;
    const selectedTrack = tracks[trackIndex];

    if (selectedTrack) {
      setCurrentTrack(selectedTrack);
      // In production, this would load from selectedTrack.src
      // For now, we'll just update the UI
      setIsLoading(false);
      setDuration("3:45"); // Mock duration
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgb(0, 255, 127)",
      progressColor: "rgb(255, 0, 255)",
      cursorColor: "rgb(255, 0, 255)",
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 2,
      height: 80,
      barGap: 2,
      normalize: true,
    });

    wavesurferRef.current = wavesurfer;

    // Try to set up Web Audio API visualizer
    wavesurfer.on("ready", () => {
      setIsLoading(false);
      setDuration(formatTime(wavesurfer.getDuration()));

      // Get the backend's audio context if available
      interface WaveSurferBackend {
        ac?: AudioContext;
      }
      const backend = (wavesurfer as unknown as { backend?: WaveSurferBackend }).backend;
      if (backend && backend.ac) {
        const audioContext = backend.ac;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        // Try to connect to the audio source
        try {
          const source = audioContext.createMediaElementSource(wavesurfer.getMediaElement());
          source.connect(analyser);
          analyser.connect(audioContext.destination);
        } catch {
          // If connection fails (already connected), use gain node
          const gainNode = audioContext.createGain();
          const source = audioContext.createMediaElementSource(wavesurfer.getMediaElement());
          source.connect(gainNode);
          gainNode.connect(analyser);
          gainNode.connect(audioContext.destination);
        }
      }
    });

    wavesurfer.on("play", () => {
      setIsPlaying(true);
    });
    wavesurfer.on("pause", () => setIsPlaying(false));

    wavesurfer.on("timeupdate", (time) => {
      setCurrentTime(formatTime(time));
    });

    return () => {
      wavesurfer.destroy();
    };
  }, []);

  // Audio Visualizer Animation
  useEffect(() => {
    if (!isPlaying || !analyserRef.current) {
      // Reset visualizer when not playing
      setVisualizerData([0, 0, 0, 0, 0]);
      return;
    }

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateVisualizer = () => {
      if (!isPlaying || !analyserRef.current) {
        setVisualizerData([0, 0, 0, 0, 0]);
        return;
      }

      analyser.getByteFrequencyData(dataArray);

      // Sample 5 frequency bands
      const bands = 5;
      const samples: number[] = [];
      const step = Math.floor(dataArray.length / bands);

      for (let i = 0; i < bands; i++) {
        const index = i * step;
        const value = dataArray[index] / 255; // Normalize to 0-1
        samples.push(Math.max(0.1, value)); // Minimum height for visibility
      }

      setVisualizerData(samples);

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      }
    };

    updateVisualizer();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  return (
    <div className="relative w-full p-4 md:p-8 rounded-lg border-2 border-neon-pink/30 shadow-lg shadow-neon-pink/20 overflow-hidden">
      {/* Graffiti Wall Background - Parallax Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/images/bg/graffiti-wall-1.jpg"
          alt="Graffiti Wall Background"
          fill
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content with relative positioning */}
      <div className="relative z-10">
        {/* Dice Roller Section */}
        <div className="mb-6 md:mb-8 flex justify-center">
          <DiceRoller onRollComplete={handleDiceRoll} />
        </div>

      {/* Track Info */}
      <div className="mb-4">
        {currentTrack ? (
          <>
            <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-xl md:text-2xl mb-1 font-tag text-neon-green truncate">
                  {currentTrack.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  by {currentTrack.artist}
                </p>
              </div>

              {/* Vibe Badge with Tooltip */}
              <div className="group relative">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${vibeColors[currentTrack.vibe]} font-tag text-sm cursor-help`}>
                  <span>{vibeIcons[currentTrack.vibe]}</span>
                  <span className="uppercase tracking-wider">{currentTrack.vibe}</span>
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-black/90 text-white text-xs font-tag rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-neon-green/50">
                  {vibeTooltips[currentTrack.vibe]}
                  <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                </div>
              </div>
            </div>

            {/* Cover Art */}
            <div className={`w-full h-24 rounded-lg bg-gradient-to-r ${currentTrack.coverArt} mb-4 shadow-md`} />
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground font-tag">
              🎲 Roll the dice to select a random track
            </p>
          </div>
        )}
      </div>

        {/* Audio Visualizer - 5 Neon Bars */}
        <div ref={visualizerRef} className="flex items-end justify-center gap-2 mb-6 h-24">
          {visualizerData.map((value, index) => (
            <motion.div
              key={index}
              className="w-8 bg-gradient-to-t from-neon-green via-neon-pink to-neon-green rounded-t-sm"
              animate={
                isPlaying
                  ? {
                      height: `${Math.max(20, value * 100)}%`,
                      opacity: value > 0.1 ? 1 : 0.3,
                    }
                  : {
                      height: "10%",
                      opacity: 0.3,
                    }
              }
              transition={{
                duration: 0.1,
                ease: "easeOut",
              }}
              style={{
                boxShadow: isPlaying
                  ? `0 0 10px hsl(var(--neon-green)), 0 0 20px hsl(var(--neon-pink))`
                  : "none",
              }}
            />
          ))}
        </div>

        {/* Waveform */}
        <div ref={containerRef} className="mb-4" />

        {/* Controls - Street Marker Style */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-0">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Street Marker style play button */}
            <button
              onClick={handlePlayPause}
              disabled={isLoading || !currentTrack}
              className="relative px-4 md:px-6 py-2 md:py-3 bg-black/80 border-2 border-neon-green font-tag text-neon-green hover:bg-neon-green hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-sm md:text-base"
              style={{
                clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              }}
            >
              {isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5" /> : <Play className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />}
              <span className="ml-1 md:ml-2 font-bold">PLAY</span>
            </button>
            <div className="px-3 md:px-4 py-2 bg-black/80 border-2 border-neon-pink font-tag text-neon-pink" style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
              <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>

          <div className="text-xs md:text-sm text-foreground font-tag font-bold px-3 md:px-4 py-2 bg-black/80 border border-neon-green/50 text-center md:text-left">
            {currentTime} / {duration}
          </div>
        </div>
      </div>
    </div>
  );
}
