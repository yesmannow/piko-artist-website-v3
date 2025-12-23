"use client";

import { motion } from "framer-motion";
import { useAudio } from "@/context/AudioContext";
import { tracks } from "@/lib/data";
import Link from "next/link";
import { Play } from "lucide-react";
import { useMemo, useState } from "react";
import Image from "next/image";

const vibeColors = {
  chill: "bg-neon-green/20 text-neon-green border-neon-green",
  hype: "bg-neon-pink/20 text-neon-pink border-neon-pink",
  classic: "bg-amber-500/20 text-amber-400 border-amber-400",
  storytelling: "bg-purple-500/20 text-purple-400 border-purple-400",
};

type VibeFilter = "all" | "chill" | "hype" | "storytelling" | "classic";

interface TrackListProps {
  featuredOnly?: boolean;
}

const filterOptions: { id: VibeFilter; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "chill", label: "CHILL" },
  { id: "hype", label: "HYPE" },
  { id: "storytelling", label: "STORY" },
  { id: "classic", label: "CLASSIC" },
];

// Helper function to check if coverArt is an image path
const isImagePath = (coverArt: string): boolean => {
  return coverArt.startsWith("/");
};

// Helper component to render cover art
const CoverArt = ({ coverArt, className }: { coverArt: string; className?: string }) => {
  if (isImagePath(coverArt)) {
    return (
      <div className={`relative overflow-hidden rounded-md border border-white/10 flex-shrink-0 ${className || ""}`}>
        <Image
          src={coverArt}
          alt="Track cover"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 40px, 40px"
        />
      </div>
    );
  }
  return (
    <div className={`rounded-md bg-gradient-to-r ${coverArt} flex-shrink-0 border border-white/10 ${className || ""}`} />
  );
};

