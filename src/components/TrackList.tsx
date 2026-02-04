"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useAudio } from "@/context/AudioContext";
import { tracks } from "@/lib/data";
import { Play } from "lucide-react";
import { useMemo, useState, useRef } from "react";
import Image from "next/image";
import { useHaptic } from "@/hooks/device/useHaptic";
import { TrackDrawer } from "@/components/TrackDrawer";

const vibeColors = {
  chill: "bg-toxic-lime/20 text-toxic-lime border-toxic-lime border-black",
  hype: "bg-spray-magenta/20 text-spray-magenta border-spray-magenta border-black",
  classic: "bg-safety-orange/20 text-safety-orange border-safety-orange border-black",
  storytelling: "bg-spray-magenta/20 text-spray-magenta border-spray-magenta border-black",
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
  const [isLoaded, setIsLoaded] = useState(false);

  if (isImagePath(coverArt)) {
    return (
      <div className={`relative overflow-hidden rounded-md border border-white/10 shrink-0 ${className || ""}`}>
        <Image
          src={coverArt}
          alt="Track Cover"
          width={40}
          height={40}
          className="object-cover w-full h-full"
          sizes="(max-width: 768px) 40px, 40px"
          onLoad={() => setIsLoaded(true)}
        />
        {!isLoaded && (
          <div className="absolute inset-0 bg-white/5 animate-pulse" />
        )}
      </div>
    );
  }
  return (
    <div className={`rounded-md bg-linear-to-r ${coverArt} shrink-0 border border-white/10 ${className || ""}`} />
  );
};

// TrackCard component for Full Mode with 3D tilt effects
interface TrackCardProps {
  track: (typeof tracks)[0];
  index: number;
  isActive: boolean;
  onPlay: () => void;
}

