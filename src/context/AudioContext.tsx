"use client";

import { createContext, useContext, useState, useRef, ReactNode, useEffect } from "react";
import { MediaItem, tracks } from "@/lib/data";

interface AudioContextType {
  currentTrack: MediaItem | null;
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  togglePlay: () => void;
  playTrack: (track: MediaItem) => void;
  skipNext: () => void;
  skipPrevious: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  progress: number;
  setProgress: (progress: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<MediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const playTrack = (track: MediaItem) => {
    setCurrentTrack(track);
    setIsPlaying(true);

    // Load and play the track
    if (audioRef.current) {
      if (track.type === "audio") {
        audioRef.current.src = track.src;
        audioRef.current.load();
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
        });
      } else {
        // For video tracks, we might need different handling
        // For now, just set the track
        setIsPlaying(false);
      }
    }
  };

  const skipNext = () => {
    if (!currentTrack) return;
    const audioTracks = tracks.filter((t) => t.type === "audio");
    const currentIndex = audioTracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % audioTracks.length;
    playTrack(audioTracks[nextIndex]);
  };

  const skipPrevious = () => {
    if (!currentTrack) return;
    const audioTracks = tracks.filter((t) => t.type === "audio");
    const currentIndex = audioTracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? audioTracks.length - 1 : currentIndex - 1;
    playTrack(audioTracks[prevIndex]);
  };

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        audioRef,
        togglePlay,
        playTrack,
        skipNext,
        skipPrevious,
        volume,
        setVolume,
        progress,
        setProgress,
      }}
    >
      {children}
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          if (audio.duration) {
            setProgress((audio.currentTime / audio.duration) * 100);
          }
        }}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume);
        }}
      />
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}

