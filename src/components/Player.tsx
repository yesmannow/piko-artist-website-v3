"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Volume2 } from "lucide-react";

interface PlayerProps {
  audioUrl?: string;
  title?: string;
}

export function Player({ audioUrl, title = "Audio Track" }: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgb(148, 163, 184)",
      progressColor: "rgb(59, 130, 246)",
      cursorColor: "rgb(59, 130, 246)",
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
    <div className="w-full bg-card p-6 rounded-lg border shadow-lg">
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {audioUrl ? "Streaming from Cloudflare R2" : "No audio loaded"}
        </p>
      </div>
      
      <div ref={containerRef} className="mb-4" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayPause}
            disabled={isLoading || !audioUrl}
            className="p-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <Volume2 className="w-5 h-5 text-muted-foreground" />
        </div>
        
        <div className="text-sm text-muted-foreground">
          {currentTime} / {duration}
        </div>
      </div>
    </div>
  );
}
