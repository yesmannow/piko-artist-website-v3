"use client";

import { useAudio } from "@/context/AudioContext";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { useHaptic } from "@/hooks/useHaptic";
import Image from "next/image";
import { Waveform } from "@/components/dj-ui/Waveform";

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
    isMuted,
    toggleMute,
    audioRef,
    progress,
    seek,
    duration,
  } = useAudio();

  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Helper to check if coverArt is an image path
  const isImagePath = (coverArt: string): boolean => {
    return coverArt.startsWith("/");
  };

  // MediaSession API integration
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
      }
    });

    mediaSession.setActionHandler("pause", () => {
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
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
  }, [currentTrack, isPlaying, skipNext, skipPrevious, audioRef]);


  // Show player only when a track is selected
  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 w-full z-50 bg-[#0a0a0a] border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center gap-4 md:gap-6">
          {/* Left: Album Art, Track Title, Artist */}
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            {/* Album Art */}
            {isImagePath(currentTrack.coverArt) ? (
              <div className="w-12 h-12 md:w-16 md:h-16 rounded overflow-hidden flex-shrink-0 relative">
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
                className={`w-12 h-12 md:w-16 md:h-16 rounded bg-gradient-to-r ${currentTrack.coverArt} flex-shrink-0`}
              />
            )}

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm md:text-base truncate">
                {currentTrack.title}
              </div>
              <div className="text-zinc-400 text-xs md:text-sm truncate">
                {currentTrack.artist}
              </div>
            </div>
          </div>

          {/* Center: Play/Pause, Skip Back/Forward + Waveform (Desktop) */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl mx-4">
            {/* Controls */}
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => {
                  triggerHaptic();
                  skipPrevious();
                }}
                className="p-2 hover:bg-zinc-800 rounded transition-colors"
                aria-label="Previous track"
              >
                <SkipBack className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </button>

              <button
                onClick={() => {
                  triggerHaptic();
                  togglePlay();
                }}
                className="p-2 md:p-3 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <Play className="w-5 h-5 md:w-6 md:h-6 ml-0.5" />
                )}
              </button>

              <button
                onClick={() => {
                  triggerHaptic();
                  skipNext();
                }}
                className="p-2 hover:bg-zinc-800 rounded transition-colors"
                aria-label="Next track"
              >
                <SkipForward className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </button>
            </div>

            {/* Waveform (Desktop only) */}
            {!isMobile && currentTrack && currentTrack.type === "audio" && (
              <div className="w-full px-2">
                <Waveform
                  audioUrl={currentTrack.src}
                  progress={progress}
                  isPlaying={isPlaying}
                  onSeek={(time) => {
                    triggerHaptic();
                    seek(time);
                  }}
                  height={60}
                />
              </div>
            )}

            {/* Simple Progress Bar (Mobile only) */}
            {isMobile && (
              <div className="w-full h-1 bg-zinc-700 rounded-full">
                <div
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          {/* Right: Volume Slider (0-100) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic();
                toggleMute();
              }}
              className="p-1 hover:bg-zinc-800 rounded transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={isMuted ? 0 : volume * 100}
              onChange={(e) => {
                const newVolume = parseFloat(e.target.value) / 100;
                setVolume(newVolume);
                if (audioRef.current) {
                  audioRef.current.volume = newVolume;
                }
                if (newVolume > 0 && isMuted) {
                  toggleMute();
                }
              }}
              aria-label="Volume control"
              className="w-20 md:w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor: "#ffffff",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

