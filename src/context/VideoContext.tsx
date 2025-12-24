"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
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

  // Close video on route change to prevent overlays persisting
  useEffect(() => {
    if (currentVideoId) {
      setCurrentVideoId(null);
      setIsMinimized(false);
    }
  }, [pathname]); // Only depend on pathname, not currentVideoId

  const playVideo = (id: string) => {
    // Pause any currently playing music
    if (isPlaying) {
      togglePlay(); // This will pause if currently playing
    }

    setCurrentVideoId(id);
    setIsMinimized(false);
  };

  const closeVideo = () => {
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

