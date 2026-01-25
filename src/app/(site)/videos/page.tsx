"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { VideoModal } from "@/components/VideoModal";
import videosData from "@/lib/data/videos.json";

// Video data type
interface Video {
  id: string;
  title: string;
  thumbnail: string;
  embedUrl?: string;
}

// Loading Skeleton Component
function VideoGridSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20 md:pt-24 pb-12 md:pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 md:mb-12 pb-6 border-b border-[#2A2A2A]">
          <div className="h-12 w-64 bg-[#2A2A2A] mb-4 md:mb-0 animate-pulse" />
          <div className="h-11 w-40 bg-[#2A2A2A] animate-pulse" />
        </header>
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="aspect-video bg-[#2A2A2A] border border-[#2A2A2A] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Video Card Component with Massive Glassmorphism
function VideoCard({ video, onClick }: { video: Video; onClick: () => void }) {
  // Use image-proxy API to wrap the YouTube thumbnail URL
  const thumbnailUrl = `/api/image-proxy?url=${encodeURIComponent(video.thumbnail)}`;

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:scale-[1.02] hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_50px_rgba(255,255,255,0.1)]"
      aria-label={`Play ${video.title}`}
    >
      {/* Thumbnail Wrapper */}
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      </div>

      {/* Play Icon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-20 h-20 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
          <svg
            className="w-10 h-10 text-white ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Title Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
        <h3 className="text-white text-2xl md:text-3xl font-black uppercase tracking-tighter line-clamp-2 text-left">
          {video.title}
        </h3>
      </div>
    </button>
  );
}

// Video Grid Component
function VideoGrid({ videos }: { videos: Video[] }) {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedVideoTitle, setSelectedVideoTitle] = useState<string | undefined>(undefined);

  const handleVideoClick = (video: Video) => {
    setSelectedVideoId(video.id);
    setSelectedVideoTitle(video.title);
  };

  const handleCloseModal = () => {
    setSelectedVideoId(null);
    setSelectedVideoTitle(undefined);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} onClick={() => handleVideoClick(video)} />
        ))}
      </div>

      {/* Video Modal */}
      {selectedVideoId && (
        <VideoModal
          isOpen={!!selectedVideoId}
          onClose={handleCloseModal}
          videoId={selectedVideoId}
          videoTitle={selectedVideoTitle}
        />
      )}
    </>
  );
}

// Main Videos Page Component
export default function VideosPage() {
  const videos = (videosData || []) as Video[];

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-20 md:pt-24 pb-12 md:pb-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 md:mb-12 pb-6 border-b border-[#2A2A2A]">
            <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tighter mb-4 md:mb-0">
              Piko FG // The Vault
            </h1>
            <Link
              href="https://www.youtube.com/@PikoFG?sub_confirmation=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#FFD400] text-black font-bold uppercase tracking-wider transition-colors hover:bg-[#FFD400]/90 focus:outline-none focus:ring-2 focus:ring-[#FFD400] focus:ring-offset-2 focus:ring-offset-[#0A0A0A] min-h-[44px]"
            >
              Subscribe Now
            </Link>
          </header>
          <div className="text-white/60 font-mono text-sm uppercase tracking-wider text-center py-12">
            No videos available.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20 md:pt-24 pb-12 md:pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 md:mb-12 pb-6 border-b border-[#2A2A2A]">
          <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tighter mb-4 md:mb-0">
            Piko FG // The Vault
          </h1>
          <Link
            href="https://www.youtube.com/@PikoFG?sub_confirmation=1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#FFD400] text-black font-bold uppercase tracking-wider transition-colors hover:bg-[#FFD400]/90 focus:outline-none focus:ring-2 focus:ring-[#FFD400] focus:ring-offset-2 focus:ring-offset-[#0A0A0A] min-h-[44px]"
          >
            Subscribe Now
          </Link>
        </header>

        {/* Video Grid */}
        <Suspense fallback={<VideoGridSkeleton />}>
          <VideoGrid videos={videos} />
        </Suspense>
      </div>
    </div>
  );
}
