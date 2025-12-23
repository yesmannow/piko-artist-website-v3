"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { useHelp } from "@/context/HelpContext";

interface TourStep {
  target: string;
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="library"]',
    title: "CRATE DIGGING",
    content: "This is your record crate. Drag and drop any track from here onto Deck A or Deck B to load it.",
    position: "bottom",
  },
  {
    target: '[data-tour="deck-a"]',
    title: "VIRTUAL VINYL",
    content: "Interactive 3D Decks. Click Play to start. Click and drag the record to Scratch.",
    position: "right",
  },
  {
    target: '[data-tour="sync-pitch"]',
    title: "BEAT MATCHING",
    content: "Use the Pitch Slider to manually adjust tempo, or hit SYNC to lock the BPM instantly.",
    position: "right",
  },
  {
    target: '[data-tour="mixer"]',
    title: "THE MIXER",
    content: "Sculpt your sound. Use the 3-Band EQ to cut frequencies and the Kill Switches (K) for instant drops.",
    position: "left",
  },
  {
    target: '[data-tour="performance-pads"]',
    title: "PERFORMANCE PADS",
    content: "Remix live. Set Hot Cues to jump around the track, or trigger Loops for extended mixes.",
    position: "top",
  },
  {
    target: '[data-tour="fx-unit"]',
    title: "FX RACK",
    content: "Add texture. Apply Filters, Reverb, and Delay to the master output for creative transitions.",
    position: "bottom",
  },
  {
    target: '[data-tour="master-out"]',
    title: "MASTER & CROSSFADER",
    content: "Blend between decks using the Crossfader. Watch the Spectrum Analyzer to keep levels in check.",
    position: "top",
  },
];

export function ConsoleTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { tourTrigger } = useHelp();

  // 1. Initial Load Check
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("piko_tour_complete");
    if (!hasSeenTour) {
      // Small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        setIsActive(true);
        setIsReady(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for manual tour trigger
  useEffect(() => {
    if (tourTrigger > 0) {
      setIsActive(true);
      setCurrentStep(0);
      setIsReady(true);
      // Clear the "tour complete" flag so it can run again
      localStorage.removeItem("piko_tour_complete");
    }
  }, [tourTrigger]);

  // 2. Lock Body Scroll when active
  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isActive]);

  // 3. Find Target Element
  const updateTargetPosition = useCallback(() => {
    if (!isActive) return;

    const step = tourSteps[currentStep];
    const element = document.querySelector(step.target);

    if (element) {
      // Get rect relative to VIEWPORT (fixed), not document
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);

      // Scroll element into view if needed (smoothly)
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      // Skip step if target is missing (e.g. mobile hidden elements)
      console.warn(`Tour target missing: ${step.target}`);
    }
  }, [isActive, currentStep]);

  // Update position on step change or resize
  useEffect(() => {
    updateTargetPosition();
    window.addEventListener("resize", updateTargetPosition);
    return () => window.removeEventListener("resize", updateTargetPosition);
  }, [updateTargetPosition]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      endTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const endTour = () => {
    setIsActive(false);
    localStorage.setItem("piko_tour_complete", "true");
  };

  if (!isActive || !targetRect || !isReady) return null;

  const step = tourSteps[currentStep];

  // Calculate Tooltip Position based on fixed coords
  const getTooltipStyle = () => {
    const gap = 20;
    const tooltipWidth = 320; // approximate
    // Default to bottom center
    let top = targetRect.bottom + gap;
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;

    // Adjust based on preference
    if (step.position === "top") {
      top = targetRect.top - gap - 200; // approximate height
    } else if (step.position === "right") {
      left = targetRect.right + gap;
      top = targetRect.top;
    } else if (step.position === "left") {
      left = targetRect.left - tooltipWidth - gap;
      top = targetRect.top;
    }

    // Safety bounds (keep onscreen)
    if (left < 20) left = 20;
    if (left + tooltipWidth > window.innerWidth) left = window.innerWidth - tooltipWidth - 20;
    if (top < 20) top = targetRect.bottom + gap; // Fallback to bottom if top is cropped

    return { top, left };
  };

  const tooltipPos = getTooltipStyle();

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* 1. Dark Backdrop (Fixed) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[9990]"
            onClick={endTour} // Click outside to exit
          />

          {/* 2. Global Exit Button (Safety Valve) */}
          <button
            onClick={endTour}
            className="fixed top-4 right-4 z-[10001] p-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-full border border-zinc-700"
            title="Close Tour"
          >
            <X className="w-6 h-6" />
          </button>

          {/* 3. The Spotlight (Hole in the dark) - Fixed */}
          <motion.div
            layoutId="tour-spotlight"
            className="fixed rounded-lg border-2 border-toxic-lime shadow-[0_0_50px_rgba(204,255,0,0.2)] z-[9999] pointer-events-none"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            style={{
              top: targetRect.top - 5,
              left: targetRect.left - 5,
              width: targetRect.width + 10,
              height: targetRect.height + 10,
            }}
          />

          {/* 4. The Tooltip Card - Fixed */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={currentStep}
            className="fixed z-[10000] w-[320px] bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl"
            style={{
              top: tooltipPos.top,
              left: tooltipPos.left,
            }}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <span className="text-[10px] font-industrial text-toxic-lime tracking-widest uppercase mb-1 block">
                  STEP {currentStep + 1} / {tourSteps.length}
                </span>
                <h3 className="text-lg font-header text-white leading-none">{step.title}</h3>
              </div>
            </div>

            <p className="text-sm text-zinc-400 mb-6 font-sans leading-relaxed">{step.content}</p>

            <div className="flex items-center justify-between">
              <button
                onClick={endTour}
                className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider"
              >
                Skip
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-toxic-lime text-black font-bold text-xs uppercase tracking-wider hover:bg-[#b3ff00] transition-colors shadow-[0_0_15px_rgba(204,255,0,0.3)]"
                >
                  {currentStep === tourSteps.length - 1 ? "Finish" : "Next"}
                  {currentStep !== tourSteps.length - 1 && <ChevronRight className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
