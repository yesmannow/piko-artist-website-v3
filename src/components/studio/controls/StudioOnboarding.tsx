"use client";

import { useEffect, useMemo } from "react";
import { useStudioStore } from "@/store/useStudioStore";
import type { OnboardingStep } from "@/store/useStudioStore";

const STORAGE_KEY = "piko-studio-onboarding-seen";

type OnboardingContent = {
  title: string;
  body: string;
  highlightSelector?: string;
};

const onboardingContent: Record<OnboardingStep, OnboardingContent> = {
  welcome: {
    title: "Welcome to Piko Studio",
    body: "This is your virtual DJ studio. We will walk you through the essentials in under a minute.",
  },
  playback: {
    title: "Play and Pause",
    body: "Use the main play button in the control bar to start and stop playback.",
    highlightSelector: "[data-testid='play-toggle']",
  },
  waveform: {
    title: "Waveform Scrubbing",
    body: "Tap or drag on the waveform to scrub through the track.",
    highlightSelector: "[data-testid='main-waveform']",
  },
  "stem-mode": {
    title: "Stem Mode",
    body: "Enable Stem Mode to separate vocals, drums, bass, and more for live remixing.",
    highlightSelector: "[data-testid='stem-mode-toggle']",
  },
  library: {
    title: "Track Library",
    body: "Open the library to browse and load tracks into your decks.",
    highlightSelector: "[data-testid='library-toggle']",
  },
  fx: {
    title: "FX Panel",
    body: "Open the FX panel to add filters, delays, and more to your mix.",
    highlightSelector: "[data-testid='fx-toggle']",
  },
  done: {
    title: "You're ready!",
    body: "Enjoy mixing in Piko Studio.",
  },
};

export function StudioOnboarding() {
  const onboardingStep = useStudioStore((state) => state.onboardingStep);
  const onboardingSeen = useStudioStore((state) => state.onboardingSeen);
  const setOnboardingSeen = useStudioStore((state) => state.setOnboardingSeen);
  const setOnboardingStep = useStudioStore((state) => state.setOnboardingStep);
  const startOnboarding = useStudioStore((state) => state.startOnboarding);
  const nextOnboardingStep = useStudioStore((state) => state.nextOnboardingStep);
  const skipOnboarding = useStudioStore((state) => state.skipOnboarding);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) === "true";
    if (stored) {
      setOnboardingSeen(true);
      setOnboardingStep("done");
      return;
    }
    if (!onboardingSeen && onboardingStep === "welcome") {
      startOnboarding();
    }
  }, [onboardingSeen, onboardingStep, setOnboardingSeen, setOnboardingStep, startOnboarding]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (onboardingSeen) {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
  }, [onboardingSeen]);

  const stepContent = useMemo(() => onboardingContent[onboardingStep], [onboardingStep]);

  useEffect(() => {
    if (onboardingSeen || onboardingStep === "done") return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        skipOnboarding();
      }
      if (event.key === "Enter") {
        nextOnboardingStep();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [nextOnboardingStep, onboardingSeen, onboardingStep, skipOnboarding]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const selector = stepContent?.highlightSelector;
    if (!selector) return;
    const target = document.querySelector(selector) as HTMLElement | null;
    if (!target) return;
    target.setAttribute("data-onboarding-target", "true");
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    return () => {
      target.removeAttribute("data-onboarding-target");
    };
  }, [stepContent]);

  if (onboardingSeen || onboardingStep === "done") return null;

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" data-testid="studio-onboarding" data-step={onboardingStep}>
      <div className="onboarding-card" aria-live="polite">
        <h2>{stepContent.title}</h2>
        <p>{stepContent.body}</p>
        <div className="onboarding-actions">
          <button type="button" className="btn btn-ghost" onClick={skipOnboarding} data-testid="onboarding-skip">
            Skip
          </button>
          <button type="button" className="btn btn-primary" onClick={nextOnboardingStep} data-testid="onboarding-next">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
