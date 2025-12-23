"use client";

import { Drawer } from "vaul";
import Image from "next/image";
import { Play, ExternalLink } from "lucide-react";
import { MediaItem } from "@/lib/data";
import { useAudio } from "@/context/AudioContext";
import { useHaptic } from "@/hooks/useHaptic";
import { useState, useEffect } from "react";

interface TrackDrawerProps {
  track: MediaItem;
  children: React.ReactNode;
  onDesktopClick?: () => void;
}

// Helper function to check if coverArt is an image path
const isImagePath = (coverArt: string): boolean => {
  return coverArt.startsWith("/");
};

export function TrackDrawer({ track, children }: TrackDrawerProps) {
  const { playTrack } = useAudio();
  const triggerHaptic = useHaptic();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handlePlay = () => {
    triggerHaptic();
    playTrack(track);
  };

  // On desktop, just render children (they already have onClick handlers)
  if (!isMobile) {
    return <>{children}</>;
  }

  // On mobile, render drawer
  return (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        {children}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content
          className="border-t-2 border-toxic-lime flex flex-col rounded-t-[10px] h-[96%] mt-24 fixed bottom-0 left-0 right-0 z-50 focus:outline-none relative"
          style={{
            backgroundColor: "#2a2a2a",
            backgroundImage: `
              linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
              url("https://www.transparenttextures.com/patterns/concrete-wall.png")
            `,
            backgroundBlendMode: "overlay",
          }}
        >
          {/* Drag Handle - Toxic Lime with caution tape style */}
          <div className="relative w-12 h-1.5 mx-auto mb-6 mt-4">
            <div
              className="w-full h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #ccff00 0%, #ccff00 25%, #000 25%, #000 50%, #ccff00 50%, #ccff00 75%, #000 75%, #000 100%)",
                boxShadow: "0 0 8px rgba(204, 255, 0, 0.5)",
              }}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-8">
            {/* Large Cover Art */}
            <div className="relative aspect-square w-full max-w-sm mx-auto mb-6 rounded-lg overflow-hidden border-2 border-black">
              {isImagePath(track.coverArt) ? (
                <Image
                  src={track.coverArt}
                  alt={track.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-r ${track.coverArt}`} />
              )}
            </div>

            {/* Track Title */}
            <h2 className="font-header text-3xl md:text-4xl font-bold text-white mb-2 text-center">
              {track.title}
            </h2>

            {/* Artist */}
            <p className="font-industrial font-bold uppercase tracking-wider text-lg text-white/70 mb-8 text-center">
              {track.artist}
            </p>

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* PLAY NOW Button */}
              <Drawer.Close asChild>
                <button
                  onClick={handlePlay}
                  className="w-full px-6 py-4 bg-toxic-lime text-black font-industrial font-bold text-lg uppercase tracking-wider rounded-lg border-2 border-black shadow-hard flex items-center justify-center gap-3 hover:bg-toxic-lime/90 transition-colors"
                >
                  <Play className="w-6 h-6" fill="currentColor" />
                  PLAY NOW
                </button>
              </Drawer.Close>

              {/* STREAM ON SPOTIFY Link */}
              <a
                href={`https://open.spotify.com/search/${encodeURIComponent(track.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-6 py-4 bg-zinc-800 text-white font-industrial font-bold text-lg uppercase tracking-wider rounded-lg border-2 border-zinc-700 flex items-center justify-center gap-3 hover:bg-zinc-700 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                STREAM ON SPOTIFY
              </a>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

