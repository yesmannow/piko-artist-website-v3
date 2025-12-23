"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Share2, Check } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

interface Instrument {
  id: string;
  name: string;
  audioFile: string;
  color: "green" | "pink" | "cyan";
}

const instruments: Instrument[] = [
  { id: "kick", name: "Kick", audioFile: "/audio/samples/kick-drum-426037.mp3", color: "green" },
  { id: "snare", name: "Snare", audioFile: "/audio/samples/tr909-snare-drum-241413.mp3", color: "pink" },
  { id: "hihat", name: "Hi-Hat", audioFile: "/audio/samples/090241_chimbal-aberto-39488.mp3", color: "cyan" },
  { id: "bass", name: "Bass", audioFile: "/audio/samples/deep-808-230752.mp3", color: "green" },
  { id: "perc", name: "Perc", audioFile: "/audio/samples/shaker-drum-434902.mp3", color: "pink" },
  { id: "fx", name: "FX", audioFile: "/audio/samples/reverse-cymbal-riser-451412.mp3", color: "cyan" },
];

const STEPS = 16;
const DEFAULT_BPM = 120;
const MIN_BPM = 60;
const MAX_BPM = 200;

// Encoding: Convert steps state to compressed string
function encodePattern(steps: Record<string, boolean[]>): string {
  const pattern: string[] = [];
  instruments.forEach((inst) => {
    const stepPattern = steps[inst.id] || [];
    // Convert boolean array to binary string, then to base36
    const binary = stepPattern.map((b) => (b ? "1" : "0")).join("");
    // Convert binary to base36 for shorter URLs
    const num = parseInt(binary, 2);
    pattern.push(num.toString(36));
  });
  return pattern.join("-");
}

// Decoding: Parse compressed string back to steps state
function decodePattern(encoded: string): Record<string, boolean[]> | null {
  try {
    const parts = encoded.split("-");
    if (parts.length !== instruments.length) return null;

    const decoded: Record<string, boolean[]> = {};
    instruments.forEach((inst, index) => {
      const num = parseInt(parts[index], 36);
      const binary = num.toString(2).padStart(STEPS, "0");
      decoded[inst.id] = binary.split("").map((b) => b === "1");
    });
    return decoded;
  } catch {
    return null;
  }
}

