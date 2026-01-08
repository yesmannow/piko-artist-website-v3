"use client";

import { useAudio } from "@/context/AudioContext";
import { tracks, MediaItem } from "@/lib/data";
import { Play, Pause, List, Grid3x3, LayoutList, Clock, SkipForward, SkipBack } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useHaptic } from "@/hooks/useHaptic";
import { useState, useEffect, useMemo, useRef } from "react";

// Helper to check if coverArt is an image path
const isImagePath = (coverArt: string): boolean => {
  return coverArt.startsWith("/");
};

// Hook: dynamic image fallback using /api/visuals
function useImageFallback(initialSrc: string, theme: string) {
  const [src, setSrc] = useState(initialSrc);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    setSrc(initialSrc);
    setAttempted(false);
  }, [initialSrc]);

  const onError = () => {
    if (attempted) return;
    setAttempted(true);
    fetch(`/api/visuals?theme=${encodeURIComponent(theme)}&count=1`, { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        const next = d?.images?.[0]?.src as string | undefined;
        if (next) setSrc(next);
      })
      .catch(() => {});
  };

  return { src, onError } as const;
}

// Format duration in MM:SS format
const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Get vibe badge color
const vibeColors: Record<string, string> = {
  chill: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  hype: "bg-red-500/20 text-red-400 border-red-500/30",
  storytelling: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  classic: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

type ViewType = "list" | "card" | "compact";

// Track duration hook
function useTrackDuration(track: MediaItem): number {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (track.type !== "audio") {
      setDuration(0);
      return;
    }

    const audio = new Audio(track.src);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.load();

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [track.src, track.type]);

  return duration;
}

