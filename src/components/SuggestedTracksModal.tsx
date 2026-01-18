"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";
import { TrackSuggestion } from "@/engine/suggestMix";
import { useDeckMixerStore } from "@/store/useDeckMixerStore";

type SuggestedTracksModalProps = {
  open: boolean;
  onClose: () => void;
  suggestions: TrackSuggestion[];
};

export function SuggestedTracksModal({
  open,
  onClose,
  suggestions,
}: SuggestedTracksModalProps) {
  const loadGhostTrack = useDeckMixerStore((state) => state.loadGhostTrack);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-sm px-4 py-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            className="ml-auto w-full max-w-xl rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(193,255,0,0.12),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(124,58,237,0.18),transparent_40%)] p-4 shadow-[0_25px_80px_rgba(0,0,0,0.55)]"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-[0.2em] text-white/70">
                Smart Suggestions
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white hover:border-[#c1ff00]/40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {suggestions.map((sugg) => (
                <div
                  key={sugg.track.id}
                  className="grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10">
                    {sugg.track.coverArt?.startsWith("/") ? (
                      <Image
                        src={sugg.track.coverArt}
                        alt={sugg.track.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div
                        className={`h-full w-full bg-gradient-to-br ${sugg.track.coverArt}`}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="truncate">{sugg.track.title}</span>
                      <span className="text-xs text-[#c1ff00]">
                        {sugg.score.toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-white/60 truncate">
                      {sugg.track.artist}
                    </div>
                    <div className="text-[10px] text-white/50 truncate">
                      {sugg.reason}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadGhostTrack(sugg.track.id)}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white hover:border-[#c1ff00]/40"
                  >
                    Load Ghost
                  </button>
                </div>
              ))}
              {suggestions.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60">
                  No suggestions available.
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