export function ProSequencer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showToast, setShowToast] = useState(false);

  // State: [instrumentId][stepIndex] = boolean
  const [steps, setSteps] = useState<Record<string, boolean[]>>(() => {
    // Try to load from URL on mount
    const patternParam = searchParams.get("pattern");
    if (patternParam) {
      const decoded = decodePattern(patternParam);
      if (decoded) {
        return decoded;
      }
    }
    // Default empty state
    const initial: Record<string, boolean[]> = {};
    instruments.forEach((inst) => {
      initial[inst.id] = new Array(STEPS).fill(false);
    });
    return initial;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement[]>>({});

  // Preload audio files (create multiple instances for overlapping sounds)
  useEffect(() => {
    const currentAudioRefs = audioRefs.current;

    instruments.forEach((instrument) => {
      currentAudioRefs[instrument.id] = [];
      // Create 4 instances per instrument for overlapping playback
      for (let i = 0; i < 4; i++) {
        const audio = new Audio(instrument.audioFile);
        audio.preload = "auto";
        currentAudioRefs[instrument.id].push(audio);
      }
    });

    return () => {
      // Cleanup
      Object.values(currentAudioRefs).forEach((audioArray) => {
        audioArray.forEach((audio) => {
          audio.pause();
          audio.src = "";
        });
      });
    };
  }, []);

  // Sequencer loop
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Calculate interval based on BPM (16th notes)
    // BPM = beats per minute, so each step = 60 / (BPM * 4) seconds
    const stepDuration = (60 / (bpm * 4)) * 1000;

    intervalRef.current = setInterval(() => {
      // Play sounds for current step
      instruments.forEach((instrument) => {
        const instrumentSteps = steps[instrument.id] || [];
        if (instrumentSteps[currentStep]) {
          // Find an available audio instance
          const audioInstances = audioRefs.current[instrument.id];
          const availableAudio = audioInstances.find(
            (audio) => audio.paused || audio.currentTime === 0
          ) || audioInstances[0]; // Fallback to first if all playing

          // Reset and play
          availableAudio.currentTime = 0;
          availableAudio.play().catch((err) => {
            console.error(`Error playing ${instrument.name}:`, err);
          });
        }
      });

      // Move to next step
      setCurrentStep((prev) => (prev + 1) % STEPS);
    }, stepDuration);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, currentStep, bpm, steps]);

  // Reset current step when stopping
  useEffect(() => {
    if (!isPlaying) {
      setCurrentStep(0);
    }
  }, [isPlaying]);

  const toggleStep = (instrumentId: string, stepIndex: number) => {
    setSteps((prev) => {
      const newSteps = { ...prev };
      newSteps[instrumentId] = [...newSteps[instrumentId]];
      newSteps[instrumentId][stepIndex] = !newSteps[instrumentId][stepIndex];
      return newSteps;
    });
  };

  const handleShare = async () => {
    const encoded = encodePattern(steps);
    const url = new URL(window.location.href);
    url.searchParams.set("pattern", encoded);

    try {
      await navigator.clipboard.writeText(url.toString());
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);

      // Update URL without reload
      router.push(`/beatmaker?pattern=${encoded}`, { scroll: false });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getNeonColor = (color: "green" | "pink" | "cyan") => {
    switch (color) {
      case "green":
        return "hsl(var(--neon-green))";
      case "pink":
        return "hsl(var(--neon-pink))";
      case "cyan":
        return "hsl(var(--neon-cyan))";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl md:text-4xl font-graffiti mb-2 bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-transparent">
          PRO SEQUENCER
        </h2>
        <p className="text-white/60 font-tag text-sm md:text-base">
          Click steps to build your pattern • Audio engine coming soon
        </p>
      </div>

      {/* Sequencer Grid */}
      <div className="bg-black/50 backdrop-blur-sm rounded-lg border-2 border-white/10 p-4 md:p-6">
        {/* Step Numbers Header */}
        <div className="grid grid-cols-[120px_repeat(16,1fr)] gap-2 mb-4">
          <div className="text-xs md:text-sm font-tag text-white/40 text-center">
            Instrument
          </div>
          {Array.from({ length: STEPS }, (_, i) => (
            <div
              key={i}
              className="text-xs md:text-sm font-tag text-white/40 text-center"
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Instrument Rows */}
        <div className="space-y-3">
          {instruments.map((instrument) => {
            const neonColor = getNeonColor(instrument.color);
            const instrumentSteps = steps[instrument.id] || [];

            return (
              <div
                key={instrument.id}
                className="grid grid-cols-[120px_repeat(16,1fr)] gap-2 items-center"
              >
                {/* Instrument Label */}
                <div
                  className="font-tag text-sm md:text-base font-bold text-center px-2 py-2 rounded border-2"
                  style={{
                    borderColor: neonColor,
                    color: neonColor,
                    backgroundColor: `${neonColor}10`,
                  }}
                >
                  {instrument.name}
                </div>

                {/* Step Buttons */}
                {instrumentSteps.map((isActive, stepIndex) => {
                  const isCurrentStep = isPlaying && currentStep === stepIndex;
                  return (
                    <motion.button
                      key={stepIndex}
                      type="button"
                      onClick={() => toggleStep(instrument.id, stepIndex)}
                      className={`
                        aspect-square rounded
                        border-2 transition-all
                        ${isActive ? "scale-95" : "scale-100"}
                        ${isCurrentStep ? "ring-2 ring-offset-2 ring-offset-black" : ""}
                      `}
                      style={{
                        borderColor: isActive ? neonColor : "rgba(255, 255, 255, 0.2)",
                        backgroundColor: isActive ? `${neonColor}40` : "rgba(255, 255, 255, 0.05)",
                        boxShadow: isActive
                          ? `0 0 10px ${neonColor}, inset 0 0 10px ${neonColor}20`
                          : "none",
                      }}
                      animate={isCurrentStep ? {
                        scale: [1, 1.15, 1],
                      } : {}}
                      transition={isCurrentStep ? {
                        duration: 0.1,
                        repeat: Infinity,
                      } : {}}
                      whileHover={{
                        scale: 1.1,
                        borderColor: neonColor,
                      }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {isActive && (
                        <motion.div
                          className="w-full h-full rounded"
                          style={{
                            backgroundColor: neonColor,
                            opacity: isCurrentStep ? 1 : 0.6,
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {/* Play/Stop Button */}
            <motion.button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-8 py-3 bg-neon-green/20 border-2 border-neon-green/50 text-neon-green font-tag rounded-lg flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                boxShadow: isPlaying
                  ? "0 0 20px hsl(var(--neon-green))"
                  : "none",
              }}
            >
              {isPlaying ? (
                <>
                  <Square className="w-5 h-5" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Play
                </>
              )}
            </motion.button>

            {/* Tempo/BPM Slider */}
            <div className="flex items-center gap-4">
              <label className="font-tag text-white/80 text-sm md:text-base">
                BPM:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={MIN_BPM}
                  max={MAX_BPM}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-32 md:w-40 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-green"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--neon-green)) 0%, hsl(var(--neon-green)) ${((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 100}%, rgba(255, 255, 255, 0.1) ${((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
                  }}
                />
                <span className="font-tag text-neon-green text-lg md:text-xl font-bold min-w-[3rem] text-center">
                  {bpm}
                </span>
              </div>
            </div>

            {/* Share Button */}
            <motion.button
              className="px-6 py-3 bg-neon-cyan/20 border-2 border-neon-cyan/50 text-neon-cyan font-tag rounded-lg flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
            >
              <Share2 className="w-5 h-5" />
              Share Beat
            </motion.button>

            {/* Clear All Button */}
            <motion.button
              className="px-6 py-3 bg-neon-pink/20 border-2 border-neon-pink/50 text-neon-pink font-tag rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const cleared: Record<string, boolean[]> = {};
                instruments.forEach((inst) => {
                  cleared[inst.id] = new Array(STEPS).fill(false);
                });
                setSteps(cleared);
                setIsPlaying(false);
                setCurrentStep(0);
                // Clear URL pattern
                router.push("/beatmaker", { scroll: false });
              }}
            >
              Clear All
            </motion.button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-black/90 border-2 border-neon-green/50 rounded-lg px-6 py-4 flex items-center gap-3 shadow-lg"
            style={{
              boxShadow: "0 0 30px hsl(var(--neon-green))",
            }}
          >
            <Check className="w-5 h-5 text-neon-green" />
            <span className="font-tag text-neon-green">Link Copied!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

