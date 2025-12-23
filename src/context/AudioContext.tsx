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
  isMuted: boolean;
  toggleMute: () => void;
  progress: number;
  setProgress: (progress: number) => void;
  seek: (time: number) => void;
  duration: number;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<MediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const previousVolumeRef = useRef<number>(1);

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

  const seek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    if (audioRef.current.duration) {
      setProgress((time / audioRef.current.duration) * 100);
    }
  };

  // Helper to check if coverArt is an image path
  const isImagePath = (coverArt: string): boolean => {
    return coverArt.startsWith("/");
  };

  // Toggle mute
  const toggleMute = () => {
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
  };

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = volume;
    }
  }, [volume, isMuted]);

  // MediaSession API integration for lock screen controls
  useEffect(() => {
    if (!currentTrack || !("mediaSession" in navigator)) return;

    const mediaSession = navigator.mediaSession;

    // Set metadata for lock screen
    mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: "Piko",
      artwork: isImagePath(currentTrack.coverArt)
        ? [{ src: currentTrack.coverArt, sizes: "512x512", type: "image/png" }]
        : [],
    });

    // Set action handlers
    mediaSession.setActionHandler("play", () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    });

    mediaSession.setActionHandler("pause", () => {
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    });

    mediaSession.setActionHandler("previoustrack", () => {
      skipPrevious();
    });

    mediaSession.setActionHandler("nexttrack", () => {
      skipNext();
    });

    // Update playback state
    mediaSession.playbackState = isPlaying ? "playing" : "paused";

    return () => {
      // Cleanup
      if (mediaSession.metadata) {
        mediaSession.metadata = null;
      }
    };
  }, [currentTrack, isPlaying, skipNext, skipPrevious]);

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
        isMuted,
        toggleMute,
        progress,
        setProgress,
        seek,
        duration,
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
            setDuration(audio.duration);
          }
        }}
        onLoadedMetadata={(e) => {
          const audio = e.currentTarget;
          if (audio.duration) {
            setDuration(audio.duration);
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