// Cover Art Component
function CoverArt({ coverArt, className }: { coverArt: string; className?: string }) {
  const { src, onError } = useImageFallback(coverArt, "graffiti hip hop rap album cover street urban");
  return (
    <div className={`relative flex-shrink-0 rounded overflow-hidden bg-zinc-800 ${className || ""}`}>
      {isImagePath(coverArt) ? (
        <Image
          src={src}
          alt=""
          fill
          className="object-cover"
          sizes="40px"
          onError={onError}
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-r ${coverArt}`} />
      )}
    </div>
  );
}

// Audio‑reactive Neon Dust overlay (graffiti neon gold with gentle swirl)
function NeonDust() {
  const { audioRef, isPlaying } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const sourceCreatedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || sourceCreatedRef.current) return;

    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ac = new AudioCtx();
    const analyser = ac.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.85;

    try {
      const src = ac.createMediaElementSource(audioEl);
      src.connect(analyser);
      // Do NOT connect analyser to destination to avoid duplicate audio
      sourceCreatedRef.current = true;
    } catch {
      // MediaElementSource may already be created; ignore
    }

    analyserRef.current = analyser;
    dataRef.current = new Uint8Array(analyser.frequencyBinCount);

    return () => {
      analyserRef.current = null;
      dataRef.current = null;
      ac.close().catch(() => {});
      sourceCreatedRef.current = false;
    };
  }, [audioRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const maxParticles = prefersReduced ? 0 : Math.min(3000, Math.floor(window.innerWidth * 1.5));
    const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = mobile ? Math.min(800, Math.max(300, Math.floor(maxParticles * 0.35))) : Math.max(1200, Math.floor(maxParticles * 0.6));

    type P = { x: number; y: number; vx: number; vy: number; s: number; a: number; t: number };
    const particles: P[] = new Array(count).fill(0).map(() => ({
      x: Math.random() * canvas.clientWidth,
      y: Math.random() * canvas.clientHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      s: 0.6 + Math.random() * 1.6,
      a: 0.1 + Math.random() * 0.25,
      t: Math.random() * Math.PI * 2,
    }));

    let running = true;
    const onVis = () => {
      running = !document.hidden;
      if (running && rafRef.current == null) loop();
    };
    document.addEventListener('visibilitychange', onVis);

    const gold = { r: 255, g: 215, b: 0 };
    ctx.globalCompositeOperation = 'lighter';

    const levels = () => {
      const arr = dataRef.current;
      const an = analyserRef.current;
      if (!arr || !an) return { bass: 0, mid: 0, high: 0, overall: 0 };
      an.getByteFrequencyData(arr);
      const len = arr.length;
      const lowEnd = Math.floor((200 / 22050) * len);
      const midEnd = Math.floor((2000 / 22050) * len);
      let lb=0, mb=0, hb=0, ob=0;
      for (let i = 0; i < len; i++) {
        const v = arr[i] / 255;
        ob += v;
        if (i < lowEnd) lb += v; else if (i < midEnd) mb += v; else hb += v;
      }
      const bass = Math.min(1, (lb / Math.max(1, lowEnd)) * 2);
      const mid = Math.min(1, (mb / Math.max(1, midEnd - lowEnd)) * 2);
      const high = Math.min(1, (hb / Math.max(1, len - midEnd)) * 2);
      const overall = Math.min(1, (ob / len) * 2);
      return { bass, mid, high, overall };
    };

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      if (!running) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const { bass, mid, overall } = levels();

      // Gentle trails backdrop
      ctx.fillStyle = 'rgba(5,5,5,0.15)';
      ctx.fillRect(0, 0, w, h);

      // Motion parameters
      const swirl = 0.001 + (mid || 0) * 0.005;
      const speed = 0.06 + (overall || 0) * 0.35;
      const alphaBoost = 0.08 + (bass || 0) * 0.5;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.t += swirl;
        p.vx += Math.cos(p.t) * 0.02;
        p.vy += Math.sin(p.t) * 0.02;
        p.x += p.vx * speed;
        p.y += p.vy * speed;

        // Wrap edges
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;

        const a = Math.min(0.9, p.a + alphaBoost);
        ctx.fillStyle = `rgba(${gold.r}, ${gold.g}, ${gold.b}, ${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s + overall * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loopStartIf = () => {
      if (prefersReduced) return;
      loop();
    };

    loopStartIf();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', onVis);
      rafRef.current = null;
    };
  }, [isPlaying]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

// Hero Section for Currently Playing Track
function TrackHero({ track, isPlaying, onPlay, onPause, onNext, onPrevious }: {
  track: MediaItem | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  // Always call hooks unconditionally
  const duration = useTrackDuration(track || { type: "audio", src: "", title: "", coverArt: "", vibe: "chill" } as MediaItem);
  const { src: heroSrc, onError: heroOnError } = useImageFallback(track?.coverArt ?? "", "graffiti hip hop rap album cover artist portrait street urban");

  if (!track) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-8 md:mb-12 rounded-xl overflow-hidden border-2 border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 p-6 md:p-8 lg:p-12">
        {/* Left: Large Cover Art */}
        <motion.div
          className="relative aspect-square w-full max-w-md mx-auto lg:max-w-none"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative w-full h-full rounded-lg overflow-hidden bg-zinc-900 shadow-2xl">
            {isImagePath(track.coverArt) ? (
              <Image
                src={heroSrc}
                alt={track.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                onError={heroOnError}
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-r ${track.coverArt}`} />
            )}
            {/* Animated overlay when playing */}
            <AnimatePresence>
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-toxic-lime mix-blend-overlay"
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right: Track Info & Controls */}
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <div className="mb-2">
              <span
                className={`inline-block px-3 py-1 rounded-full border text-xs font-industrial font-bold tracking-wider uppercase ${
                  vibeColors[track.vibe] || vibeColors.chill
                }`}
              >
                {track.vibe}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-header mb-3 text-foreground">
              {track.title}
            </h1>
            <p className="text-xl md:text-2xl font-industrial text-foreground/80 mb-4 font-medium">
              {track.artist}
            </p>
            {duration > 0 && (
              <div className="flex items-center gap-2 text-foreground/60 font-industrial">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(duration)}</span>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={onPrevious}
              className="p-3 rounded-full border-2 border-zinc-700 hover:border-toxic-lime transition-colors"
              aria-label="Previous track"
            >
              <SkipBack className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={isPlaying ? onPause : onPlay}
              className="relative p-6 rounded-full bg-toxic-lime text-black hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,215,0,0.5)]"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" fill="currentColor" />
              ) : (
                <Play className="w-8 h-8" fill="currentColor" />
              )}
            </button>
            <button
              onClick={onNext}
              className="p-3 rounded-full border-2 border-zinc-700 hover:border-toxic-lime transition-colors"
              aria-label="Next track"
            >
              <SkipForward className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Glow effect when playing */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle at center, rgba(255,215,0,0.1) 0%, transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Table Row Item Component
function TableRowItem({ track, index, isActive, onPlay }: {
  track: MediaItem;
  index: number;
  isActive: boolean;
  onPlay: () => void;
}) {
  const duration = useTrackDuration(track);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.25) }}
      onClick={onPlay}
      className={[
        "group w-full text-left",
        "grid grid-cols-[56px_minmax(260px,1.6fr)_minmax(160px,1fr)_120px_72px]",
        "px-4 py-3 md:py-4",
        "hover:bg-foreground/5 transition-colors",
        isActive ? "text-toxic-lime" : "text-foreground",
      ].join(" ")}
    >
      {/* Col 1: Index / Play icon / Active Equalizer */}
      <div className="relative flex items-center justify-center">
        {mounted && isActive ? (
          <div className="flex items-end gap-0.5 h-4">
            {[0.3, 0.6, 0.4, 0.8, 0.5].map((height, eqIdx) => (
              <motion.div
                key={eqIdx}
                className="w-0.5 bg-toxic-lime rounded-t"
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
              {index + 1}
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
              isActive ? "text-toxic-lime" : "text-foreground",
            ].join(" ")}
          >
            {track.title}
          </div>
        </div>
      </div>

      {/* Col 3: Artist */}
      <div className={["flex items-center", isActive ? "text-toxic-lime/80" : "text-foreground/80"].join(" ")}>
        <span className="truncate text-sm font-medium">{track.artist}</span>
      </div>

      {/* Col 4: Vibe badge */}
      <div className="flex items-center">
        <span
          className={[
            "px-3 py-1 rounded-full border text-[11px] font-industrial font-bold tracking-[0.2em] uppercase",
            vibeColors[track.vibe] || vibeColors.chill,
          ].join(" ")}
        >
          {track.vibe}
        </span>
      </div>

      {/* Col 5: Duration */}
      <div className={["flex items-center justify-end text-sm font-mono", isActive ? "text-toxic-lime/80" : "text-foreground/70"].join(" ")}>
        {duration > 0 ? formatDuration(duration) : "0:00"}
      </div>
    </motion.button>
  );
}

// Table List View (matching Latest Drops style)
function TableListView({ tracks, currentTrack, isPlaying, onPlay }: {
  tracks: MediaItem[];
  currentTrack: MediaItem | null;
  isPlaying: boolean;
  onPlay: (track: MediaItem) => void;
}) {
  return (
    <div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 md:mx-0">
      <div className="min-w-[min(100%,760px)] rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm overflow-hidden mx-4 md:mx-0">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-black/70 backdrop-blur-md border-b border-white/10">
          <div className="grid grid-cols-[56px_minmax(260px,1.6fr)_minmax(160px,1fr)_120px_72px] px-4 py-3 text-xs tracking-[0.25em] text-white/60 font-industrial font-bold">
            <div>#</div>
            <div>TITLE</div>
            <div>ARTIST</div>
            <div>VIBE</div>
            <div className="text-right">TIME</div>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/10">
          {tracks.map((track, idx) => {
            const isActive = currentTrack?.id === track.id && isPlaying;
            return (
              <TableRowItem
                key={track.id}
                track={track}
                index={idx}
                isActive={isActive}
                onPlay={() => onPlay(track)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Card View Component (Grid)
function CardViewItem({ track, index, isActive, onPlay }: { track: MediaItem; index: number; isActive: boolean; onPlay: () => void }) {
  const duration = useTrackDuration(track);
  const { src: cardSrc, onError: cardOnError } = useImageFallback(track.coverArt, "graffiti hip hop rap album cover street urban");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onPlay}
      className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 shadow-lg ${
        isActive
          ? "border-toxic-lime shadow-[0_0_20px_rgba(255,215,0,0.3)] ring-2 ring-toxic-lime"
          : "border-zinc-800 hover:border-toxic-lime/50 hover:shadow-xl"
      }`}
    >
      {/* Cover Art */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-900 rounded-t-lg">
        {isImagePath(track.coverArt) ? (
          <motion.div
            className="relative w-full h-full"
            whileHover={{ scale: 1.08, y: -4 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Image
              src={cardSrc}
              alt={track.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={cardOnError}
            />
          </motion.div>
        ) : (
          <motion.div
            className={`w-full h-full bg-gradient-to-r ${track.coverArt}`}
            whileHover={{ scale: 1.08, y: -4 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        )}

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
              className="relative w-16 h-16 text-white"
              fill="currentColor"
              style={{
                filter: `drop-shadow(0 0 15px #FFD700)`,
              }}
            />
          </motion.div>
        </div>

        {/* Active Indicator */}
        {isActive && (
          <div className="absolute top-2 right-2 z-30">
            <div className="w-3 h-3 bg-toxic-lime rounded-full animate-pulse shadow-[0_0_8px_#FFD700]" />
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="p-3 md:p-4 bg-zinc-900 rounded-b-lg border-t-2 border-zinc-800/50">
        <h3
          className={`font-header font-semibold text-sm md:text-base mb-1 truncate tracking-tight ${
            isActive ? "text-toxic-lime" : "text-white"
          }`}
        >
          {track.title}
        </h3>
        <p className="font-industrial text-zinc-300 text-xs md:text-sm truncate mb-2">
          {track.artist}
        </p>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className={`px-2 py-1 rounded text-[10px] font-industrial font-semibold uppercase border ${
              vibeColors[track.vibe] || vibeColors.chill
            }`}
          >
            {track.vibe}
          </span>
          {duration > 0 && (
            <span className="flex items-center gap-1 text-zinc-400 text-xs font-industrial">
              <Clock className="w-3 h-3" />
              {formatDuration(duration)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Card View Component (Grid)
function CardView({ tracks, currentTrack, onPlay }: { tracks: MediaItem[]; currentTrack: MediaItem | null; onPlay: (track: MediaItem) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {tracks.map((track, index) => {
        const isActive = currentTrack?.id === track.id;
        return (
          <CardViewItem
            key={track.id}
            track={track}
            index={index}
            isActive={isActive}
            onPlay={() => onPlay(track)}
          />
        );
      })}
    </div>
  );
}

// Compact View Track Item
function CompactViewItem({ track, index, isActive, onPlay }: { track: MediaItem; index: number; isActive: boolean; onPlay: () => void }) {
  const duration = useTrackDuration(track);
  const { src: compactSrc, onError: compactOnError } = useImageFallback(track.coverArt, "graffiti hip hop rap album cover street urban");

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.01 }}
      onClick={onPlay}
      className={`group relative flex items-center gap-3 p-2 rounded-md transition-all duration-150 cursor-pointer ${
        isActive
          ? "bg-toxic-lime/10 border-l-2 border-toxic-lime"
          : "hover:bg-zinc-900/50 border-l-2 border-transparent"
      }`}
    >
      {/* Track Number / Play Icon */}
      <div className="w-6 flex-shrink-0 flex items-center justify-center">
        {isActive ? (
          <div className="w-4 h-4 bg-toxic-lime rounded-full animate-pulse" />
        ) : (
          <span className="text-zinc-400 text-xs font-industrial group-hover:hidden">
            {index + 1}
          </span>
        )}
        <Play
          className={`w-4 h-4 hidden group-hover:block ${
            isActive ? "text-toxic-lime" : "text-zinc-300"
          }`}
          fill={isActive ? "currentColor" : "none"}
        />
      </div>

      {/* Track Art - Small */}
      <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-zinc-800">
        {isImagePath(track.coverArt) ? (
          <Image
            src={compactSrc}
            alt={track.title}
            fill
            className="object-cover"
            sizes="40px"
            onError={compactOnError}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-r ${track.coverArt}`} />
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h3
          className={`font-header font-semibold text-sm truncate tracking-tight ${
            isActive ? "text-toxic-lime" : "text-white"
          }`}
        >
          {track.title}
        </h3>
        <p className="font-industrial text-zinc-300 text-xs truncate">
          {track.artist} • {track.vibe}
        </p>
      </div>

      {/* Duration */}
      {duration > 0 && (
        <div className="flex-shrink-0 text-zinc-400 text-xs font-industrial">
          {formatDuration(duration)}
        </div>
      )}
    </motion.div>
  );
}

// Compact View Component (Minimal list)
function CompactView({ tracks, currentTrack, onPlay }: { tracks: MediaItem[]; currentTrack: MediaItem | null; onPlay: (track: MediaItem) => void }) {
  return (
    <div className="space-y-1">
      {tracks.map((track, index) => {
        const isActive = currentTrack?.id === track.id;
        return (
          <CompactViewItem
            key={track.id}
            track={track}
            index={index}
            isActive={isActive}
            onPlay={() => onPlay(track)}
          />
        );
      })}
    </div>
  );
}

export default function MusicPage() {
  const { currentTrack, isPlaying, playTrack, togglePlay, skipNext, skipPrevious } = useAudio();
  const { triggerHaptic } = useHaptic();
  const [viewType, setViewType] = useState<ViewType>("list");

  // Filter to only audio tracks
  const audioTracks = useMemo(() => tracks.filter((t) => t.type === "audio"), []);

  const handlePlay = (track: MediaItem) => {
    triggerHaptic();
    playTrack(track);
  };

  const handlePlayPause = () => {
    triggerHaptic();
    togglePlay();
  };

  const viewIcons = {
    list: List,
    card: Grid3x3,
    compact: LayoutList,
  };

  // Get featured track (currently playing or first track)
  const featuredTrack = currentTrack || audioTracks[0];

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <NeonDust />
      <div className="absolute inset-0 bg-[#121214cc] z-10 pointer-events-none" />
      <section className="relative z-20 py-12 md:py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 md:mb-12">
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-header mb-3 md:mb-4 text-foreground">
                MUSIC LIBRARY
              </h1>
              <p className="text-foreground/70 font-industrial text-sm md:text-base tracking-normal font-medium">
                STREAMING • DOWNLOAD • SHARE
              </p>
            </div>

            {/* View Toggle Buttons */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {(["list", "card", "compact"] as ViewType[]).map((view) => {
                const Icon = viewIcons[view];
                const isActive = viewType === view;
                return (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setViewType(view)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 font-industrial text-sm uppercase tracking-wider ${
                      isActive
                        ? "border-toxic-lime bg-toxic-lime/10 text-toxic-lime shadow-[0_0_10px_rgba(255,215,0,0.2)]"
                        : "border-zinc-800 text-foreground/70 hover:border-zinc-700 hover:text-foreground"
                    }`}
                    aria-label={`Switch to ${view} view`}
                    aria-pressed={isActive}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{view}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hero Section - Currently Playing Track */}
          <TrackHero
            track={featuredTrack}
            isPlaying={isPlaying && currentTrack?.id === featuredTrack?.id}
            onPlay={handlePlayPause}
            onPause={handlePlayPause}
            onNext={() => {
              triggerHaptic();
              skipNext();
            }}
            onPrevious={() => {
              triggerHaptic();
              skipPrevious();
            }}
          />

          {/* Track Views */}
          {viewType === "list" && (
            <TableListView
              tracks={audioTracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlay={handlePlay}
            />
          )}
          {viewType === "card" && (
            <CardView tracks={audioTracks} currentTrack={currentTrack} onPlay={handlePlay} />
          )}
          {viewType === "compact" && (
            <CompactView tracks={audioTracks} currentTrack={currentTrack} onPlay={handlePlay} />
          )}
        </div>
      </section>
    </div>
  );
}
