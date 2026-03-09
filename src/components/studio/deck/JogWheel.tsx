"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
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
  readonly analyzing?: boolean; // Phase SE-1: Show analyzing ring
  readonly loading?: boolean;
  readonly playDirection?: 'forward' | 'reverse'; // Phase 4: Reverse playback support
  readonly onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  readonly onPointerMove?: (event: React.PointerEvent<HTMLDivElement>) => void;
  readonly onPointerUp?: (event: React.PointerEvent<HTMLDivElement>) => void;
  readonly onPointerCancel?: (event: React.PointerEvent<HTMLDivElement>) => void;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

// Extract cursor class logic to reduce complexity
const getCursorClass = (disabled: boolean, artworkUrl?: string): string => {
  if (disabled) return "cursor-not-allowed";
  if (artworkUrl) return "cursor-grab active:cursor-grabbing";
  return "cursor-pointer";
};

// Phase 4: Outer ring glow animation based on state
const getOuterRingAnimation = (isPlaying: boolean, accent: string) => {
  if (isPlaying) {
    return {
      boxShadow: [
        `0 0 15px ${accent}40, inset 0 0 20px ${accent}20`,
        `0 0 25px ${accent}60, inset 0 0 30px ${accent}30`,
        `0 0 15px ${accent}40, inset 0 0 20px ${accent}20`,
      ],
    };
  }
  return {
    boxShadow: `0 0 8px ${accent}20, inset 0 0 12px ${accent}10`,
  };
};

// Phase 4: Extract artwork/placeholder content
const ArtworkContent = ({
  artworkUrl,
  title,
  isPlaying,
  rotationSeconds,
  playDirection
}: {
  artworkUrl?: string;
  title?: string;
  isPlaying: boolean;
  rotationSeconds: number;
  playDirection: 'forward' | 'reverse';
}) => {
  if (artworkUrl) {
    return (
      <motion.div
        className="absolute inset-0"
        animate={getRotationAnimation(isPlaying, rotationSeconds, playDirection)}
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
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-[#090b12] via-[#0c0d15] to-[#05060b]">
      <div className="w-20 h-20 rounded-full border border-dashed border-white/10 flex items-center justify-center">
        <div className="text-xs font-mono uppercase tracking-[0.3em] text-white/40">Load</div>
      </div>
    </div>
  );
};

// Phase 4: Extract reverse indicator
const ReverseIndicator = ({ playDirection, isPlaying, accent }: { playDirection: 'forward' | 'reverse'; isPlaying: boolean; accent: string }) => {
  if (playDirection !== 'reverse' || !isPlaying) return null;

  return (
    <motion.div
      className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase tracking-widest"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: [0.6, 1, 0.6], y: 0 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      style={{ color: accent }}
    >
      ⏪
    </motion.div>
  );
};

// Phase 4: Extract BPM badge
const BPMBadge = ({ bpm, bpmText, isSynced, accent }: { bpm?: number; bpmText: string; isSynced: boolean; accent: string }) => {
  if (bpm === undefined) return null;

  return (
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
  );
};

// Phase 4: Interactive wrapper component
const InteractiveWrapper = ({
  onClick,
  disabled,
  cursorClass,
  title,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  children
}: {
  onClick?: () => void;
  disabled: boolean;
  cursorClass: string;
  title?: string;
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (event: React.PointerEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
}) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

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
          {children}
        </div>
      </button>
    );
  }

  return <>{children}</>;
};

