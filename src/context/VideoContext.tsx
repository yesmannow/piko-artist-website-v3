"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAudio } from "./AudioContext";

interface VideoContextType {
  currentVideoId: string | null;
  isMinimized: boolean;
  playVideo: (id: string) => void;
  closeVideo: () => void;
  toggleMinimize: () => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export function VideoProvider({ children }: { children: ReactNode }) {
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const { isPlaying, togglePlay } = useAudio();
  const pathname = usePathname();
  // Track if music was playing before video opened, so we can resume it
  const wasMusicPlayingRef = useRef(false);

  // Close video on route change to prevent overlays persisting
  useEffect(() => {
    if (currentVideoId) {
      // Resume music if it was playing before video opened
      if (wasMusicPlayingRef.current && !isPlaying) {
        togglePlay();
      }
      wasMusicPlayingRef.current = false;
      setCurrentVideoId(null);
      setIsMinimized(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isPlaying, togglePlay]); // Only depend on pathname to avoid infinite loops

  const playVideo = (id: string) => {
    // Pause any currently playing music and remember its state
    if (isPlaying) {
      wasMusicPlayingRef.current = true;
      togglePlay(); // This will pause if currently playing
    } else {
      wasMusicPlayingRef.current = false;
    }

    setCurrentVideoId(id);
    setIsMinimized(false);
  };

  const closeVideo = () => {
    // Resume music if it was playing before video opened
    if (wasMusicPlayingRef.current && !isPlaying) {
      togglePlay();
    }
    wasMusicPlayingRef.current = false;
    setCurrentVideoId(null);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <VideoContext.Provider
      value={{
        currentVideoId,
        isMinimized,
        playVideo,
        closeVideo,
        toggleMinimize,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
}

export function useVideo() {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error("useVideo must be used within a VideoProvider");
  }
  return context;
}

