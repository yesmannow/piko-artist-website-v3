"use client";

import { useState } from "react";
import { VideoHero } from "@/components/video/VideoHero";
import { VideoGrid } from "@/components/video/VideoGrid";
import { tracks } from "@/lib/data";
import { X } from "lucide-react";

export default function VideosPage() {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const videos = tracks.filter(t => t.type === 'video');
  const featuredVideo = videos[videos.length - 1]; // Newest video

  return (
    <div className="min-h-screen bg-[#121212] pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-8xl font-black text-white tracking-tighter mb-2">
            VISUAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ccff00] to-green-500">ARCHIVE</span>
          </h1>
          <p className="text-zinc-400 font-mono">Exploring the visual landscape of sound.</p>
        </div>

        <VideoHero featuredVideo={featuredVideo} onPlay={setSelectedVideoId} />
        <VideoGrid onPlay={setSelectedVideoId} />

        {/* Video Modal */}
        {selectedVideoId && (
          <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12">
            <button
              onClick={() => setSelectedVideoId(null)}
              className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full hover:bg-white hover:text-black transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1&rel=0`}
                className="w-full h-full"
                allow="autoplay; encrypted-media; fullscreen"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


