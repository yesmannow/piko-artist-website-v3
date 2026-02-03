"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { beatsToSeconds } from "@/lib/utils/audioMath";

interface JogWheelProps {
  readonly artworkUrl?: string;
  readonly title?: string;
  readonly progress: number; // 0-1
  readonly isPlaying: boolean;
  readonly bpm?: number;
  readonly isSynced?: boolean;
  readonly accent?: string;
  readonly energy?: number;
  readonly loading?: boolean;
  readonly onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  readonly onPointerMove?: (event: React.PointerEvent<HTMLDivElement>) => void;
  readonly onPointerUp?: (event: React.PointerEvent<HTMLDivElement>) => void;
  readonly onPointerCancel?: (event: React.PointerEvent<HTMLDivElement>) => void;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

// Extract cursor class logic to reduce complexity
const getCursorClass = (disabled: boolean, artworkUrl?: string, loading?: boolean): string => {
  if (disabled) return "cursor-not-allowed";
  if (artworkUrl) return "cursor-grab active:cursor-grabbing";
  return "cursor-pointer";
};

// Extract beat flash animation config to reduce complexity
const getBeatFlashAnimation = (isPlaying: boolean, tealAccent: string) => {
  if (!isPlaying) return {};
  return {
    filter: [
      `drop-shadow(0 0 10px ${tealAccent}66)`,
      `drop-shadow(0 0 20px ${tealAccent}dd)`,
      `drop-shadow(0 0 10px ${tealAccent}66)`,
    ],
  };
};

// Extract rotation animation config
const getRotationAnimation = (isPlaying: boolean, rotationSeconds: number) => {
  if (isPlaying) {
    return { repeat: Infinity, ease: "linear", duration: rotationSeconds };
  }
  return { ease: "easeOut", duration: 0.4 };
};

// Extract BPM badge animation config
const getBPMBadgeAnimation = (isSynced: boolean, accent: string) => ({
  color: isSynced ? "#fff" : "rgba(255,255,255,0.72)",
  boxShadow: isSynced
    ? `0 0 20px ${accent}66, 0 8px 24px rgba(0,0,0,0.5)`
    : "0 8px 24px rgba(0,0,0,0.55)",
});

export function JogWheel({
  artworkUrl,
  title,
  progress,
  isPlaying,
  bpm,
  isSynced = false,
  accent = "#22d3ee",
  energy = 0,
  loading = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onClick,
  disabled = false,
}: Readonly<JogWheelProps>) {
  const circumference = 2 * Math.PI * 46;
  const dash = clamp01(progress) * circumference;
  const ringGradientId = useMemo(() => {
    const key = (title || accent || "jog").toString().replaceAll(/[^a-z0-9-]/gi, "-").toLowerCase();
    return `jog-ring-${key}`;
  }, [title, accent]);
  const glowIntensity = Math.min(1, Math.max(0, energy));
  const glowColor = accent;
  const bpmText = typeof bpm === "number" ? bpm.toFixed(2) : "--.--";
  const rotationSeconds = bpm && bpm > 0 ? beatsToSeconds(4, bpm) : 7;

  // Beat flash: Pulse on every beat (Quarter notes)
  const beatFlashDuration = bpm && bpm > 0 ? (60 / bpm) : 1;
  const tealAccent = "#009688"; // 2026 Expert Teal

  const cursorClass = getCursorClass(disabled, artworkUrl, loading);
  const loadingClass = loading ? "animate-pulse" : "";

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement | HTMLButtonElement>) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  const wheelContent = (
    <div
      className={`relative w-full max-w-90 aspect-square rounded-full ${loadingClass}`}
      data-no-swipe="true"
    >
      <div className="absolute inset-0 rounded-full bg-linear-to-br from-[#050507] via-[#0b0c11] to-[#050507] border border-white/10 shadow-[0_18px_45px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)]" />
      <div className="absolute inset-2 rounded-full border border-white/5 bg-linear-to-b from-[#0f1016] via-[#090a0f] to-[#0f1016] shadow-[inset_0_12px_32px_rgba(0,0,0,0.55)]" />
      <div
        className="absolute inset-4 rounded-full bg-[#040507]"
        style={{
          boxShadow: `inset 0 0 25px rgba(0,0,0,0.9), 0 0 ${10 + glowIntensity * 12}px ${glowIntensity * 0.4}px ${glowColor}`,
          transition: "box-shadow 150ms ease",
        }}
      />

      <svg className="absolute inset-4" viewBox="0 0 120 120">
        <defs>
          <linearGradient id={ringGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
            <stop offset="100%" stopColor={accent} stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Background ring */}
        <circle
          cx="60"
          cy="60"
          r="46"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
          strokeDasharray={`${circumference} ${circumference}`}
          transform="rotate(-120 60 60)"
        />
        {/* Progress ring with beat flash */}
        <motion.circle
          cx="60"
          cy="60"
          r="46"
          fill="none"
          stroke={`url(#${ringGradientId})`}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-120 60 60)"
          strokeLinecap="round"
          animate={getBeatFlashAnimation(isPlaying, tealAccent)}
          transition={{
            duration: beatFlashDuration,
            repeat: isPlaying ? Infinity : 0,
            ease: "easeInOut",
          }}
        />
      </svg>

      <div className="absolute inset-9 rounded-full border border-white/5 bg-linear-to-br from-[#0e1118] via-[#0a0b12] to-[#07070c] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
        {artworkUrl ? (
          <motion.div
            className="absolute inset-0"
            animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
            transition={getRotationAnimation(isPlaying, rotationSeconds)}
            style={{ originX: "50%", originY: "50%" }}
          >
            <Image
              src={artworkUrl}
              alt={title || "Track artwork"}
              fill
              className="object-cover"
              unoptimized
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-[#090b12] via-[#0c0d15] to-[#05060b]">
            <div className="w-20 h-20 rounded-full border border-dashed border-white/10 flex items-center justify-center">
              <div className="text-xs font-mono uppercase tracking-[0.3em] text-white/40">Load</div>
            </div>
          </div>
        )}
        <div className="absolute inset-4 rounded-full border border-black/40 shadow-[inset_0_6px_18px_rgba(0,0,0,0.65)]" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_45%)]" />
      </div>

      <div className="absolute inset-16 rounded-full border border-white/5 bg-linear-to-br from-[#0a0c12] to-[#05060a] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 14px ${accent}` }} />
      </div>
      {bpm !== undefined && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <motion.div
            initial={false}
            animate={getBPMBadgeAnimation(isSynced, accent)}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="px-4 py-2 rounded-full bg-black/65 backdrop-blur-md border border-white/12"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            <motion.span
              initial={false}
              animate={{ fontWeight: isSynced ? 800 : 400 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="text-sm tracking-[0.22em] uppercase"
            >
              {bpmText} <span className="text-[10px]">BPM</span>
            </motion.span>
          </motion.div>
        </div>
      )}
    </div>
  );

  // Wrap in button if interactive
  if (onClick && !disabled) {
    return (
      <button
        type="button"
        className={`${cursorClass} bg-transparent border-none p-0 m-0 block`}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        aria-label={title || "Jog wheel"}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerCancel}
        >
          {wheelContent}
        </div>
      </button>
    );
  }

  return wheelContent;
}
