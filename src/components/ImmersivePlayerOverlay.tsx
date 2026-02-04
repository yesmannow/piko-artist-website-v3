"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useAudio } from "@/context/AudioContext";
import { tracks, MediaItem } from "@/lib/data";
import { useHaptic } from "@/hooks/device/useHaptic";
import {
  ChevronDown,
  ListMusic,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { EnhancedAudioVisualizer } from "@/components/EnhancedAudioVisualizer";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatTime(seconds: number) {
  if (!seconds || Number.isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function isImagePath(coverArt: string) {
  return coverArt.startsWith("/");
}

type Vibe = "chill" | "hype" | "storytelling" | "classic" | string;

function getVibePalette(vibe: Vibe | undefined) {
  // Keep palettes aligned with your global theme (Safety Yellow / Chrome) but allow vibe flavor.
  const palettes: Record<string, { primary: string; secondary: string; accent: string }> = {
    hype: { primary: "#FFD700", secondary: "#E0E0E0", accent: "#FF6A00" },
    chill: { primary: "#00d9ff", secondary: "#00ff99", accent: "#FFD700" },
    storytelling: { primary: "#ff0099", secondary: "#ff6600", accent: "#FFD700" },
    classic: { primary: "#E0E0E0", secondary: "#FFD700", accent: "#000000" },
  };
  return palettes[vibe || "hype"] || palettes.hype;
}

function useReducedMotionFlag() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function useIdle(ms: number) {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const reset = () => {
      setIsIdle(false);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setIsIdle(true), ms);
    };

    reset();
    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("pointermove", reset, opts);
    window.addEventListener("pointerdown", reset, opts);
    window.addEventListener("keydown", reset);
    window.addEventListener("touchstart", reset, opts);
    window.addEventListener("scroll", reset, opts);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.removeEventListener("pointermove", reset);
      window.removeEventListener("pointerdown", reset);
      window.removeEventListener("keydown", reset);
      window.removeEventListener("touchstart", reset);
      window.removeEventListener("scroll", reset);
    };
  }, [ms]);

  return isIdle;
}

const crtFlickerStyle = { "--flicker-delay": 0.2 } as CSSProperties;

