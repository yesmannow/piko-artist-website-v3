"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import Image from "next/image";
import { tracks, MediaItem } from "@/lib/data";
import { X, Play } from "lucide-react";

// Thumbnail component with fallback strategy
function VideoThumbnail({ videoId, title, className }: { videoId: string; title: string; className?: string }) {
  const [imgSrc, setImgSrc] = useState(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={title}
      fill
      className={className}
      onError={handleError}
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      unoptimized={imgSrc.includes('i.ytimg.com')} // YouTube images are already optimized
    />
  );
}

// Video Card Component
function VideoCard({ video, onPlay }: { video: MediaItem; onPlay: (id: string) => void }) {
  if (!video?.id) return null;

  return (
    <div
      key={video.id}
      className="group relative aspect-video bg-zinc-900 rounded-lg overflow-hidden cursor-pointer border-2 border-zinc-800 hover:border-toxic-lime transition-all shadow-lg hover:shadow-xl"
      onClick={() => onPlay(video.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay(video.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Play video: ${video.title}`}
    >
      <div className="relative w-full h-full">
        <VideoThumbnail
          videoId={video.id}
          title={video.title}
          className="object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100"
        />
      </div>

      {/* Play Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
        <div className="w-12 h-12 bg-[#ccff00] rounded-full flex items-center justify-center shadow-[0_0_20px_#ccff00]">
          <Play className="w-5 h-5 text-black fill-current" />
        </div>
      </div>

      {/* Info Overlay */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
        <h3 className="text-white font-bold truncate">{video.title}</h3>
        <p className="text-[#ccff00] text-xs font-mono uppercase tracking-wider mt-1">{video.vibe}</p>
      </div>
    </div>
  );
}

// Featured Video Hero Component
function FeaturedVideoHero({ video, onPlay }: { video: MediaItem; onPlay: (id: string) => void }) {
  if (!video?.id) return null;

  return (
    <div
      className="relative w-full h-[60vh] md:h-[70vh] mb-8 md:mb-12 rounded-lg overflow-hidden border-2 border-zinc-800 shadow-2xl group cursor-pointer focus-within:ring-2 focus-within:ring-toxic-lime focus-within:ring-offset-2"
      onClick={() => onPlay(video.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay(video.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Play featured video: ${video.title}`}
    >
      {/* Background Image */}
      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
        <div className="relative w-full h-full">
          <VideoThumbnail
            videoId={video.id}
            title={video.title}
            className="object-cover"
          />
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full md:w-2/3">
        <span className="inline-block px-3 py-1 mb-4 text-xs font-bold text-black bg-[#ccff00] rounded-full uppercase tracking-widest">
          Latest Drop
        </span>
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 uppercase leading-none tracking-tighter">
          {video.title}
        </h1>
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-toxic-lime transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-toxic-lime focus:ring-offset-2 focus:ring-offset-black"
            aria-label="Watch featured video"
          >
            <Play className="w-5 h-5 fill-current" />
            WATCH NOW
          </button>
          <span className="text-zinc-400 font-mono text-sm uppercase tracking-wider">
            {video.vibe.toUpperCase()} EDITION
          </span>
        </div>
      </div>
    </div>
  );
}

// Video Modal Component
function VideoModal({ videoId, onClose }: { videoId: string | null; onClose: () => void }) {
  const pathname = usePathname();

  // Close modal on route change
  useEffect(() => {
    if (videoId) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close on ESC key
  useEffect(() => {
    if (!videoId) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [videoId, onClose]);

  if (!videoId) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
      data-modal-open="true"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full hover:bg-white hover:text-black transition-colors z-10"
        aria-label="Close video"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          title="Video player"
        />
      </div>
    </div>
  );
}

export default function VideosPage() {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "HYPE" | "CHILL" | "STORYTELLING" | "CLASSIC">("ALL");
  const pathname = usePathname();
  const lenis = useLenis();

  // Derived data - defensive checks
  const videos = useMemo(() => {
    return tracks.filter((t): t is MediaItem => t.type === 'video' && !!t.id);
  }, []);

  const featuredVideo = useMemo(() => {
    return videos.length > 0 ? videos[videos.length - 1] : null;
  }, [videos]);

  const gridVideos = useMemo(() => {
    if (!featuredVideo) return videos;
    return videos.filter(v => v.id !== featuredVideo.id);
  }, [videos, featuredVideo]);

  const availableFilters = useMemo(() => {
    const vibes = new Set(videos.map(v => v.vibe?.toUpperCase()).filter(Boolean) as string[]);
    return ["ALL", ...Array.from(vibes).sort()] as Array<"ALL" | "HYPE" | "CHILL" | "STORYTELLING" | "CLASSIC">;
  }, [videos]);

  const filteredVideos = useMemo(() => {
    if (filter === "ALL") return gridVideos;
    return gridVideos.filter(v => v.vibe?.toUpperCase() === filter);
  }, [gridVideos, filter]);

  // Close modal on route change
  useEffect(() => {
    if (selectedVideoId) {
      setSelectedVideoId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Scroll sanity: reset scroll on route change and unmount
  useEffect(() => {
    // Reset scroll immediately on mount/route change
    if (lenis) {
      try {
        lenis.stop();
        lenis.scrollTo(0, { immediate: true });
        lenis.start();
      } catch {
        // Fallback if Lenis fails
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        }
      }
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
    };
  }, [pathname, lenis]);

  // Empty state
  if (videos.length === 0) {
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

        {/* Featured Video Hero */}
        {featuredVideo && (
          <FeaturedVideoHero
            video={featuredVideo}
            onPlay={setSelectedVideoId}
          />
        )}

        {/* Filter Bar */}
        {availableFilters.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {availableFilters.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2.5 text-xs font-bold rounded-full border-2 transition-all min-h-[44px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-toxic-lime focus:ring-offset-2 ${
                  filter === cat
                    ? "bg-white text-black border-white shadow-lg"
                    : "bg-transparent text-foreground/60 hover:text-foreground hover:border-foreground/30 hover:bg-foreground/5"
                }`}
                aria-label={`Filter by ${cat}`}
                aria-pressed={filter === cat}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Video Grid */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onPlay={setSelectedVideoId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-foreground/60 py-12 font-industrial">
            No videos found for this filter.
          </div>
        )}

        {/* Video Modal */}
        <VideoModal
          videoId={selectedVideoId}
          onClose={() => setSelectedVideoId(null)}
        />
      </div>
    </div>
  );
}
