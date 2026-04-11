"use client";

import { createContext, useContext, useState, useRef, ReactNode, useEffect, useCallback } from "react";
import { MediaItem, tracks as staticTracks } from "@/lib/data";

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
  stop: () => void;
  /** Replace the active playlist used by skipNext / skipPrevious. */
  setPlaylist: (tracks: MediaItem[]) => void;
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
  const fallbackAttemptedRef = useRef<boolean>(false);
  // Active playlist used by skipNext / skipPrevious (defaults to static audio tracks)
  const [playlist, setPlaylist] = useState<MediaItem[]>(() =>
    staticTracks.filter((t) => t.type === "audio")
  );

  const getFallbackSrc = useCallback((trackId: string) => {
    const fileId = trackId === "12-05" ? "12_05" : trackId;
    return `https://pub-9d6c022e6cbf422ea4fcac0a116cbfce.r2.dev/audio/${fileId}.mp3`;
  }, []);

  const attemptFallback = useCallback(() => {
    if (!audioRef.current || !currentTrack || fallbackAttemptedRef.current) return;

    fallbackAttemptedRef.current = true;
    const fallbackSrc = getFallbackSrc(currentTrack.id);

    audioRef.current.src = fallbackSrc;
    audioRef.current.load();
    audioRef.current.play().catch((error: Error) => {
      if (error.name === "AbortError") return;
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Fallback playback failed:", error);
      }
      setIsPlaying(false);
    });
  }, [currentTrack, getFallbackSrc]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((error: Error) => {
        if (error.name === "AbortError") return;
        setIsPlaying(false);
        attemptFallback();
      });
    }
    setIsPlaying(!isPlaying);
  }, [attemptFallback, currentTrack, isPlaying]);

  const playTrack = useCallback((track: MediaItem) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
    setDuration(0);
    fallbackAttemptedRef.current = false;

    // Load and play the track
    if (audioRef.current) {
      if (track.type === "audio") {
        audioRef.current.src = track.src;
        audioRef.current.load();
        audioRef.current.play().catch((error: Error) => {
          if (error.name === "AbortError") return;
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.error("Error playing audio:", error);
          }
          setIsPlaying(false);
          attemptFallback();
        });
      } else {
        // For video tracks, we might need different handling
        // For now, just set the track
        setIsPlaying(false);
      }
    }
  }, [attemptFallback]);

  const skipNext = useCallback(() => {
    if (!currentTrack) return;
    const audioTracks = playlist.filter((t) => t.type === "audio");
    const currentIndex = audioTracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % audioTracks.length;
    playTrack(audioTracks[nextIndex]);
  }, [currentTrack, playTrack, playlist]);

  const skipPrevious = useCallback(() => {
    if (!currentTrack) return;
    const audioTracks = playlist.filter((t) => t.type === "audio");
    const currentIndex = audioTracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? audioTracks.length - 1 : currentIndex - 1;
    playTrack(audioTracks[prevIndex]);
  }, [currentTrack, playTrack, playlist]);

  const seek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    if (audioRef.current.duration) {
      setProgress((time / audioRef.current.duration) * 100);
    }
  };

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTrack(null);
    setProgress(0);
    setDuration(0);
    fallbackAttemptedRef.current = false;
  }, []);

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
        stop,
        setPlaylist,
      }}
    >
      {children}
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          attemptFallback();
        }}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          if (audio.duration && Number.isFinite(audio.duration) && audio.duration > 0) {
            setProgress((audio.currentTime / audio.duration) * 100);
            setDuration(audio.duration);
          }
        }}
        onLoadedMetadata={(e) => {
          const audio = e.currentTarget;
          if (audio.duration && Number.isFinite(audio.duration) && audio.duration > 0) {
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
