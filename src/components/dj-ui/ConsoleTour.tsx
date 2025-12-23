"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string; // CSS selector for the element to highlight
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
    description: "This is your player. Use the Jog Wheel to scratch.",
    targetSelector: '[data-tour="deck-a"]',
    position: "bottom",
  },
  {
    id: "sync-pitch",
    title: "BEAT MATCHING",
    description: "Use Sync to lock BPMs, or the slider for manual control.",
    targetSelector: '[data-tour="sync-pitch"]',
    position: "top",
  },
  {
    id: "mixer",
    title: "FREQUENCY CONTROL",
    description: "EQ knobs shape the sound. Use Kill switches to cut bands instantly.",
    targetSelector: '[data-tour="mixer"]',
    position: "top",
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
    position: "top",
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
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if tour was already completed
    const tourComplete = localStorage.getItem("piko_tour_complete");
    if (tourComplete === "true") {
      return;
    }

    // Auto-start tour after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
      updateTargetPosition();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isVisible) {
      updateTargetPosition();
      window.addEventListener("resize", updateTargetPosition);
      window.addEventListener("scroll", updateTargetPosition, true);

      return () => {
        window.removeEventListener("resize", updateTargetPosition);
        window.removeEventListener("scroll", updateTargetPosition, true);
      };
    }
  }, [isVisible, currentStep, updateTargetPosition]);

  const updateTargetPosition = useCallback(() => {
    const step = tourSteps[currentStep];
    if (!step) return;

    const targetElement = document.querySelector(step.targetSelector);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setTargetRect(rect);
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleEndTour();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEndTour = () => {
    setIsVisible(false);
    localStorage.setItem("piko_tour_complete", "true");
  };

  if (!isVisible || !targetRect) return null;

  const step = tourSteps[currentStep];
  if (!step) return null;

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-4",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-4",
    left: "right-full top-1/2 -translate-y-1/2 mr-4",
    right: "left-full top-1/2 -translate-y-1/2 ml-4",
  };

  return (
    <AnimatePresence>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9999] pointer-events-none"
      >
        {/* Dark backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
        />

        {/* Spotlight (cutout around target) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="black" />
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                fill="white"
                rx="8"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Highlight border around target */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute border-4 border-[#00ff00] rounded-lg pointer-events-none"
          style={{
            left: targetRect.left - 4,
            top: targetRect.top - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: "0 0 30px rgba(0, 255, 0, 0.5)",
          }}
        />

        {/* Tooltip */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`absolute ${positionClasses[step.position || "bottom"]} pointer-events-auto`}
          style={{
            left: targetRect.left + targetRect.width / 2,
            top: step.position === "top" ? targetRect.top : undefined,
            bottom: step.position === "bottom" ? window.innerHeight - targetRect.bottom : undefined,
          }}
        >
          <div className="bg-black/95 border-2 border-[#00ff00] rounded-lg px-6 py-4 shadow-2xl max-w-sm">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-lg font-barlow uppercase text-[#00ff00] tracking-wider mb-1">
                  {step.title}
                </h3>
                <p className="text-sm font-barlow text-gray-300">
                  {step.description}
                </p>
              </div>
              <button
                onClick={handleEndTour}
                className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                aria-label="Close tour"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress indicator */}
            <div className="mb-4">
              <div className="flex gap-1">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded ${
                      index === currentStep
                        ? "bg-[#00ff00]"
                        : index < currentStep
                        ? "bg-[#00ff00]/50"
                        : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs font-barlow text-gray-500 mt-1 text-center">
                {currentStep + 1} / {tourSteps.length}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`flex-1 px-4 py-2 rounded border-2 font-barlow uppercase text-sm transition-all ${
                  currentStep === 0
                    ? "border-gray-700 text-gray-600 cursor-not-allowed"
                    : "border-gray-600 text-gray-300 hover:border-[#00ff00] hover:text-[#00ff00]"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </div>
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-2 rounded border-2 border-[#00ff00] bg-[#00ff00]/10 text-[#00ff00] font-barlow uppercase text-sm hover:bg-[#00ff00]/20 transition-all"
              >
                <div className="flex items-center justify-center gap-2">
                  {currentStep === tourSteps.length - 1 ? "End Tour" : "Next"}
                  {currentStep < tourSteps.length - 1 && (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