function AudioReactiveBackdrop({
  enabled,
  vibe,
  idle,
}: {
  enabled: boolean;
  vibe: Vibe | undefined;
  idle: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<
    { x: number; y: number; vx: number; vy: number; r: number; a: number }[]
  >([]);

  const { analyserNode, ensureAnalyser, isPlaying } = useAudio();
  const reducedMotion = useReducedMotionFlag();
  const palette = getVibePalette(vibe);

  useEffect(() => {
    if (!enabled || reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserNode ?? ensureAnalyser();
    if (!analyser) return;

    const dpr = clamp(window.devicePixelRatio || 1, 1, 2); // mobile safety
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Initialize particles relative to size
      const targetCount = Math.floor(clamp((width * height) / 18000, 30, 90));
      if (particlesRef.current.length !== targetCount) {
        particlesRef.current = Array.from({ length: targetCount }).map(() => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: 0.6 + Math.random() * 1.8,
          a: 0.1 + Math.random() * 0.35,
        }));
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const freq = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      const { width, height } = canvas.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;

      // Background fade (lower cost & smoother)
      ctx.fillStyle = idle ? "rgba(5,5,5,0.22)" : "rgba(5,5,5,0.14)";
      ctx.fillRect(0, 0, width, height);

      // If paused, keep subtle drift only
      let low = 0.05;
      let mid = 0.05;
      let high = 0.05;
      if (isPlaying) {
        analyser.getByteFrequencyData(freq);
        const n = freq.length;
        const a = Math.floor(n * 0.18);
        const b = Math.floor(n * 0.55);
        let s1 = 0, s2 = 0, s3 = 0;
        for (let i = 0; i < a; i++) s1 += freq[i];
        for (let i = a; i < b; i++) s2 += freq[i];
        for (let i = b; i < n; i++) s3 += freq[i];
        low = (s1 / Math.max(1, a)) / 255;
        mid = (s2 / Math.max(1, b - a)) / 255;
        high = (s3 / Math.max(1, n - b)) / 255;
      }

      const energy = clamp((low * 0.9 + mid * 1.1 + high * 1.0) / 3, 0, 1);

      // Glow blobs (screen blend)
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const cx = width * (0.35 + 0.3 * Math.sin(Date.now() / 2600));
      const cy = height * (0.45 + 0.25 * Math.cos(Date.now() / 3100));
      const blobR = Math.max(width, height) * (0.22 + energy * 0.28);

      const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, blobR);
      g1.addColorStop(0, `${palette.primary}22`);
      g1.addColorStop(0.45, `${palette.secondary}12`);
      g1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      const cx2 = width * (0.65 + 0.2 * Math.cos(Date.now() / 2200));
      const cy2 = height * (0.55 + 0.2 * Math.sin(Date.now() / 2800));
      const g2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, blobR * 0.9);
      g2.addColorStop(0, `${palette.accent}18`);
      g2.addColorStop(0.5, `${palette.primary}0D`);
      g2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Particles (energy affects drift)
      const speed = 0.25 + energy * 1.35;
      const tw = width;
      const th = height;
      for (const p of particlesRef.current) {
        p.vx += (Math.random() - 0.5) * 0.02 * speed;
        p.vy += (Math.random() - 0.5) * 0.02 * speed;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx * speed;
        p.y += p.vy * speed;

        if (p.x < -20) p.x = tw + 20;
        if (p.x > tw + 20) p.x = -20;
        if (p.y < -20) p.y = th + 20;
        if (p.y > th + 20) p.y = -20;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255,215,0,${p.a * (0.35 + energy)})`;
        ctx.arc(p.x, p.y, p.r + energy * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Subtle scan pulse
      ctx.save();
      ctx.globalAlpha = 0.06 + energy * 0.08;
      ctx.fillStyle = "#FFD700";
      const y = (Date.now() / (idle ? 6500 : 3800)) % 1;
      ctx.fillRect(0, y * height, width, 1);
      ctx.restore();
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, reducedMotion, analyserNode, ensureAnalyser, isPlaying, palette.primary, palette.secondary, palette.accent, idle]);

  if (!enabled || reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: "screen", opacity: idle ? 0.55 : 0.75 }}
      aria-hidden="true"
    />
  );
}

export function ImmersivePlayerOverlay() {
  const { triggerHaptic } = useHaptic();
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    playTrack,
    skipNext,
    skipPrevious,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    progress,
    seek,
    duration,
    currentTime,
    immersiveOpen,
    setImmersiveOpen,
  } = useAudio();

  const audioTracks = useMemo(() => tracks.filter((t) => t.type === "audio"), []);
  const [queueOpen, setQueueOpen] = useState(false);
  const isIdle = useIdle(3500);

  const active = currentTrack?.type === "audio" ? currentTrack : null;
  const cover = active?.coverArt ?? "/images/branding/piko-logo.png";
  const palette = getVibePalette(active?.vibe);

  // Swipe gestures: left/right = track, down = exit
  const gestureRef = useRef<{ x: number; y: number; t: number } | null>(null);
  useEffect(() => {
    if (!immersiveOpen) return;
    gestureRef.current = null;
  }, [immersiveOpen]);

  // Keyboard shortcuts (Mixmotion-style lean-back controls)
  useEffect(() => {
    if (!immersiveOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setImmersiveOpen(false);
        return;
      }
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        triggerHaptic();
        togglePlay();
        return;
      }
      if (e.key === "ArrowRight") {
        triggerHaptic();
        skipNext();
        return;
      }
      if (e.key === "ArrowLeft") {
        triggerHaptic();
        skipPrevious();
        return;
      }
      if (e.key.toLowerCase() === "q") {
        setQueueOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [immersiveOpen, setImmersiveOpen, skipNext, skipPrevious, togglePlay, triggerHaptic]);

  // Lock body scroll while open
  useEffect(() => {
    if (!immersiveOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [immersiveOpen]);

  const handleSeekPercent = (nextPct: number) => {
    if (!duration) return;
    const time = (clamp(nextPct, 0, 100) / 100) * duration;
    seek(time);
  };

  const queueItems = audioTracks as MediaItem[];

  return (
    <AnimatePresence>
      {immersiveOpen && (
        <motion.div
          className="fixed inset-0 z-200 bg-obsidian-950 text-[#E0E0E0] touch-none select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label="Immersive player"
          onPointerDown={(e) => {
            const el = e.target as HTMLElement | null;
            if (el && el.closest("[data-no-gesture='true']")) return;
            gestureRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
          }}
          onPointerUp={(e) => {
            const start = gestureRef.current;
            gestureRef.current = null;
            const el = e.target as HTMLElement | null;
            if (el && el.closest("[data-no-gesture='true']")) return;
            if (!start) return;
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            const dt = Date.now() - start.t;

            // Quick flick threshold
            const fast = dt < 450;
            const absX = Math.abs(dx);
            const absY = Math.abs(dy);
            const min = fast ? 60 : 90;

            if (absY > absX && dy > min) {
              triggerHaptic();
              setImmersiveOpen(false);
              return;
            }
            if (absX > absY && absX > min) {
              triggerHaptic();
              if (dx > 0) skipPrevious();
              else skipNext();
            }
          }}
        >
          {/* Background: blurred cover + CRT scanlines */}
          <div className="absolute inset-0">
            {isImagePath(cover) ? (
              <Image
                src={cover}
                alt=""
                fill
                priority
                className="object-cover"
                style={{ filter: "blur(28px) grayscale(0.25) contrast(1.05) brightness(0.55)" }}
              />
            ) : (
              <div className={`w-full h-full bg-linear-to-r ${cover}`} />
            )}
            <div className="absolute inset-0 bg-obsidian-950/70" />

            {/* Audio-reactive glow/particles (no extra AudioContext) */}
            <AudioReactiveBackdrop enabled={true} vibe={active?.vibe} idle={isIdle} />

            <div
              className="absolute inset-0 pointer-events-none opacity-[0.12]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, rgba(224,224,224,0.08) 0px, rgba(224,224,224,0.08) 1px, transparent 2px, transparent 4px)",
                mixBlendMode: "overlay",
              }}
            />
            {/* Vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(5,5,5,0.35) 55%, rgba(5,5,5,0.85) 100%)",
              }}
            />
            <div className="absolute inset-0 pointer-events-none vhs-noise" />
          </div>

          {/* Top bar (hidden when idle) */}
          <motion.div
            className="absolute top-0 left-0 right-0 p-4 md:p-6 flex items-center justify-between"
            animate={{ opacity: isIdle ? 0 : 1, y: isIdle ? -8 : 0 }}
            transition={{ duration: 0.2 }}
            data-no-gesture="true"
          >
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setImmersiveOpen(false);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-white/20 bg-black/40 hover:bg-white/10"
              aria-label="Exit immersive mode"
            >
              <ChevronDown className="w-4 h-4" />
              <span className="text-xs font-mono uppercase tracking-[0.2em]">Exit</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQueueOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-white/20 bg-black/40 hover:bg-white/10"
                aria-label="Toggle queue"
                aria-pressed={queueOpen}
              >
                <ListMusic className="w-4 h-4" />
                <span className="text-xs font-mono uppercase tracking-[0.2em]">Queue</span>
              </button>
            </div>
          </motion.div>

          {/* Center: cover + title + visuals */}
          <div className="relative h-full w-full flex items-center justify-center px-4 md:px-8">
            <div className="w-full max-w-5xl">
              <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 lg:gap-10 items-center">
                {/* Cover */}
                <motion.div
                  className="relative mx-auto w-full max-w-[420px]"
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Vinyl-like treatment using clipPath (keeps brutalist 0-radius rules intact) */}
                  <div className="relative aspect-square border-2 border-white/15 bg-black/40 overflow-hidden">
                    {/* Disc base */}
                    <motion.div
                      className="absolute inset-0"
                      animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                      transition={isPlaying ? { duration: 10, ease: "linear", repeat: Infinity } : { duration: 0.4 }}
                      style={{
                        transformOrigin: "50% 50%",
                      }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          clipPath: "circle(46% at 50% 50%)",
                          background: "radial-gradient(circle at center, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0) 55%)",
                        }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          clipPath: "circle(46% at 50% 50%)",
                          background:
                            "repeating-radial-gradient(circle at center, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)",
                          opacity: 0.25,
                          mixBlendMode: "overlay",
                        }}
                      />

                      {/* Artwork inside disc */}
                      <div className="absolute inset-0" style={{ clipPath: "circle(40% at 50% 50%)" }}>
                        {active && isImagePath(active.coverArt) ? (
                          <Image
                            src={active.coverArt}
                            alt={active.title}
                            fill
                            className="object-cover"
                            sizes="420px"
                            priority
                            style={{ filter: "grayscale(0.15) contrast(1.05)" }}
                          />
                        ) : (
                          <div className={`w-full h-full bg-linear-to-r ${active?.coverArt ?? "from-[#FFD700] to-[#E0E0E0]"}`} />
                        )}
                      </div>
                    </motion.div>

                    {/* Center label */}
                    <div
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-black"
                      style={{
                        width: 96,
                        height: 96,
                        clipPath: "circle(50% at 50% 50%)",
                        background: palette.primary,
                        boxShadow: "6px 6px 0px rgba(0,0,0,1)",
                      }}
                    >
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          clipPath: "circle(50% at 50% 50%)",
                          background:
                            "radial-gradient(circle at center, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.22) 70%, rgba(0,0,0,0.55) 100%)",
                        }}
                      >
                        <div className="text-black text-[10px] font-mono font-bold uppercase tracking-[0.25em]">
                          PIKO
                        </div>
                      </div>
                      <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black"
                        style={{ width: 10, height: 10, clipPath: "circle(50% at 50% 50%)" }}
                      />
                    </div>

                    <div className="absolute inset-0 pointer-events-none crt-flicker" style={crtFlickerStyle} />
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        boxShadow:
                          isPlaying ? "0 0 0 2px rgba(255,215,0,0.3), 0 0 60px rgba(255,215,0,0.15)" : "none",
                      }}
                    />
                  </div>
                </motion.div>

                {/* Right column */}
                <div className="w-full">
                  <div className="mb-4 md:mb-6">
                    <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/60">
                      IMMERSIVE_PLAYBACK // SPACE_PLAY_PAUSE // Q_QUEUE // SWIPE_←→_TRACK // SWIPE_↓_EXIT
                    </div>
                    <div className="mt-3 text-3xl md:text-5xl font-black italic uppercase">
                      {active?.title ?? "Select a track"}
                    </div>
                    <div className="mt-2 text-white/70 font-mono">{active?.artist ?? "—"}</div>
                  </div>

                  {/* Visuals */}
                  <div className="mb-4 md:mb-6 border-2 border-white/10 bg-black/30">
                    <EnhancedAudioVisualizer height={56} />
                  </div>

                  {/* Progress + scrub */}
                  <motion.div
                    className="space-y-3"
                    animate={{ opacity: isIdle ? 0 : 1, y: isIdle ? 8 : 0 }}
                    transition={{ duration: 0.2 }}
                    data-no-gesture="true"
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-white/70">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.1"
                      value={progress}
                      onChange={(e) => handleSeekPercent(parseFloat(e.target.value))}
                      aria-label="Seek"
                      className="w-full h-1 bg-white/20 cursor-pointer"
                      style={{ accentColor: "#FFD700" }}
                    />

                    {/* Controls row */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic();
                            skipPrevious();
                          }}
                          className="p-3 border-2 border-white/20 bg-black/40 hover:bg-white/10"
                          aria-label="Previous track"
                        >
                          <SkipBack className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic();
                            togglePlay();
                          }}
                          className="p-4 border-2 border-black bg-[#FFD700] text-black hover:bg-[#E0E0E0]"
                          aria-label={isPlaying ? "Pause" : "Play"}
                        >
                          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic();
                            skipNext();
                          }}
                          className="p-3 border-2 border-white/20 bg-black/40 hover:bg-white/10"
                          aria-label="Next track"
                        >
                          <SkipForward className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic();
                            toggleMute();
                          }}
                          className="p-3 border-2 border-white/20 bg-black/40 hover:bg-white/10"
                          aria-label={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={isMuted ? 0 : Math.round(volume * 100)}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value) / 100;
                            setVolume(v);
                            if (v > 0 && isMuted) toggleMute();
                          }}
                          aria-label="Volume"
                          className="w-28 h-1 bg-white/20 cursor-pointer"
                          style={{ accentColor: "#FFD700" }}
                        />
                      </div>
                    </div>

                    {/* Waveform removed - will be rebuilt in Phase 1 */}
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Queue drawer */}
          <AnimatePresence>
            {queueOpen && (
              <motion.aside
                className="absolute right-0 top-0 bottom-0 w-full max-w-[420px] border-l-2 border-white/10 bg-black/75 backdrop-blur-xl"
                initial={{ x: 24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 24, opacity: 0 }}
                transition={{ duration: 0.2 }}
                aria-label="Queue"
                data-no-gesture="true"
              >
                <div className="p-4 md:p-5 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-[0.25em] text-white/60">Queue</div>
                    <div className="text-lg font-black italic uppercase">Audio Library</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQueueOpen(false)}
                    className="px-3 py-2 border-2 border-white/15 bg-black/40 hover:bg-white/10"
                    aria-label="Close queue"
                  >
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </button>
                </div>

                <div className="p-2 md:p-3 overflow-y-auto h-full">
                  <div className="space-y-1">
                    {queueItems.map((t) => {
                      const isActive = active?.id === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic();
                            playTrack(t);
                          }}
                          className={[
                            "w-full text-left px-3 py-3 border-2",
                            "transition-colors",
                            isActive
                              ? "border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]"
                              : "border-white/10 hover:border-white/20 bg-black/20 text-white",
                          ].join(" ")}
                          aria-current={isActive ? "true" : undefined}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 border border-white/10 bg-black/30 overflow-hidden relative shrink-0">
                              {isImagePath(t.coverArt) ? (
                                <Image src={t.coverArt} alt="" fill className="object-cover" sizes="40px" />
                              ) : (
                                <div className={`w-full h-full bg-linear-to-r ${t.coverArt}`} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-mono text-[11px] uppercase tracking-[0.2em] opacity-70">
                                {t.vibe}
                              </div>
                              <div className="truncate font-bold">{t.title}</div>
                              <div className="truncate text-white/60 text-sm">{t.artist}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Subtle hint when idle */}
          <AnimatePresence>
            {isIdle && (
              <motion.div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 border border-white/15 bg-black/40 text-xs font-mono uppercase tracking-[0.25em] text-white/70"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                Move / tap to reveal controls
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

