"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import Image from "next/image";
import { tracks, MediaItem } from "@/lib/data";
import { X, Play } from "lucide-react";
import { useAudio } from "@/context/AudioContext";
import { getSharedAudioContext, getOrCreateMediaSourceFor } from "@/hooks/useAudioAnalyser";

function NeonDust() {
  const { audioRef, isPlaying } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const sourceCreatedRef = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      c.width = Math.floor(c.clientWidth * dpr);
      c.height = Math.floor(c.clientHeight * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || sourceCreatedRef.current) return;
    const ac = getSharedAudioContext();
    const analyser = ac.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.85;
    ac.resume?.().catch(() => {});
    try {
      const src = getOrCreateMediaSourceFor(el);
      src.connect(analyser);
      sourceCreatedRef.current = true;
    } catch {}
    analyserRef.current = analyser;
    dataRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount)) as Uint8Array<ArrayBuffer>;
    return () => {
      analyserRef.current = null;
      dataRef.current = null;
      sourceCreatedRef.current = false;
    };
  }, [audioRef]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const maxP = prefersReduced ? 0 : Math.min(3000, Math.floor(window.innerWidth * 1.5));
    const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = mobile ? Math.min(800, Math.max(300, Math.floor(maxP * 0.35))) : Math.max(1200, Math.floor(maxP * 0.6));
    type P = { x: number; y: number; vx: number; vy: number; s: number; a: number; t: number };
    const ps: P[] = new Array(count).fill(0).map(() => ({
      x: Math.random() * c.clientWidth,
      y: Math.random() * c.clientHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      s: 0.6 + Math.random() * 1.6,
      a: 0.1 + Math.random() * 0.25,
      t: Math.random() * Math.PI * 2,
    }));
    let run = true;
    const onVis = () => { run = !document.hidden; if (run && rafRef.current == null) loop(); };
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
      for (let i=0;i<len;i++){ const v=arr[i]/255; ob+=v; if(i<lowEnd) lb+=v; else if(i<midEnd) mb+=v; else hb+=v; }
      const bass = Math.min(1, (lb/Math.max(1,lowEnd))*2);
      const mid = Math.min(1, (mb/Math.max(1,midEnd-lowEnd))*2);
      const high = Math.min(1, (hb/Math.max(1,len-midEnd))*2);
      const overall = Math.min(1, (ob/len)*2);
      return { bass, mid, high, overall };
    };
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      if (!run) return;
      const w = c.clientWidth; const h = c.clientHeight;
      ctx.clearRect(0,0,w,h);
      const { bass, mid, overall } = levels();
      ctx.fillStyle = 'rgba(5,5,5,0.15)'; ctx.fillRect(0,0,w,h);
      const swirl = 0.001 + (mid||0)*0.005;
      const speed = 0.06 + (overall||0)*0.35;
      const alphaBoost = 0.08 + (bass||0)*0.5;
      for (let i=0;i<ps.length;i++){
        const p = ps[i]; p.t += swirl; p.vx += Math.cos(p.t)*0.02; p.vy += Math.sin(p.t)*0.02;
        p.x += p.vx*speed; p.y += p.vy*speed;
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
        const a = Math.min(0.9, p.a + alphaBoost);
        ctx.fillStyle = `rgba(${gold.r}, ${gold.g}, ${gold.b}, ${a})`;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.s+overall*1.5,0,Math.PI*2); ctx.fill();
      }
    };
    if (!prefersReduced) loop();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); document.removeEventListener('visibilitychange', onVis); rafRef.current = null; };
  }, [isPlaying]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

// Thumbnail component with fallback strategy
function VideoThumbnail({ videoId, title, className }: { videoId: string; title: string; className?: string }) {
  // Get fallback images from public/images/tracks directory
  const trackImages = [
    "/images/tracks/abstract-1846847_1280.jpg",
    "/images/tracks/architecture-3189972_1280.jpg",
    "/images/tracks/aurora-borealis-9267515_1280.jpg",
    "/images/tracks/background-1833056_1280.jpg",
    "/images/tracks/bicycle-3045580_1280.jpg",
    "/images/tracks/dj-2581269_1280.jpg",
    "/images/tracks/gong-8255081_1280.jpg",
    "/images/tracks/graffiti-1476119_1280.jpg",
    "/images/tracks/graffiti-3750912_1280.jpg",
    "/images/tracks/hamburg-2718329_1280.jpg",
    "/images/tracks/love-2724141_1280.png",
    "/images/tracks/skateboard-447147_1280.jpg",
    "/images/tracks/skull-and-crossbones-414207_1280.jpg",
    "/images/tracks/starry-sky-1655503_1280.jpg",
    "/images/tracks/street-art-1499524_1280.jpg",
    "/images/tracks/tube-7260586_1280.jpg",
    "/images/tracks/vinyl-1595847_1280.jpg",
    "/images/tracks/wall-2583885_1280.jpg",
    "/images/tracks/wallpaper-5928106_1280.png",
    "/images/tracks/woman-3633737_1280.jpg",
  ];

  // Use videoId to deterministically select a fallback image
  const fallbackIndex = videoId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % trackImages.length;
  const fallbackImage = trackImages[fallbackIndex];

  const [imgSrc, setImgSrc] = useState(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`);
  const [errorCount, setErrorCount] = useState(0);
  const [dynamicFallback, setDynamicFallback] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    // Pre-fetch one dynamic visual as an additional fallback
    fetch(`/api/visuals?theme=${encodeURIComponent("graffiti hip hop rap street urban neon video")}\u0026count=1`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(r => r.json())
      .then(d => {
        if (aborted) return;
        const src = d?.images?.[0]?.src as string | undefined;
        if (src) setDynamicFallback(src);
      })
      .catch(() => {})
    return () => {
      aborted = true;
      controller.abort();
    };
  }, []);

  const handleError = () => {
    if (errorCount === 0) {
      // First fallback: try hqdefault
      setErrorCount(1);
      setImgSrc(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
    } else if (errorCount === 1) {
      // Second fallback: try dynamic API image if available
      if (dynamicFallback) {
        setErrorCount(2);
        setImgSrc(dynamicFallback);
      } else {
        // If no dynamic available, go directly to local fallback
        setErrorCount(3);
        setImgSrc(fallbackImage);
      }
    } else if (errorCount === 2) {
      // Third fallback: local curated image
      setErrorCount(3);
      setImgSrc(fallbackImage);
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
        <div className="w-12 h-12 bg-[#FFD700] rounded-full flex items-center justify-center shadow-[0_0_20px_#FFD700]">
          <Play className="w-5 h-5 text-black fill-current" />
        </div>
      </div>

      {/* Info Overlay */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
        <h3 className="text-white font-bold truncate">{video.title}</h3>
        <p className="text-[#FFD700] text-xs font-mono uppercase tracking-wider mt-1">{video.vibe}</p>
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
        <span className="inline-block px-3 py-1 mb-4 text-xs font-bold text-black bg-[#FFD700] rounded-full uppercase tracking-widest">
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
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
          className="w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          title="Video player"
          loading="lazy"
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-green-500">
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
    <div className="min-h-screen relative overflow-hidden bg-background pt-20 md:pt-24 pb-12 md:pb-20 px-4 md:px-8">
      <NeonDust />
      <div className="absolute inset-0 bg-[#121214cc] z-10 pointer-events-none" />
      <div className="relative z-20 max-w-7xl mx-auto">
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
