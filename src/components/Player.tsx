"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Volume2 } from "lucide-react";
import { DiceRoller } from "./DiceRoller";
import { tracks, Track } from "@/lib/data";

interface PlayerProps {
  audioUrl?: string;
}

const vibeColors = {
  chill: "bg-neon-green/20 text-neon-green border-neon-green",
  hype: "bg-neon-pink/20 text-neon-pink border-neon-pink",
  classic: "bg-amber-500/20 text-amber-400 border-amber-400",
  freestyle: "bg-cyan-500/20 text-cyan-400 border-cyan-400",
};

const vibeIcons = {
  chill: "🌊",
  hype: "🔥",
  classic: "👑",
  freestyle: "✨",
};

export function Player({ audioUrl }: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

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

    // Load audio if URL is provided
    if (audioUrl) {
      wavesurfer.load(audioUrl);
    }

    wavesurfer.on("ready", () => {
      setIsLoading(false);
      setDuration(formatTime(wavesurfer.getDuration()));
    });

    wavesurfer.on("play", () => setIsPlaying(true));
    wavesurfer.on("pause", () => setIsPlaying(false));
    
    wavesurfer.on("timeupdate", (time) => {
      setCurrentTime(formatTime(time));
    });

    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl]);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  return (
    <div className="w-full bg-card p-8 rounded-lg border-2 border-neon-pink/30 shadow-lg shadow-neon-pink/20">
      {/* Dice Roller Section */}
      <div className="mb-8 flex justify-center">
        <DiceRoller onRollComplete={handleDiceRoll} />
      </div>

      {/* Track Info */}
      <div className="mb-4">
        {currentTrack ? (
          <>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="font-semibold text-2xl mb-1 font-tag text-neon-green">
                  {currentTrack.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  by {currentTrack.artist}
                </p>
              </div>
              
              {/* Vibe Badge */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${vibeColors[currentTrack.vibe]} font-tag text-sm`}>
                <span>{vibeIcons[currentTrack.vibe]}</span>
                <span className="uppercase tracking-wider">{currentTrack.vibe}</span>
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
      
      {/* Waveform */}
      <div ref={containerRef} className="mb-4" />
      
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Spray Can style play button */}
          <button
            onClick={handlePlayPause}
            disabled={isLoading || !currentTrack}
            className="relative p-4 bg-gradient-to-br from-neon-pink to-neon-green text-background rounded-full hover:shadow-lg hover:shadow-neon-pink/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            
            {/* Spray effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-neon-pink/30 to-neon-green/30 blur-md group-hover:blur-lg transition-all" />
          </button>
          <Volume2 className="w-5 h-5 text-neon-green" />
        </div>
        
        <div className="text-sm text-muted-foreground font-mono">
          {currentTime} / {duration}
        </div>
      </div>
    </div>
  );
}
