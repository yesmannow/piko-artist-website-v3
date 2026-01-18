"use client";

import { motion } from "framer-motion";
import { Grid3x3, LayoutList, List, Music2, Radio } from "lucide-react";

export type LibraryView = "list" | "card" | "compact";

type LibraryHeaderProps = {
  view: LibraryView;
  onViewChange: (view: LibraryView) => void;
  tracksCount: number;
  vibes?: string[];
  lastSession?: string | null;
};

const viewButtons: Array<{
  view: LibraryView;
  label: string;
  icon: typeof List;
}> = [
  { view: "list", label: "List", icon: List },
  { view: "card", label: "Grid", icon: Grid3x3 },
  { view: "compact", label: "Compact", icon: LayoutList },
];

export function LibraryHeader({
  view,
  onViewChange,
  tracksCount,
  vibes = [],
  lastSession,
}: LibraryHeaderProps) {
  return (
    <header className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#0b0f1c] to-[#0b1224] p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(193,255,0,0.14),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(124,58,237,0.2),transparent_35%)]" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/70">
            <Music2 className="h-4 w-4 text-[#c1ff00]" aria-hidden />
            Stream • Download • Share
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">
              Music Library
            </h1>
            <p className="text-white/65 text-sm sm:text-base">
              Full catalog rebuilt with vibe filters, Camelot keys, and multiple
              playback views.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-white/70">
            <span className="rounded-full bg-white/10 px-3 py-1">
              {tracksCount} Tracks
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 inline-flex items-center gap-1">
              <Radio className="h-3.5 w-3.5" />
              Live Audio Engine
            </span>
            {lastSession ? (
              <span className="rounded-full bg-white/10 px-3 py-1">
                Last: {lastSession}
              </span>
            ) : null}
            {vibes.length > 0 ? (
              <span className="rounded-full bg-white/10 px-3 py-1">
                {vibes.join(" • ")}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          {viewButtons.map(({ view: option, label, icon: Icon }) => {
            const isActive = view === option;
            return (
              <motion.button
                key={option}
                type="button"
                onClick={() => onViewChange(option)}
                className={`flex min-w-[120px] items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] transition-all ${
                  isActive
                    ? "border-[#c1ff00] bg-[#c1ff00]/15 text-white shadow-[0_0_15px_rgba(193,255,0,0.35)]"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                aria-pressed={isActive}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
