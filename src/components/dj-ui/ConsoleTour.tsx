"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useHelp } from "@/context/HelpContext";

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position?: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    id: "library",
    title: "CRATE DIGGING",
    description: "Drag tracks from here onto a Deck.",
    targetSelector: '[data-tour="library"]',
    position: "bottom",
  },
  {
    id: "decks",
    title: "VIRTUAL VINYL",
    description: "This is your player. Click to Play, drag to Scratch.",
    targetSelector: '[data-tour="deck-a"]',
    position: "right",
  },
  {
    id: "sync-pitch",
    title: "BEAT MATCHING",
    description: "Use Sync to lock BPMs, or the slider for manual control.",
    targetSelector: '[data-tour="sync-pitch"]',
    position: "right",
  },
  {
    id: "mixer",
    title: "FREQUENCY CONTROL",
    description: "EQ knobs shape the sound. Use Kill switches to cut bands instantly.",
    targetSelector: '[data-tour="mixer"]',
    position: "left",
  },
  {
    id: "performance-pads",
    title: "REMIX LIVE",
    description: "Set Hot Cues or trigger Loops on the fly.",
    targetSelector: '[data-tour="performance-pads"]',
    position: "top",
  },
  {
    id: "fx-unit",
    title: "TEXTURE",
    description: "Add Reverb, Delay, and Filters to the master output.",
    targetSelector: '[data-tour="fx-unit"]',
    position: "bottom",
  },
  {
    id: "master-out",
    title: "LEVELS",
    description: "Watch the visualizer. Don't redline.",
    targetSelector: '[data-tour="master-out"]',
    position: "top",
  },
];

export function ConsoleTour() {
  const { tourTrigger } = useHelp();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  // 1. Check/Start Tour
  useEffect(() => {
    const tourComplete = localStorage.getItem("piko_tour_complete");
    if (!tourComplete) {
      setTimeout(() => setIsVisible(true), 1500);
    }
  }, []);

  useEffect(() => {
    if (tourTrigger > 0) {
      setIsVisible(true);
      setCurrentStep(0);
    }
  }, [tourTrigger]);

  // 2. Real-time Tracking Loop (Fixes "Sticky" Glitch)
  const updatePosition = useCallback(() => {
    const step = tourSteps[currentStep];
    if (!step) return;

    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      // Only update if dimensions changed meaningfully (prevents jitter)
      setTargetRect((prev) => {
        if (
          !prev ||
          Math.abs(prev.top - rect.top) > 1 ||
          Math.abs(prev.left - rect.left) > 1 ||
          Math.abs(prev.width - rect.width) > 1
        ) {
          return rect;
        }
        return prev;
      });
    }

    if (isVisible) {
      rafRef.current = requestAnimationFrame(updatePosition);
    }
  }, [currentStep, isVisible]);

  // 3. Scroll Into View on Step Change
  useEffect(() => {
    if (isVisible) {
      const step = tourSteps[currentStep];
      const el = document.querySelector(step.targetSelector);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      // Start tracking loop
      updatePosition();
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [currentStep, isVisible, updatePosition]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((p) => p + 1);
    } else {
      handleEndTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((p) => p - 1);
  };

  const handleEndTour = () => {
    setIsVisible(false);
    localStorage.setItem("piko_tour_complete", "true");
  };

  if (!isVisible || !targetRect) return null;
  const step = tourSteps[currentStep];

  // 4. Smart Tooltip Positioning (Fixes Off-Screen Glitch)
  const getSmartPosition = () => {
    const gap = 20;
    let top = 0;
    let left = 0;

    // Default Calculations
    if (step.position === "top") {
      top = targetRect.top - gap - 180; // Default above
    } else if (step.position === "bottom") {
      top = targetRect.bottom + gap;
    } else {
      top = targetRect.top; // Side positioning
    }

    // Vertical Flip Logic: If the tooltip would render below the viewport...
    if (step.position === "bottom" && (top + 250 > window.innerHeight)) {
      // ...force it to render ABOVE the target instead.
      top = targetRect.top - 20 - 200; // 200 is approx tooltip height
    }
    // Edge Detection: Flip if too close to top
    if (step.position === "top" && top < 80) {
      top = targetRect.bottom + gap; // Flip to bottom
    }

    // Safety Clamp: Hard limit to prevent tooltip from rendering below viewport
    const maxTop = window.innerHeight - 250;
    if (top > maxTop) {
      top = targetRect.top - gap - 200; // Force flip to top
    }

    // Horizontal Centering
    if (step.position === "left") {
      left = targetRect.left - 340;
    } else if (step.position === "right") {
      left = targetRect.right + gap;
    } else {
      left = targetRect.left + targetRect.width / 2 - 160; // Center (320px width / 2)
    }

    // Horizontal Safety
    if (left < 10) left = 10;
    if (left + 320 > window.innerWidth) left = window.innerWidth - 330;

    return { top, left };
  };

  const { top, left } = getSmartPosition();

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[10000] pointer-events-none">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80"
            onClick={handleEndTour}
          />

          {/* Spotlight Box */}
          <motion.div
            layoutId="tour-spotlight"
            className="absolute border-2 border-[#ccff00] rounded-lg shadow-[0_0_100px_rgba(204,255,0,0.3)] bg-transparent"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              top: targetRect.top - 5,
              left: targetRect.left - 5,
              width: targetRect.width + 10,
              height: targetRect.height + 10,
            }}
          />

          {/* Tooltip Card */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute pointer-events-auto w-[320px] bg-[#121212] border border-zinc-800 rounded-xl p-5 shadow-2xl z-[10002]"
            style={{ top, left }}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-bold text-[#ccff00] tracking-widest uppercase block mb-1">
                  STEP {currentStep + 1} / {tourSteps.length}
                </span>
                <h3 className="text-lg font-bold text-white leading-none uppercase">{step.title}</h3>
              </div>
              <button onClick={handleEndTour} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">{step.description}</p>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#ccff00] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#b3ff00] transition-colors shadow-[0_0_15px_rgba(204,255,0,0.3)]"
              >
                {currentStep === tourSteps.length - 1 ? "FINISH" : "NEXT"}
                {currentStep !== tourSteps.length - 1 && <ChevronRight className="w-3 h-3" />}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
