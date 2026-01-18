"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Ghost, Music2, RefreshCw, Sparkles, X } from "lucide-react";
import { useDeckMixerStore } from "@/store/useDeckMixerStore";

export function GhostDeck() {
  const { ghostDeck, unloadGhostTrack } = useDeckMixerStore((state) => ({
    ghostDeck: state.ghostDeck,
    unloadGhostTrack: state.unloadGhostTrack,
  }));

  const track = ghostDeck.track;
  const keyLabel = ghostDeck.keyInfo?.camelot ?? ghostDeck.keyInfo?.root ?? "—";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b0f1c] via-[#0c1022] to-[#0f172a] p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(193,255,0,0.14),transparent_38%),radial-gradient(circle_at_80%_30%,rgba(124,58,237,0.18),transparent_40%)] blur-2xl" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/70">
          <Ghost className="h-4 w-4 text-[#c1ff00]" />
          Ghost Deck C
        </div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/60">
          <Sparkles className="h-4 w-4 text-[#7c3aed]" />
          Preview Only
        </div>
      </div>

      <div className="relative mt-4 grid gap-4 sm:grid-cols-[120px,1fr] sm:items-center">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {track?.coverArt?.startsWith("/") ? (
            <Image
              src={track.coverArt}
              alt={track.title}
              fill
              className="object-cover blur-[0.25px]"
            />
          ) : (
            <div
              className={`h-full w-full bg-gradient-to-br ${track?.coverArt ?? ""}`}
            />
          )}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white sm:text-2xl">
              {track?.title ?? "Load a track to preview"}
            </h3>
            {ghostDeck.status === "loading" ? (
              <RefreshCw className="h-4 w-4 animate-spin text-[#c1ff00]" />
            ) : null}
          </div>
          <p className="text-sm text-white/70">
            {track?.artist ??
              "Select “Preview in Ghost Deck” from the library."}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1">
              <Music2 className="h-3.5 w-3.5 text-[#c1ff00]" />
              BPM: {ghostDeck.bpm ?? "—"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1">
              Key: {keyLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1">
              Status: {ghostDeck.status}
            </span>
          </div>

          <div className="relative h-16 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <div className="absolute inset-0 bg-gradient-to-r from-[#c1ff00]/10 via-[#7c3aed]/10 to-transparent blur-md" />
            <div className="relative flex h-full items-center gap-1 px-3">
              {[...Array(64).keys()].map((i) => (
                <motion.span
                  key={i}
                  className="h-2 w-1.5 rounded-full bg-white/20"
                  animate={{
                    height:
                      ghostDeck.status === "ready"
                        ? `${(Math.sin(i) + 2) * 8}%`
                        : "8%",
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    delay: i * 0.015,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={unloadGhostTrack}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:border-[#c1ff00]/40"
              disabled={!track}
            >
              <X className="h-4 w-4" />
              Clear Ghost Deck
            </button>
          </div>
        </div>
      </div>

      {ghostDeck.error ? (
        <div className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          {ghostDeck.error}
        </div>
      ) : null}
    </div>
  );
}