export function TrackList({ featuredOnly = false }: TrackListProps) {
  const { playTrack, currentTrack, isPlaying } = useAudio();
  const [activeFilter, setActiveFilter] = useState<VibeFilter>("all");

  const audioTracks = useMemo(
    () => tracks.filter((t) => t.type === "audio"),
    []
  );

  const visibleTracks = useMemo(() => {
    const filtered =
      activeFilter === "all"
        ? audioTracks
        : audioTracks.filter((t) => t.vibe === activeFilter);

    if (featuredOnly) return filtered.slice(0, 5);
    return filtered;
  }, [activeFilter, audioTracks, featuredOnly]);

  return (
    <div className="w-full">
      {!featuredOnly && (
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {filterOptions.map((opt) => {
            const isActive = opt.id === activeFilter;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActiveFilter(opt.id)}
                className={[
                  "px-4 py-2 rounded-full border font-tag tracking-wider text-sm transition-all",
                  isActive
                    ? "border-neon-green text-neon-green bg-neon-green/10 shadow-[0_0_15px_rgba(0,255,153,0.25)]"
                    : "border-white/10 text-white/80 hover:text-white hover:border-white/30 hover:bg-white/5",
                ].join(" ")}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {featuredOnly ? (
        // Featured Mode: Table Layout
        <div className="overflow-x-auto">
          <div className="min-w-[760px] rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm overflow-hidden">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-black/70 backdrop-blur-md border-b border-white/10">
              <div className="grid grid-cols-[56px_minmax(260px,1.6fr)_minmax(160px,1fr)_120px_72px] px-4 py-3 text-xs tracking-[0.25em] text-white/60 font-tag">
                <div>#</div>
                <div>TITLE</div>
                <div>ARTIST</div>
                <div>VIBE</div>
                <div className="text-right">TIME</div>
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/10">
              {visibleTracks.map((track, idx) => {
                const isActive = currentTrack?.id === track.id && isPlaying;

                return (
                  <motion.button
                    key={track.id}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.25) }}
                    viewport={{ once: true }}
                    onClick={() => playTrack(track)}
                    className={[
                      "group w-full text-left",
                      "grid grid-cols-[56px_minmax(260px,1.6fr)_minmax(160px,1fr)_120px_72px]",
                      "px-4 py-3 md:py-4",
                      "hover:bg-white/5 transition-colors",
                      isActive ? "text-neon-green" : "text-white",
                    ].join(" ")}
                  >
                    {/* Col 1: Index / Play icon */}
                    <div className="relative flex items-center justify-center">
                      <span
                        className={[
                          "text-sm font-tag",
                          "group-hover:opacity-0 transition-opacity",
                          isActive ? "opacity-0" : "opacity-100 text-white/70",
                        ].join(" ")}
                      >
                        {idx + 1}
                      </span>
                      <span
                        className={[
                          "absolute",
                          "opacity-0 group-hover:opacity-100 transition-opacity",
                          isActive ? "opacity-100" : "",
                        ].join(" ")}
                        aria-hidden="true"
                      >
                        <Play className="w-4 h-4" fill="currentColor" />
                      </span>
                    </div>

                    {/* Col 2: Cover + Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <CoverArt coverArt={track.coverArt} className="w-10 h-10" />
                      <div className="min-w-0">
                        <div
                          className={[
                            "truncate font-tag text-sm md:text-base",
                            isActive ? "text-neon-green" : "text-white font-bold",
                          ].join(" ")}
                        >
                          {track.title}
                        </div>
                      </div>
                    </div>

                    {/* Col 3: Artist */}
                    <div className={["flex items-center", isActive ? "text-neon-green/80" : "text-white/60"].join(" ")}>
                      <span className="truncate text-sm">{track.artist}</span>
                    </div>

                    {/* Col 4: Vibe badge */}
                    <div className="flex items-center">
                      <span
                        className={[
                          "px-3 py-1 rounded-full border text-[11px] font-tag tracking-[0.2em] uppercase",
                          vibeColors[track.vibe],
                        ].join(" ")}
                      >
                        {track.vibe}
                      </span>
                    </div>

                    {/* Col 5: Duration */}
                    <div className={["flex items-center justify-end text-sm", isActive ? "text-neon-green/80" : "text-white/60"].join(" ")}>
                      3:00
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // Full Mode: 3-Column Responsive Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {visibleTracks.map((track, idx) => {
            const isActive = currentTrack?.id === track.id && isPlaying;

            return (
              <motion.button
                key={track.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.25) }}
                viewport={{ once: true }}
                onClick={() => playTrack(track)}
                className={[
                  "group relative w-full text-left",
                  "bg-black/20 backdrop-blur-sm rounded-lg overflow-hidden",
                  "border border-transparent hover:border-white/20 transition-all",
                  isActive ? "border-neon-green/50 bg-neon-green/10" : "",
                ].join(" ")}
              >
                {/* Cover Art Image */}
                <div className="relative aspect-square w-full overflow-hidden">
                  {isImagePath(track.coverArt) ? (
                    <Image
                      src={track.coverArt}
                      alt={track.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-r ${track.coverArt}`} />
                  )}

                  {/* Hover Overlay with Play Button */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-neon-green/20 rounded-full blur-xl" />
                      <Play
                        className="relative w-12 h-12 md:w-16 md:h-16 text-white"
                        fill="currentColor"
                        style={{
                          filter: `drop-shadow(0 0 10px hsl(var(--neon-green)))`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Metadata Below Image */}
                <div className="p-4">
                  <div
                    className={[
                      "font-tag text-base md:text-lg mb-1 line-clamp-2",
                      isActive ? "text-neon-green" : "text-white font-bold",
                    ].join(" ")}
                  >
                    {track.title}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={["text-sm", isActive ? "text-neon-green/80" : "text-white/60"].join(" ")}>
                      {track.artist}
                    </span>
                    <span className="text-white/40">•</span>
                    <span
                      className={[
                        "px-2 py-0.5 rounded-full border text-[10px] font-tag tracking-[0.15em] uppercase",
                        vibeColors[track.vibe],
                      ].join(" ")}
                    >
                      {track.vibe}
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {featuredOnly && (
        <div className="mt-6 flex justify-center">
          <Link
            href="/music"
            className="px-6 py-3 rounded-full border border-neon-green/50 bg-neon-green/10 text-neon-green font-tag tracking-wider hover:bg-neon-green/20 transition-colors"
          >
            View Full Discography
          </Link>
        </div>
      )}
    </div>
  );
}

