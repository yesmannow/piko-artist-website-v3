"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { VideoHero } from "@/components/video/VideoHero";
import { VideoGrid } from "@/components/video/VideoGrid";
import { tracks } from "@/lib/data";
import { X } from "lucide-react";

export default function VideosPage() {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const pathname = usePathname();

  // Close video modal on route change to prevent overlays persisting
  useEffect(() => {
    // Close modal immediately when pathname changes
    if (selectedVideoId) {
      setSelectedVideoId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Only depend on pathname to avoid infinite loops
  const videos = tracks.filter(t => t.type === 'video');
  const featuredVideo = videos.length > 0 ? videos[videos.length - 1] : null;
  const gridVideos = videos.length > 1 ? videos.slice(0, -1) : [];

  // Optional: Early return for empty state
  if (!videos.length) {
    return (
      <div className="min-h-screen bg-background pt-20 md:pt-24 pb-12 md:pb-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl md:text-8xl font-black text-white tracking-tighter mb-2">
              VISUAL{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ccff00] to-green-500">
                ARCHIVE
              </span>
            </h1>
            <p className="text-zinc-400 font-mono">
              Exploring the visual landscape of sound.
            </p>
          </div>
          <div className="text-center text-foreground/60 py-12 font-industrial">No videos available.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 md:pt-24 pb-12 md:pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-header text-foreground tracking-tighter mb-2">
            VISUAL{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-toxic-lime to-green-500">
              ARCHIVE
            </span>
          </h1>
          <p className="text-foreground/60 font-industrial text-sm md:text-base">
            Exploring the visual landscape of sound.
          </p>
        </div>

        {featuredVideo ? (
          <VideoHero featuredVideo={featuredVideo} onPlay={setSelectedVideoId} />
        ) : (
          <p className="text-center text-white">No featured video available.</p>
        )}

        <VideoGrid videos={gridVideos} onPlay={setSelectedVideoId} />

        {selectedVideoId && (
          <div
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
            data-modal-open="true"
          >
            <button
              onClick={() => setSelectedVideoId(null)}
              className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full hover:bg-white hover:text-black transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1&rel=0`}
                className="w-full h-full"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