function TrackCard({ track, index, isActive, onPlay }: TrackCardProps) {
  const { triggerHaptic } = useHaptic();
  const [isLoaded, setIsLoaded] = useState(false);
  // Random rotation between -1deg and 1deg for pasted-on-wall effect (compute once on mount)
  const [rotation] = useState(() => (Math.random() * 2 - 1).toFixed(2));

  // 3D Tilt Physics
  const cardRef = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = (e.clientX - centerX) / rect.width;
    const mouseY = (e.clientY - centerY) / rect.height;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={cardRef}
      type="button"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.25) }}
      viewport={{ once: true }}
      onClick={() => {
        triggerHaptic();
        onPlay();
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={[
        "group relative w-full text-left",
        "bg-[#e5e5e5] overflow-hidden rounded-lg",
        "border-2 border-black",
        "transition-all duration-300",
        isActive ? "ring-2 ring-toxic-lime shadow-[0_0_20px_rgba(255,215,0,0.3)]" : "shadow-lg hover:shadow-xl",
      ].join(" ")}
      style={{
        transform: `rotate(${rotation}deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: "preserve-3d",
        boxShadow: isActive
          ? "4px 4px 0px 0px rgba(0,0,0,1), 0 0 20px rgba(255,215,0,0.3)"
          : "4px 4px 0px 0px rgba(0,0,0,1), 0 4px 6px rgba(0,0,0,0.1)",
      }}
    >
      {/* Cover Art Image */}
      <div className="relative aspect-square w-full overflow-hidden">
        {/* Graffiti Texture Overlay - Subtle */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none z-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='graffiti'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23graffiti)' opacity='0.3'/%3E%3C/svg%3E")`,
            mixBlendMode: "overlay",
          }}
        />

        {/* Vinyl Scratch Effect - Subtle */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none z-10"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.1) 2px,
              rgba(0, 0, 0, 0.1) 4px
            )`,
            mixBlendMode: "multiply",
          }}
        />

        {isImagePath(track.coverArt) ? (
          <>
            <motion.div
              className="relative w-full h-full"
              whileHover={{ scale: 1.08, y: -4 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Image
                src={track.coverArt}
                alt={track.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                onLoad={() => setIsLoaded(true)}
              />
              {!isLoaded && (
                <div className="absolute inset-0 bg-white/5 animate-pulse" />
              )}
            </motion.div>
          </>
        ) : (
          <motion.div
            className={`w-full h-full bg-linear-to-r ${track.coverArt}`}
            whileHover={{ scale: 1.08, y: -4 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        )}

        {/* Dark-to-Bright Gradient Overlay on Hover */}
        <motion.div
          className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20"
          initial={false}
        />

        {/* Hover Overlay with Play Button */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-30">
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-toxic-lime/30 rounded-full blur-xl animate-pulse" />
            <Play
              className="relative w-12 h-12 md:w-16 md:h-16 text-white"
              fill="currentColor"
              style={{
                filter: `drop-shadow(0 0 15px #FFD700)`,
              }}
            />
          </motion.div>
        </div>

        {/* Active Indicator - Animated Equalizer */}
        {isActive && (
          <div className="absolute top-2 right-2 flex items-end gap-0.5 h-4 z-30">
            {[0.3, 0.6, 0.4, 0.8, 0.5].map((height, idx) => (
              <motion.div
                key={idx}
                className="w-0.5 bg-toxic-lime rounded-t"
                animate={{
                  height: `${height * 100}%`,
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: idx * 0.1,
                  ease: "easeInOut",
                }}
                style={{
                  boxShadow: "0 0 4px #FFD700",
                }}
              />
            ))}
          </div>
        )}

        {/* Metadata Tooltip on Hover */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/95 via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-40"
          initial={false}
        >
          <div className="text-white">
            <div className="font-header text-sm font-semibold truncate mb-1 tracking-tight">{track.title}</div>
            <div className="font-industrial text-xs text-white/80 truncate mb-1">{track.artist}</div>
            <div className="flex items-center gap-2">
              <span className={[
                "px-2 py-0.5 rounded text-[10px] font-industrial font-bold uppercase tracking-wider border",
                vibeColors[track.vibe],
              ].join(" ")}>
                {track.vibe}
              </span>
              <span className="text-white/60 text-xs">3:00</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Metadata Below Image - Always Visible */}
      <div className="p-3 md:p-4 bg-[#e5e5e5] border-t-2 border-black/10">
        <div
          className={[
            "font-header text-sm md:text-base mb-1 line-clamp-2 font-semibold tracking-tight",
            isActive ? "text-toxic-lime" : "text-black",
          ].join(" ")}
        >
          {track.title}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={["text-xs md:text-sm", isActive ? "text-toxic-lime/80" : "text-black/70"].join(" ")}>
            {track.artist}
          </span>
          <span className="text-black/40">•</span>
          <span
            className={[
              "px-2 py-0.5 rounded-full border border-black text-[10px] font-industrial font-bold tracking-[0.15em] uppercase",
              vibeColors[track.vibe],
            ].join(" ")}
          >
            {track.vibe}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export function TrackList({ featuredOnly = false }: TrackListProps) {
  const { playTrack, currentTrack, isPlaying } = useAudio();
  const { triggerHaptic } = useHaptic();
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
                    "px-4 py-2.5 rounded-full border-2 border-black font-industrial font-bold tracking-wider text-sm transition-all min-h-11 touch-manipulation focus:outline-none focus:ring-2 focus:ring-toxic-lime focus:ring-offset-2",
                    isActive
                      ? "border-toxic-lime text-toxic-lime bg-toxic-lime/10 shadow-hard"
                      : "border-black text-foreground/80 hover:text-foreground hover:border-foreground/30 hover:bg-foreground/5",
                  ].join(" ")}
                  aria-label={`Filter by ${opt.label}`}
                  aria-pressed={isActive}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {featuredOnly ? (
        // Featured Mode: Warehouse Manifest Table Layout
        <div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 md:mx-0">
          <div className="min-w-[min(100%,760px)] border-2 border-white/10 bg-black/40 overflow-hidden mx-4 md:mx-0">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b-2 border-white/10">
              <div className="grid grid-cols-[56px_minmax(260px,1.6fr)_minmax(160px,1fr)_120px_72px] px-4 py-3 text-xs tracking-[0.25em] text-[#E0E0E0]/60 font-mono font-bold uppercase">
                <div>#</div>
                <div>TITLE</div>
                <div>ARTIST</div>
                <div>VIBE</div>
                <div className="text-right">TIME</div>
              </div>
            </div>
            {/* Section Header Update */}
            <div className="px-4 py-2 border-b-2 border-white/10 bg-black/60">
              <span className="text-[10px] font-mono text-[#FFD700] uppercase tracking-widest">
                STUDIO_MANIFEST // LATEST_RELEASES
              </span>
            </div>

            {/* Rows with CCTV Scan-line Hover Effect */}
            <div className="divide-y divide-white/10 relative">
              {visibleTracks.map((track, idx) => {
                const isActive = currentTrack?.id === track.id && isPlaying;

                return (
                  <TrackDrawer
                    key={track.id}
                    track={track}
                  >
                    <motion.div
                      className="group relative"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.25) }}
                      viewport={{ once: true }}
                    >
                      {/* CCTV Scan-line Hover Effect */}
                      <motion.div
                        className="absolute inset-0 pointer-events-none z-10 opacity-0 group-hover:opacity-100"
                        initial={{ y: "-100%" }}
                        whileHover={{ y: "100%" }}
                        transition={{ duration: 0.6, ease: "linear" }}
                        style={{
                          background: "linear-gradient(to bottom, transparent 0%, rgba(255, 215, 0, 0.05) 50%, transparent 100%)",
                          height: "1px",
                        }}
                      />
                      <motion.button
                        type="button"
                        onClick={() => {
                          triggerHaptic();
                          playTrack(track);
                        }}
                        className={[
                          "w-full text-left relative",
                          "grid grid-cols-[56px_minmax(260px,1.6fr)_minmax(160px,1fr)_120px_72px]",
                          "px-4 py-3 md:py-4",
                          "hover:bg-white/5 transition-colors",
                          "border-b border-white/10",
                          isActive ? "text-[#FFD700]" : "text-[#E0E0E0]",
                        ].join(" ")}
                      >
                    {/* Col 1: Index / Play icon / Active Equalizer */}
                    <div className="relative flex items-center justify-center">
                      {isActive ? (
                        <div className="flex items-end gap-0.5 h-4">
                          {[0.3, 0.6, 0.4, 0.8, 0.5].map((height, eqIdx) => (
                            <motion.div
                              key={eqIdx}
                              className="w-0.5 bg-[#FFD700]"
                              animate={{
                                height: `${height * 100}%`,
                              }}
                              transition={{
                                duration: 0.5,
                                repeat: Infinity,
                                delay: eqIdx * 0.1,
                                ease: "easeInOut",
                              }}
                              style={{
                                boxShadow: "0 0 4px #FFD700",
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <>
                          <span
                            className={[
                              "text-sm font-industrial font-bold",
                              "group-hover:opacity-0 transition-opacity",
                              "opacity-100 text-white/70",
                            ].join(" ")}
                          >
                            {idx + 1}
                          </span>
                          <span
                            className={[
                              "absolute",
                              "opacity-0 group-hover:opacity-100 transition-opacity",
                            ].join(" ")}
                            aria-hidden="true"
                          >
                            <Play className="w-4 h-4" fill="currentColor" />
                          </span>
                        </>
                      )}
                    </div>

                    {/* Col 2: Cover + Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <CoverArt coverArt={track.coverArt} className="w-10 h-10" />
                      <div className="min-w-0">
                        <div
                          className={[
                            "truncate font-industrial font-semibold uppercase tracking-tight text-sm md:text-base",
                            isActive ? "text-[#FFD700]" : "text-[#E0E0E0]",
                          ].join(" ")}
                        >
                          {track.title}
                        </div>
                      </div>
                    </div>

                    {/* Col 3: Artist */}
                    <div className={["flex items-center font-mono", isActive ? "text-[#FFD700]/80" : "text-[#E0E0E0]/60"].join(" ")}>
                      <span className="truncate text-sm">{track.artist}</span>
                    </div>

                    {/* Col 4: Vibe badge - Sharp rectangles with Safety Yellow */}
                    <div className="flex items-center">
                      <span
                        className={[
                          "px-3 py-1 border-2 text-[11px] font-mono font-bold tracking-[0.2em] uppercase",
                          "bg-[#FFD700] text-black border-black",
                        ].join(" ")}
                      >
                        {track.vibe}
                      </span>
                    </div>

                    {/* Col 5: Duration */}
                    <div className={["flex items-center justify-end text-sm", isActive ? "text-toxic-lime/80" : "text-foreground/60"].join(" ")}>
                      3:00
                    </div>
                  </motion.button>
                    </motion.div>
                  </TrackDrawer>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // Full Mode: 3-Column Responsive Grid - "Paper Flyer" Look with 3D Tilt
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 snap-y snap-mandatory overflow-y-auto" style={{ perspective: "1000px" }}>
          {visibleTracks.map((track, idx) => (
            <TrackDrawer
              key={track.id}
              track={track}
            >
              <div className="snap-center">
                <TrackCard
                  track={track}
                  index={idx}
                  isActive={currentTrack?.id === track.id && isPlaying}
                  onPlay={() => {
                    triggerHaptic();
                    playTrack(track);
                  }}
                />
              </div>
            </TrackDrawer>
          ))}
        </div>
      )}

    </div>
  );
}

