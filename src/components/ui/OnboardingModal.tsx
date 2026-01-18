"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, PartyPopper } from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
  onDismissPermanently: () => void;
}

const checklist = [
  {
    icon: "🎧",
    title: "Load your first track",
    copy: "Drag a track into Deck A or Deck B to get the waveform moving.",
  },
  {
    icon: "🧪",
    title: "Try FX",
    copy: "Shape your sound with filters and space—keep it subtle or go wild.",
  },
  {
    icon: "🗂️",
    title: "Explore your library",
    copy: "Search, sort, and prep playlists so the next transition is instant.",
  },
];

export function OnboardingModal({
  open,
  onStart,
  onSkip,
  onDismissPermanently,
}: OnboardingModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-gradient-to-br from-[#0b0b0f] via-[#0f0f13] to-[#0c0c10] p-6 shadow-[0_0_40px_rgba(0,0,0,0.45)]"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <button
              onClick={onSkip}
              aria-label="Close onboarding"
              className="absolute right-3 top-3 rounded-full p-2 text-white/60 hover:text-white hover:bg-white/5"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFD700]/10 text-[#FFD700]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-white/50">
                  First run
                </p>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  Quick onboarding
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {checklist.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="text-xl">{item.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-white/70 leading-relaxed">
                      {item.copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/60">
                <PartyPopper className="h-4 w-4 text-[#FFD700]" />
                Stay in the mix with a 30s primer.
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={onStart}
                  className="inline-flex items-center justify-center rounded-lg bg-[#FFD700] px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-black hover:brightness-110 transition-all"
                >
                  Let&apos;s Go
                </button>
                <button
                  onClick={onSkip}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/80 hover:border-white/40 transition-all"
                >
                  Skip
                </button>
                <button
                  onClick={onDismissPermanently}
                  className="text-xs uppercase tracking-[0.16em] text-white/50 underline underline-offset-4 hover:text-white/80"
                >
                  Don&apos;t show again
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
