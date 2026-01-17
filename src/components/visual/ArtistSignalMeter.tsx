"use client";

import { motion } from "framer-motion";
import { Sparkles, Waves } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getAudioEngine } from "@/engine/AudioEngine";

function useSignalLevel() {
  const [level, setLevel] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const readLevel = () => {
      try {
        const engine = getAudioEngine();
        const contextState = engine?.context?.state;
        if (engine?.state === "Running" && contextState === "running") {
          const deckLevel = Math.max(
            engine.getRMS("deckA"),
            engine.getRMS("deckB"),
          );
          setLevel(Number.isFinite(deckLevel) ? deckLevel : 0);
        } else {
          setLevel((prev) => Math.max(prev * 0.9 - 0.005, 0));
        }
      } catch {
        setLevel((prev) => Math.max(prev * 0.9 - 0.005, 0));
      }
      frameRef.current = requestAnimationFrame(readLevel);
    };

    frameRef.current = requestAnimationFrame(readLevel);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return level;
}

export function ArtistSignalMeter({ className = "" }: { className?: string }) {
  const level = useSignalLevel();

  const bars = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, idx) => {
        const phase = Math.sin((idx / 18) * Math.PI * 2);
        const base = 10 + phase * 8;
        const dynamic = Math.min(100, level * 120 + base);
        return Math.max(6, dynamic);
      }),
    [level],
  );

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0a0a0f] via-[#0c0c17] to-[#060607] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.55)] ${className}`}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -right-12 top-10 h-48 w-48 rounded-full bg-[#7c3aed]/20 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-[#c1ff00]/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_45%)]" />
      </div>

      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/60">
            Artist Signal
          </p>
          <p className="text-2xl font-semibold text-white">Live Visualizer</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
          <span className="flex h-2 w-2 animate-pulse rounded-full bg-[#c1ff00]" />
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
            Live
          </span>
          <Sparkles className="h-4 w-4 text-[#c1ff00]" aria-hidden />
        </div>
      </div>

      <div className="relative mt-6 rounded-2xl border border-white/10 bg-black/50 p-4">
        <div className="absolute inset-x-4 top-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex h-32 items-end gap-[6px]">
          {bars.map((height, idx) => (
            <motion.div
              key={idx}
              animate={{ height: `${height}%` }}
              transition={{
                type: "spring",
                stiffness: 140,
                damping: 22,
                mass: 0.3,
              }}
              className="w-3 rounded-full bg-gradient-to-t from-[#0ea5e9] via-[#c1ff00] to-white shadow-[0_0_20px_rgba(193,255,0,0.35)]"
              style={{
                filter: "drop-shadow(0 0 12px rgba(193,255,0,0.25))",
              }}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-white/60">
          Visual only • Auto-animates with DJ engine RMS activity
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c1ff00]/15 text-[#c1ff00]">
            <Waves className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">
              DJ Studio
            </p>
            <p className="text-sm font-semibold text-white/90">
              Signal ready to mix
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">
            Tip
          </p>
          <p className="text-sm text-white/80">
            Press <span className="rounded bg-white/10 px-1">S</span> to launch
            the Studio instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
