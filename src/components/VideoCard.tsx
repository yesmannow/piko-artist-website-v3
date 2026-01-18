"use client";

import Image from "next/image";

interface VideoCardProps {
  video: {
    title: string;
    category?: string;
    thumbnail?: string | null;
  };
}

/**
 * Lightweight video card scaffold for archive or featured grids.
 * Uses a simple thumbnail with a muted metadata block.
 */
export default function VideoCard({ video }: VideoCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5 shadow-md">
      <div className="relative aspect-video w-full">
        <Image
          src={video.thumbnail || "/placeholder-video.jpg"}
          alt={video.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={false}
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white">{video.title}</h3>
        {video.category ? (
          <p className="text-sm uppercase tracking-[0.12em] text-white/60">
            {video.category}
          </p>
        ) : null}
      </div>
    </div>
  );
}
