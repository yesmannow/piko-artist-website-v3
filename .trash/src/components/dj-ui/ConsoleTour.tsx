"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Play,
  Music,
  Sliders,
  Zap,
  Radio,
  Mic,
  Download,
} from "lucide-react";
import { useHelp } from "@/context/HelpContext";

interface TourStep {
  id: string;
  title: string;
  description: string;
  tips?: string[];
  targetSelector: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  icon?: React.ReactNode;
}

const tourSteps: TourStep[] = [
  {
    id: "library",
    title: "TRACK LIBRARY",
    description:
      "Your music collection lives here. Drag any track from the library onto Deck A or Deck B to load it. You can also upload your own audio files using the upload button.",
    tips: [
      "💡 Drag tracks directly onto the deck waveforms to load them instantly",
      "💡 Upload your own MP3, WAV, or other audio files to mix",
      "💡 Track info shows BPM, artist, and title for easy selection",
    ],
    targetSelector: '[data-tour="library"]',
    position: "right",
    icon: <Music className="w-6 h-6" />,
  },
  {
    id: "deck-a",
    title: "DECK A - YOUR FIRST PLAYER",
    description:
      "This is your primary turntable. Click the waveform to play/pause. Drag the waveform to scrub through the track. The jog wheel lets you scratch and fine-tune position. Use the reverse button to play backwards, and the loop controls to create seamless loops.",
    tips: [
      "🎯 Click anywhere on the waveform to jump to that position",
      "🎯 Drag the waveform left/right to scrub through the track",
      "🎯 Use the jog wheel to scratch and make precise adjustments",
      "🎯 Use reverse mode for creative transitions",
      "🎯 Set loop points to create repeating sections",
    ],
    targetSelector: '[data-tour="deck-a"]',
    position: "left",
    icon: <Play className="w-6 h-6" />,
  },
  {
    id: "sync-pitch",
    title: "SYNC & PITCH CONTROL",
    description:
      "The SYNC button automatically matches BPMs between decks for perfect beat matching. The pitch slider lets you manually adjust tempo from -8% to +8%. Use quantize to snap loops and cues to the beat grid for precise timing.",
    tips: [
      "⚡ Press SYNC to instantly match Deck B's BPM to Deck A (or vice versa)",
      "⚡ Use the pitch slider for manual tempo adjustments",
      "⚡ Enable quantize to snap all actions to the beat grid",
      "⚡ The beat grid overlay helps visualize track structure",
    ],
    targetSelector: '[data-tour="sync-pitch"]',
    position: "top",
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: "performance-pads",
    title: "PERFORMANCE PADS",
    description:
      "Set hot cues to jump to specific points instantly. Create loops on the fly for live remixing. Each pad can store a cue point or loop. Perfect for live performance and creative mixing.",
    tips: [
      "🔥 Tap a pad to set a hot cue at the current position",
      "🔥 Hold a pad to jump to that cue point",
      "🔥 Use loops for live remixing and extended sections",
      "🔥 Clear cues/loops by holding the pad again",
    ],
    targetSelector: '[data-tour="performance-pads"]',
    position: "top",
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: "mixer-deck-a",
    title: "MIXER - DECK A CONTROLS",
    description:
      "Control Deck A's audio with precision. The volume fader adjusts overall level. EQ knobs (High/Mid/Low) shape frequencies from -12dB to +12dB. Kill switches instantly cut frequency bands for dramatic effects. Each deck has independent controls.",
    tips: [
      "🎚️ Volume fader: Control overall deck volume (0-100%)",
      "🎚️ EQ Knobs: Boost or cut frequencies (±12dB range)",
      "🎚️ Kill Switches: Instantly cut High/Mid/Low bands",
      "🎚️ Tip: Cut lows on one deck while boosting on the other for smooth transitions",
    ],
    targetSelector: '[data-tour="mixer-deck-a"]',
    position: "right",
    icon: <Sliders className="w-6 h-6" />,
  },
  {
    id: "mixer-deck-b",
    title: "MIXER - DECK B CONTROLS",
    description:
      "Deck B has identical controls to Deck A. Use both decks together to create seamless transitions. Balance volumes and EQ settings between decks for professional-sounding mixes.",
    tips: [
      "🎚️ Match Deck B's volume to Deck A for smooth transitions",
      "🎚️ Use EQ to blend tracks together harmoniously",
      "🎚️ Kill switches work great for quick cuts and drops",
      "🎚️ Practice balancing both decks for professional mixes",
    ],
    targetSelector: '[data-tour="mixer-deck-b"]',
    position: "left",
    icon: <Sliders className="w-6 h-6" />,
  },
  {
    id: "crossfader",
    title: "CROSSFADER & BLENDING",
    description:
      "The crossfader blends audio between Deck A (left) and Deck B (right). Choose from three curve types: LINEAR (even blend), SHARP (quick cut), or SMOOTH (gradual transition). Essential for professional DJ mixing.",
    tips: [
      "🎛️ Left = Deck A, Right = Deck B, Center = Both equal",
      "🎛️ LINEAR: Even blend across the range",
      "🎛️ SHARP: Quick cut for fast transitions",
      "🎛️ SMOOTH: Gradual blend for seamless mixing",
      "🎛️ Practice smooth crossfader movements for professional transitions",
    ],
    targetSelector: '[data-tour="crossfader"]',
    position: "top",
    icon: <Sliders className="w-6 h-6" />,
  },
  {
    id: "vu-meters",
    title: "VU METERS & SPECTRUM ANALYZER",
    description:
      "Monitor your audio levels in real-time. VU meters show left/right channel levels. The spectrum analyzer visualizes frequency content. Keep levels in the green/yellow zone - avoid redlining to prevent distortion.",
    tips: [
      "📊 Green = Good levels, Yellow = Getting hot, Red = Too loud!",
      "📊 Watch the spectrum to see frequency balance",
      "📊 Keep levels consistent between decks",
      "📊 Use meters to prevent clipping and distortion",
    ],
    targetSelector: '[data-tour="vu-meters"]',
    position: "top",
    icon: <Radio className="w-6 h-6" />,
  },
  {
    id: "master-limiter",
    title: "MASTER LIMITER",
    description:
      "Protect your mix from clipping with the master limiter. Set the threshold from -12dB to 0dB. The limiter prevents peaks from exceeding the threshold, keeping your mix clean and professional.",
    tips: [
      "🔊 Set threshold based on your mix's peak levels",
      "🔊 Lower threshold = more limiting (safer but quieter)",
      "🔊 Higher threshold = less limiting (louder but risk of clipping)",
      "🔊 Find the sweet spot for your style",
    ],
    targetSelector: '[data-tour="master-limiter"]',
    position: "top",
    icon: <Sliders className="w-6 h-6" />,
  },
  {
    id: "recording",
    title: "RECORD YOUR MIX",
    description:
      "Capture your performance! Click REC to start recording your mix. The recording captures everything: both decks, FX, crossfader movements, and master output. Stop when done, then download your mix as a WebM file.",
    tips: [
      "🎙️ Recording captures the entire master output",
      "🎙️ Start recording before you begin mixing",
      "🎙️ Stop recording when your mix is complete",
      "🎙️ Download your mix to share or archive",
      "🎙️ Recordings are saved locally - no uploads needed",
    ],
    targetSelector: '[data-tour="recording"]',
    position: "top",
    icon: <Download className="w-6 h-6" />,
  },
  {
    id: "fx-unit",
    title: "FX RACK - ADD TEXTURE",
    description:
      "Transform your sound with professional effects. FILTER: Low/High/Band pass filters. GRIT: Add distortion and saturation. REVERB: Create space and depth. DELAY: Echo effects with feedback control. Plus Flanger, Phaser, Chorus, and Echo. Toggle between Deck A and B to apply FX independently.",
    tips: [
      "✨ Toggle DECK A/B to apply FX to different decks",
      "✨ FILTER: Use LPF for smooth transitions, HPF to cut lows",
      "✨ GRIT: Add character and warmth with distortion",
      "✨ REVERB: Create atmosphere and space",
      "✨ DELAY: Use feedback for rhythmic echoes",
      "✨ CLEAR ALL resets all FX for the active deck",
      "✨ Bypass buttons let you toggle FX on/off instantly",
    ],
    targetSelector: '[data-tour="fx-unit"]',
    position: "top",
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: "voice-tags",
    title: "VOICE TAGS - ADD YOUR VOICE",
    description:
      "Record and play voice tags over your mix! Enable your microphone, record a short tag, then drop it during your mix. Perfect for radio-style drops, announcements, or creative vocal effects. Volume is adjustable.",
    tips: [
      "🎤 Enable mic first (browser will ask for permission)",
      "🎤 Record short tags (a few seconds work best)",
      "🎤 Drop tags during your mix for radio-style effects",
      "🎤 Adjust tag volume to blend with your mix",
      "🎤 Download tags to save for later use",
    ],
    targetSelector: '[data-tour="voice-tags"]',
    position: "top",
    icon: <Mic className="w-6 h-6" />,
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

  // 2. Real-time Tracking Loop
  const updatePosition = useCallback(() => {
    const step = tourSteps[currentStep];
    if (!step) return;

    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
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

  // 4. Smart Tooltip Positioning
  const getSmartPosition = () => {
    const gap = 24;
    const tooltipWidth = 420;
    const tooltipHeight = 400;
    let top = 0;
    let left = 0;

    // Default position based on step preference
    if (step.position === "top") {
      top = targetRect.top - gap - tooltipHeight;
    } else if (step.position === "bottom") {
      top = targetRect.bottom + gap;
    } else if (step.position === "left") {
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.left - gap - tooltipWidth;
    } else if (step.position === "right") {
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.right + gap;
    } else {
      // Center
      top = window.innerHeight / 2 - tooltipHeight / 2;
      left = window.innerWidth / 2 - tooltipWidth / 2;
    }

    // Vertical adjustments
    if (top < 20) top = 20;
    if (top + tooltipHeight > window.innerHeight - 20) {
      top = window.innerHeight - tooltipHeight - 20;
    }

    // Horizontal adjustments
    if (left < 20) left = 20;
    if (left + tooltipWidth > window.innerWidth - 20) {
      left = window.innerWidth - tooltipWidth - 20;
    }

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
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={handleEndTour}
          />

          {/* Spotlight Box */}
          <motion.div
            layoutId="tour-spotlight"
            className="absolute border-4 border-[#00ff00] rounded-xl shadow-[0_0_200px_rgba(0,255,0,0.5)] bg-transparent pointer-events-none"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />

          {/* Tooltip Card - Large and Clear */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute pointer-events-auto w-[420px] max-w-[calc(100vw-40px)] bg-[#0a0a0a] border-2 border-[#00ff00] rounded-2xl p-6 shadow-2xl z-[10002]"
            style={{ top, left }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {step.icon && <div className="text-[#00ff00]">{step.icon}</div>}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-[#00ff00] tracking-widest uppercase">
                      STEP {currentStep + 1} / {tourSteps.length}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white leading-tight uppercase tracking-tight">
                    {step.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={handleEndTour}
                className="text-zinc-500 hover:text-white transition-colors p-1 rounded hover:bg-zinc-800"
                aria-label="Close tour"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-zinc-300 mb-4 leading-relaxed">
              {step.description}
            </p>

            {/* Tips Section */}
            {step.tips && step.tips.length > 0 && (
              <div className="mb-6 p-4 bg-[#1a1a1a] rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-[#00ff00]" />
                  <span className="text-xs font-bold text-[#00ff00] uppercase tracking-wider">
                    Pro Tips
                  </span>
                </div>
                <ul className="space-y-2">
                  {step.tips.map((tip, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-zinc-400 leading-relaxed"
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-zinc-900 border-2 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-sm uppercase tracking-wider min-h-[48px]"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-5 h-5" />
                PREV
              </button>

              <div className="flex gap-1">
                {tourSteps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentStep
                        ? "w-6 bg-[#00ff00]"
                        : "w-1.5 bg-zinc-700"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#00ff00] text-black font-black text-sm uppercase tracking-wider hover:bg-[#00e600] transition-all shadow-[0_0_20px_rgba(0,255,0,0.4)] min-h-[48px]"
                aria-label={
                  currentStep === tourSteps.length - 1
                    ? "Finish tour"
                    : "Next step"
                }
              >
                {currentStep === tourSteps.length - 1 ? "FINISH" : "NEXT"}
                {currentStep !== tourSteps.length - 1 && (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