// Phase SE-1: Canvas-based 'Analyzing...' energy ring
const EnergyAnalyzingRing = ({ energy, isPlaying }: { energy: number; isPlaying: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 240;
    canvas.width = size;
    canvas.height = size;

    const center = size / 2;
    const radius = center - 8;
    const neonBlue = '#00f2ff';
    const clampedEnergy = Math.max(0, Math.min(1, energy));

    // Speed scales with energy: low energy = slow pulse, high energy = fast
    const pulseSpeed = 0.012 + clampedEnergy * 0.04;
    // Glow intensity scales with energy
    const baseAlpha = 0.15 + clampedEnergy * 0.55;
    const glowSpread = 3 + clampedEnergy * 8;

    const draw = () => {
      phaseRef.current += pulseSpeed;
      const pulse = 0.5 + 0.5 * Math.sin(phaseRef.current);

      ctx.clearRect(0, 0, size, size);

      // Outer energy ring
      const alpha = baseAlpha * (0.6 + pulse * 0.4);
      const lineWidth = 2.5 + clampedEnergy * 2 + pulse * 1.5;

      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 242, 255, ${alpha.toFixed(3)})`;
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = neonBlue;
      ctx.shadowBlur = glowSpread * (0.7 + pulse * 0.3);
      ctx.stroke();

      // Inner subtle ring
      ctx.beginPath();
      ctx.arc(center, center, radius - 6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 242, 255, ${(alpha * 0.2).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 2;
      ctx.stroke();

      // Energy arc segment (sweeps based on energy)
      if (clampedEnergy > 0.05) {
        const arcLength = Math.PI * 2 * clampedEnergy;
        const rotation = phaseRef.current * 0.3;

        ctx.beginPath();
        ctx.arc(center, center, radius - 3, rotation, rotation + arcLength);
        ctx.strokeStyle = `rgba(0, 242, 255, ${(alpha * 0.7).toFixed(3)})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.shadowColor = neonBlue;
        ctx.shadowBlur = glowSpread * 1.5;
        ctx.stroke();
      }

      // Reset shadow
      ctx.shadowBlur = 0;

      // "Analyzing..." label when not playing
      if (!isPlaying && clampedEnergy > 0) {
        const textAlpha = 0.4 + pulse * 0.3;
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(0, 242, 255, ${textAlpha.toFixed(3)})`;
        ctx.fillText('ANALYZING', center, center - radius + 18);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [energy, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

// Phase 4: Extract progress rings
const ProgressRings = ({
  ringGradientId,
  accent,
  circumference,
  dash,
  isPlaying,
  beatFlashDuration
}: {
  ringGradientId: string;
  accent: string;
  circumference: number;
  dash: number;
  isPlaying: boolean;
  beatFlashDuration: number;
}) => {
  const tealAccent = "#009688";
  return (
    <svg className="absolute inset-4" viewBox="0 0 120 120">
      <defs>
        <linearGradient id={ringGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
          <stop offset="100%" stopColor={accent} stopOpacity="1" />
        </linearGradient>
      </defs>
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
  );
};// Extract beat flash animation config to reduce complexity
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

// Extract rotation animation config - Phase 4: Enhanced with reverse support
const getRotationAnimation = (isPlaying: boolean, rotationSeconds: number, playDirection: 'forward' | 'reverse') => {
  if (isPlaying) {
    const targetRotation = playDirection === 'reverse' ? -360 : 360;
    return {
      rotate: targetRotation,
      repeat: Infinity,
      ease: "linear",
      duration: rotationSeconds
    };
  }
  return { rotate: 0, ease: "easeOut", duration: 0.4 };
};

// Extract BPM badge animation config
const getBPMBadgeAnimation = (isSynced: boolean, accent: string) => ({
  color: isSynced ? "#fff" : "rgba(255,255,255,0.72)",
  boxShadow: isSynced
    ? `0 0 20px ${accent}66, 0 8px 24px rgba(0,0,0,0.5)`
    : "0 8px 24px rgba(0,0,0,0.55)",
});

// Phase 4: Calculate jog wheel display values
const calculateJogWheelValues = (progress: number, energy: number, bpm?: number, title?: string, accent?: string) => {
  const circumference = 2 * Math.PI * 46;
  const dash = clamp01(progress) * circumference;
  const ringGradientId = `jog-ring-${(title || accent || "jog").toString().replaceAll(/[^a-z0-9-]/gi, "-").toLowerCase()}`;
  const glowIntensity = Math.min(1, Math.max(0, energy));
  const bpmText = typeof bpm === "number" ? bpm.toFixed(2) : "--.--";
  const rotationSeconds = bpm && bpm > 0 ? beatsToSeconds(4, bpm) : 7;
  const beatFlashDuration = bpm && bpm > 0 ? (60 / bpm) : 1;

  return { circumference, dash, ringGradientId, glowIntensity, bpmText, rotationSeconds, beatFlashDuration };
};

export function JogWheel({
  artworkUrl,
  title,
  progress,
  isPlaying,
  bpm,
  isSynced = false,
  accent = "#22d3ee",
  energy = 0,
  analyzing,
  loading = false,
  playDirection = 'forward', // Phase 4: Default to forward
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onClick,
  disabled = false,
}: Readonly<JogWheelProps>) {
  // Phase SE-1: Auto-detect analyzing state from energy
  const showAnalyzingRing = analyzing ?? (energy > 0);
  const { circumference, dash, ringGradientId, glowIntensity, bpmText, rotationSeconds, beatFlashDuration } =
    calculateJogWheelValues(progress, energy, bpm, title, accent);
  const glowColor = accent;

  const cursorClass = getCursorClass(disabled, artworkUrl);
  const loadingClass = loading ? "animate-pulse" : "";

  const wheelContent = (
    <div
      className={`relative w-full max-w-90 aspect-square rounded-full ${loadingClass}`}
      data-no-swipe="true"
    >
      {/* Phase 4: Enhanced outer ring with animated glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-linear-to-br from-[#050507] via-[#0b0c11] to-[#050507] border border-white/10"
        animate={getOuterRingAnimation(isPlaying, accent)}
        transition={{
          duration: 2,
          repeat: isPlaying ? Infinity : 0,
          ease: "easeInOut",
        }}
        style={{
          boxShadow: "0 18px 45px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      />

      <div className="absolute inset-2 rounded-full border border-white/5 bg-linear-to-b from-[#0f1016] via-[#090a0f] to-[#0f1016] shadow-[inset_0_12px_32px_rgba(0,0,0,0.55)]" />
      <div
        className="absolute inset-4 rounded-full bg-[#040507]"
        style={{
          boxShadow: `inset 0 0 25px rgba(0,0,0,0.9), 0 0 ${10 + glowIntensity * 12}px ${glowIntensity * 0.4}px ${glowColor}`,
          transition: "box-shadow 150ms ease",
        }}
      />

      {/* Phase 4: Playhead marker at 12 o'clock */}
      <motion.div
        className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-6 rounded-full pointer-events-none"
        animate={{
          backgroundColor: isPlaying ? accent : 'rgba(255,255,255,0.3)',
          boxShadow: isPlaying ? `0 0 12px ${accent}` : '0 0 4px rgba(255,255,255,0.2)',
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />

      {/* Phase SE-1: Canvas-based Energy Analyzing Ring */}
      {showAnalyzingRing && (
        <EnergyAnalyzingRing energy={energy} isPlaying={isPlaying} />
      )}

      <ProgressRings
        ringGradientId={ringGradientId}
        accent={accent}
        circumference={circumference}
        dash={dash}
        isPlaying={isPlaying}
        beatFlashDuration={beatFlashDuration}
      />      <div className="absolute inset-9 rounded-full border border-white/5 bg-linear-to-br from-[#0e1118] via-[#0a0b12] to-[#07070c] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
        <ArtworkContent
          artworkUrl={artworkUrl}
          title={title}
          isPlaying={isPlaying}
          rotationSeconds={rotationSeconds}
          playDirection={playDirection}
        />
        <div className="absolute inset-4 rounded-full border border-black/40 shadow-[inset_0_6px_18px_rgba(0,0,0,0.65)]" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_45%)]" />
      </div>

      <div className="absolute inset-16 rounded-full border border-white/5 bg-linear-to-br from-[#0a0c12] to-[#05060a] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] pointer-events-none" />

      {/* Phase 4: Center dot with reverse indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 14px ${accent}` }} />
          <ReverseIndicator playDirection={playDirection} isPlaying={isPlaying} accent={accent} />
        </div>
      </div>


      {bpm !== undefined && (
        <BPMBadge bpm={bpm} bpmText={bpmText} isSynced={isSynced} accent={accent} />
      )}
    </div>
  );

  return (
    <InteractiveWrapper
      onClick={onClick}
      disabled={disabled}
      cursorClass={cursorClass}
      title={title}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {wheelContent}
    </InteractiveWrapper>
  );
}
