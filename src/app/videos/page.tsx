"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Play, Sparkles, X } from "lucide-react";
import {
  VideoFilterNav,
  type VideoCategory,
} from "@/components/content/video/VideoFilterNav";
import { tracks, MediaItem } from "@/lib/data";

const fallbackImages = [
  "/images/tracks/abstract-1846847_1280.jpg",
  "/images/tracks/aurora-borealis-9267515_1280.jpg",
  "/images/tracks/background-1833056_1280.jpg",
  "/images/tracks/dj-2581269_1280.jpg",
  "/images/tracks/graffiti-1476119_1280.jpg",
  "/images/tracks/graffiti-3750912_1280.jpg",
  "/images/tracks/starry-sky-1655503_1280.jpg",
  "/images/tracks/wallpaper-5928106_1280.png",
];

function VideoThumbnail({
  videoId,
  title,
  className,
}: {
  videoId: string;
  title: string;
  className?: string;
}) {
  const [src, setSrc] = useState(
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
  );
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSrc(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`);
    setFailed(false);
    setLoading(true);
  }, [videoId]);

  const fallback = useMemo(() => {
    const hash =
      videoId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      fallbackImages.length;
    return fallbackImages[hash];
  }, [videoId]);

  if (failed) {
    return (
      <div className={`relative h-full w-full overflow-hidden ${className}`}>
        <Image
          src={fallback}
          alt={title}
          fill
          className="object-cover opacity-70"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-sm uppercase tracking-[0.22em] text-white/80">
          Thumbnail queued
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Image
        src={src}
        alt={title}
        fill
        className={className}
        onLoad={() => setLoading(false)}
        onError={() => {
          if (src.includes("maxres")) {
            setSrc(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
            setLoading(true);
          } else {
            setFailed(true);
            setLoading(false);
          }
        }}
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        unoptimized
      />
      {loading ? (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
      ) : null}
    </div>
  );
}

function FeaturedVideoCard({
  video,
  onPlay,
}: {
  video: MediaItem;
  onPlay: (id: string) => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b0f1c] via-[#0b1224] to-[#0f172a] p-6 sm:p-8"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(193,255,0,0.12),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(124,58,237,0.18),transparent_40%)]" />
      <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/70">
            <Sparkles className="h-4 w-4 text-[#c1ff00]" />
            Latest Drop
          </div>
          <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">
            {video.title}
          </h1>
          <p className="text-white/70 text-sm">
            Dive into the newest session, then jump into the archive by vibe.
          </p>
          <button
            type="button"
            onClick={() => onPlay(video.id)}
            className="inline-flex items-center gap-3 rounded-full bg-[#c1ff00] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black shadow-[0_10px_30px_rgba(193,255,0,0.35)] transition-transform hover:scale-[1.02]"
          >
            <Play className="h-4 w-4" />
            Watch Now
          </button>
        </div>
        <div className="relative h-64 overflow-hidden rounded-2xl border border-white/10">
          <VideoThumbnail
            videoId={video.id}
            title={video.title}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute left-4 bottom-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
            <span className="rounded-full bg-white/10 px-3 py-1">
              {video.vibe}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">Featured</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function ArchiveVideoCard({
  video,
  onPlay,
}: {
  video: MediaItem;
  onPlay: (id: string) => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
      whileHover={{ y: -3 }}
    >
      <button
        type="button"
        onClick={() => onPlay(video.id)}
        className="absolute inset-0 z-10"
        aria-label={`Play ${video.title}`}
      />
      <div className="relative h-48 overflow-hidden">
        <VideoThumbnail
          videoId={video.id}
          title={video.title}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white">
          {video.vibe}
        </div>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="truncate text-base font-semibold text-white">
          {video.title}
        </h3>
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">
          {video.artist}
        </p>
      </div>
    </motion.article>
  );
}

function VideoModal({
  videoId,
  onClose,
}: {
  videoId: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!videoId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:border-[#c1ff00]/40"
          aria-label="Close video"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex h-full items-center justify-center p-4 sm:p-8">
          <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
              className="h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title="Video player"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function VideosPage() {
  const [filter, setFilter] = useState<VideoCategory>("ALL");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const videos = useMemo(
    () =>
      tracks.filter((t): t is MediaItem => t.type === "video" && Boolean(t.id)),
    [],
  );

  const featuredVideo = videos.at(-1) ?? null;
  const archiveVideos = useMemo(
    () =>
      featuredVideo ? videos.filter((v) => v.id !== featuredVideo.id) : videos,
    [videos, featuredVideo],
  );

  const categories = useMemo<VideoCategory[]>(() => {
    const base: VideoCategory[] = [
      "ALL",
      "HYPE",
      "CHILL",
      "STORYTELLING",
      "CLASSIC",
    ];
    const present = new Set(
      videos
        .map((v) => v.vibe?.toUpperCase())
        .filter(Boolean) as VideoCategory[],
    );
    return base.filter((cat) => cat === "ALL" || present.has(cat));
  }, [videos]);

  const filteredVideos = useMemo(() => {
    if (filter === "ALL") return archiveVideos;
    return archiveVideos.filter((v) => v.vibe?.toUpperCase() === filter);
  }, [archiveVideos, filter]);

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-white/70">
          No videos available.
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(193,255,0,0.12),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(124,58,237,0.16),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(34,211,238,0.12),transparent_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:120px_120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/70">
            Visual Archive
          </div>
          <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl">
            Videos & Sessions
          </h1>
          <p className="text-white/65 text-sm sm:text-base">
            Latest drop + archive grid with vibe filters and resilient
            thumbnails.
          </p>
        </div>

        {featuredVideo ? (
          <FeaturedVideoCard
            video={featuredVideo}
            onPlay={setSelectedVideoId}
          />
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-white/60">
              Archive Filters
            </p>
            <VideoFilterNav
              categories={categories}
              active={filter}
              onChange={setFilter}
            />
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">
            {filteredVideos.length} videos
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => (
            <ArchiveVideoCard
              key={video.id}
              video={video}
              onPlay={setSelectedVideoId}
            />
          ))}
        </div>
      </div>

      <VideoModal
        videoId={selectedVideoId}
        onClose={() => setSelectedVideoId(null)}
      />
    </div>
  );
}
