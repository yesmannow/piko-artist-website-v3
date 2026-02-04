"use client";

import { createContext, useContext, useState, useRef, ReactNode, useEffect, useCallback, useMemo } from "react";
import { MediaItem, tracks } from "@/lib/data";

type WebkitWindow = Window & typeof globalThis & { webkitAudioContext?: typeof window.AudioContext };

interface AudioContextType {
  currentTrack: MediaItem | null;
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentTime: number;
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
  analyserNode: AnalyserNode | null;
  ensureAnalyser: () => AnalyserNode | null;
  immersiveOpen: boolean;
  setImmersiveOpen: (open: boolean) => void;
  playbackError: string | null;
  clearPlaybackError: () => void;
}

const AudioPlayerContext = createContext<AudioContextType | undefined>(undefined);
const audioContextSingletonRef: { current: globalThis.AudioContext | null } = { current: null };

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<MediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [immersiveOpen, setImmersiveOpen] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const previousVolumeRef = useRef<number>(1);
  const webAudioContextRef = useRef<globalThis.AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  const ensureAnalyser = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return null;

    // Create or reuse singleton AudioContext + analyser graph
    if (!audioContextSingletonRef.current) {
      const AudioCtx = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
      if (!AudioCtx) return null;
      audioContextSingletonRef.current = new AudioCtx();
    }
    if (!webAudioContextRef.current) {
      webAudioContextRef.current = audioContextSingletonRef.current;
    }
    const audioCtx = webAudioContextRef.current;

    if (!analyserNodeRef.current) {
      analyserNodeRef.current = audioCtx.createAnalyser();
      analyserNodeRef.current.fftSize = 256;
      analyserNodeRef.current.smoothingTimeConstant = 0.8;
    }

    // MediaElementSourceNode can only be created once per <audio> element
    if (!sourceNodeRef.current) {
      try {
        sourceNodeRef.current = audioCtx.createMediaElementSource(audioEl);
        sourceNodeRef.current.connect(analyserNodeRef.current);
        analyserNodeRef.current.connect(audioCtx.destination);
      } catch {
        // If the browser throws (e.g. already connected), fail gracefully
        return analyserNodeRef.current;
      }
    }

    return analyserNodeRef.current;
  }, []);

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        setIsPlaying(false);
      });
      // Visualizer graph (requires user gesture for iOS)
      const analyser = ensureAnalyser();
      if (webAudioContextRef.current && analyser) {
        webAudioContextRef.current.resume().catch(() => {});
      }
    }
  };

  const playTrack = useCallback((track: MediaItem) => {
    setCurrentTrack(track);

    // Load and play the track
    if (audioRef.current) {
      if (track.type === "audio") {
        // Pause and reset before loading new track to prevent AbortError
        // This handles the case where a new track is loaded while another is playing
        audioRef.current.pause();
        audioRef.current.currentTime = 0;

        // Set source and load
        audioRef.current.src = track.src;
        audioRef.current.load();

        // Track if we've attempted to play to avoid duplicate attempts
        let hasAttemptedPlay = false;

        // Wait for audio to be ready before playing
        const handleCanPlay = () => {
          if (audioRef.current && !hasAttemptedPlay) {
            hasAttemptedPlay = true;
            audioRef.current.removeEventListener("canplay", handleCanPlay);
            audioRef.current.removeEventListener("error", handleError);

            // Play the track
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  setIsPlaying(true);
                  // Visualizer graph (requires user gesture for iOS)
                  const analyser = ensureAnalyser();
                  if (webAudioContextRef.current && analyser) {
                    webAudioContextRef.current.resume().catch(() => {});
                  }
                })
                .catch((error) => {
                  if (process.env.NODE_ENV === "development") {

                    console.error("Error playing audio:", error);
                  }
                  setIsPlaying(false);
                });
            }
          }
        };

        const handleError = (_e?: Event) => {
          hasAttemptedPlay = true;
          if (audioRef.current) {
            audioRef.current.removeEventListener("canplay", handleCanPlay);
            audioRef.current.removeEventListener("error", handleError);
          }
          const errorMsg = audioRef.current?.error
            ? `Audio error (code ${audioRef.current.error.code})`
            : "Failed to load audio file";
          setPlaybackError(`Unable to play "${track.title}". ${errorMsg}`);
          setIsPlaying(false);
        };

        // Add event listeners
        audioRef.current.addEventListener("canplay", handleCanPlay, { once: true });
        audioRef.current.addEventListener("error", handleError, { once: true });

        // Fallback: if canplay doesn't fire within reasonable time, try playing anyway
        setTimeout(() => {
          if (audioRef.current && !hasAttemptedPlay) {
            hasAttemptedPlay = true;
            audioRef.current.removeEventListener("canplay", handleCanPlay);
            audioRef.current.removeEventListener("error", handleError);
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
            }
          }
        }, 1000);
      } else {
        // For video tracks, we might need different handling
        // For now, just set the track
        setIsPlaying(false);
      }
    }
  }, [ensureAnalyser]);

  const skipNext = useCallback(() => {
    if (!currentTrack) return;
    const audioTracks = tracks.filter((t) => t.type === "audio");
    const currentIndex = audioTracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % audioTracks.length;
    playTrack(audioTracks[nextIndex]);
  }, [currentTrack, playTrack]);

  const skipPrevious = useCallback(() => {
    if (!currentTrack) return;
    const audioTracks = tracks.filter((t) => t.type === "audio");
    const currentIndex = audioTracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? audioTracks.length - 1 : currentIndex - 1;
    playTrack(audioTracks[prevIndex]);
  }, [currentTrack, playTrack]);

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
    setCurrentTime(0);
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

  // Memoize context value to avoid accessing refs during render
  // Note: analyserNode is NOT included here since it's a ref value
  // Use ensureAnalyser() to get the analyser node instead
  const contextValue = useMemo(() => ({
    currentTrack,
    isPlaying,
    audioRef,
    currentTime,
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
    analyserNode: null as AnalyserNode | null, // Always null - use ensureAnalyser() instead
    ensureAnalyser,
    immersiveOpen,
    setImmersiveOpen,
    playbackError,
    clearPlaybackError: () => setPlaybackError(null),
  }), [
    currentTrack,
    isPlaying,
    audioRef,
    currentTime,
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
    ensureAnalyser,
    immersiveOpen,
    setImmersiveOpen,
    playbackError,
  ]);

  return (
    <AudioPlayerContext.Provider value={contextValue}>
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
            setCurrentTime(audio.currentTime);
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
    </AudioPlayerContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
