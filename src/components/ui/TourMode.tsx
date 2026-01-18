"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Sparkles, X } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";

interface TourStep {
  id: string;
  title: string;
  description: string;
  selector: string;
  eyebrow?: string;
}

const steps: TourStep[] = [
  {
    id: "launch",
    title: "Launch DJ Studio",
    description:
      "Welcome to the console. This is your studio surface—hardware-grade controls, keyboard shortcuts, and responsive decks built for live use.",
    selector: '[data-tour-id="studio-shell"]',
    eyebrow: "Step 1",
  },
  {
    id: "load-decks",
    title: "Load Deck A / Deck B",
    description:
      "Drag any track into Deck A or Deck B to cue it up. Waveforms, BPM, and key info are all live the second you drop the file.",
    selector: '[data-tour-id="deck-surface"]',
    eyebrow: "Step 2",
  },
  {
    id: "fx",
    title: "Use the FX Rack",
    description:
      "Shape the sound with filters, space, and grit. Flip between Deck A/B, sweep the filter, or drop a quick echo to spice the handoff.",
    selector: '[data-tour-id="fx-rack"]',
    eyebrow: "Step 3",
  },
  {
    id: "record",
    title: "Record your mix",
    description:
      "Arm the recorder before you go live. We capture the whole chain so you can review, share, or clip highlights later.",
    selector: '[data-tour-id="recorder"]',
    eyebrow: "Step 4",
  },
  {
    id: "export",
    title: "Export & share",
    description:
      "Bounce the session when you’re happy. Push to socials, copy a link, or stash the file locally for your archive.",
    selector: '[data-tour-id="export-share"]',
    eyebrow: "Step 5",
  },
];

const spotlightPadding = 10;

export function TourMode() {
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  const {
    tourModeEnabled,
    setTourModeEnabled,
    markTourCompleted,
    resetTourProgress,
    tourCompleted,
    onboardingComplete,
  } = useUIStore((state) => ({
    tourModeEnabled: state.tourModeEnabled,
    setTourModeEnabled: state.setTourModeEnabled,
    markTourCompleted: state.markTourCompleted,
    resetTourProgress: state.resetTourProgress,
    tourCompleted: state.tourCompleted,
    onboardingComplete: state.onboardingComplete,
  }));

  // Auto start for first-time visitors
  useEffect(() => {
    const onboardingReady =
      typeof window !== "undefined" &&
      (localStorage.getItem("onboarding_complete") === "true" ||
        onboardingComplete);
    const hasCompleted =
      typeof window !== "undefined" &&
      (localStorage.getItem("tour_completed") === "true" || tourCompleted);

    if (!tourModeEnabled && !hasCompleted && onboardingReady) {
      const timer = window.setTimeout(() => setTourModeEnabled(true), 1200);
      return () => window.clearTimeout(timer);
    }
  }, [tourModeEnabled, tourCompleted, onboardingComplete, setTourModeEnabled]);

  // Query param trigger: /studio?tour=1
  useEffect(() => {
    if (searchParams?.get("tour") === "1") {
      resetTourProgress();
      setActiveStep(0);
    }
  }, [searchParams, resetTourProgress]);

  // Reset step when tour (re)starts
  useEffect(() => {
    if (tourModeEnabled) {
      setActiveStep(0);
    }
  }, [tourModeEnabled]);

  // Track the position of the target element so the spotlight follows on resize/scroll
  useEffect(() => {
    if (!tourModeEnabled) return;

    const updatePosition = () => {
      const step = steps[activeStep];
      const el = step ? document.querySelector(step.selector) : null;
      if (el instanceof HTMLElement) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
      rafRef.current = requestAnimationFrame(updatePosition);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [activeStep, tourModeEnabled]);

  const handleClose = () => setTourModeEnabled(false);
  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((s) => s + 1);
      return;
    }
    markTourCompleted();
  };

  if (!tourModeEnabled) return null;
  const step = steps[activeStep];

  const cardPosition = () => {
    if (!targetRect) return { top: "10%", left: "50%", translate: "-50%, 0" };

    const top = Math.max(16, targetRect.top + window.scrollY);
    const left = targetRect.left + window.scrollX + targetRect.width + 24;
    const fitsRight = left + 420 < window.innerWidth - 16;

    if (fitsRight) {
      return { top, left, translate: "0, 0" };
    }

    return {
      top: targetRect.bottom + window.scrollY + 24,
      left: targetRect.left + window.scrollX,
      translate: "0, 0",
    };
  };

  const { top, left, translate } = cardPosition();

  return (
    <AnimatePresence>
      {tourModeEnabled ? (
        <motion.div
          className="fixed inset-0 z-[180]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-[1px]"
            onClick={handleClose}
          />

          {/* Spotlight */}
          {targetRect ? (
            <motion.div
              className="absolute rounded-xl border border-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.35)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              style={{
                top: targetRect.top + window.scrollY - spotlightPadding,
                left: targetRect.left + window.scrollX - spotlightPadding,
                width: targetRect.width + spotlightPadding * 2,
                height: targetRect.height + spotlightPadding * 2,
                pointerEvents: "none",
              }}
            />
          ) : null}

          {/* Card */}
          <motion.div
            key={step.id}
            className="absolute max-w-md rounded-2xl border border-white/10 bg-[#0c0c10]/95 p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
            style={{
              top,
              left,
              transform: `translate(${translate})`,
              minWidth: 320,
            }}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#FFD700]/80">
                  {step.eyebrow}
                </p>
                <h3 className="text-xl font-black uppercase leading-tight">
                  {step.title}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-2 text-white/60 transition hover:bg-white/5 hover:text-white"
                aria-label="Close tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              {step.description}
            </p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/60">
                <Sparkles className="h-4 w-4 text-[#FFD700]" />
                <span>
                  {activeStep + 1} / {steps.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeStep > 0 ? (
                  <button
                    onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80 hover:border-white/40"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                ) : null}
                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#FFD700] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-black hover:brightness-110 transition"
                >
                  {activeStep === steps.length - 1 ? (
                    <>
                      Finish <Check className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Next <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
