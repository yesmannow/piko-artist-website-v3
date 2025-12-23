"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Share2, Check, Circle } from "lucide-react";
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
const BARS_TO_RECORD = 4; // 4 bars = 64 steps (16 steps per bar)

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

type KitType = "street" | "lofi";

export function ProSequencer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showToast, setShowToast] = useState(false);
  const [selectedKit, setSelectedKit] = useState<KitType>("street");
  const [isRecording, setIsRecording] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const recordingStepCountRef = useRef(0);

  // State: [instrumentId][stepIndex] = boolean
  const [steps, setSteps] = useState<Record<string, boolean[]>>(() => {
    // Try to load from URL on mount
    const beatParam = searchParams.get("beat");
    if (beatParam) {
      const decoded = decodePattern(beatParam);
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
        // Set playback rate based on kit selection
        audio.playbackRate = selectedKit === "lofi" ? 0.8 : 1.0;
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
  }, [selectedKit]);

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

          // Reset and play with kit-specific playback rate
          availableAudio.currentTime = 0;
          availableAudio.playbackRate = selectedKit === "lofi" ? 0.8 : 1.0;
          availableAudio.play().catch((err) => {
            console.error(`Error playing ${instrument.name}:`, err);
          });
        }
      });

      // Move to next step
      setCurrentStep((prev) => {
        const nextStep = (prev + 1) % STEPS;

        // Recording logic: count steps and stop after 4 bars (64 steps)
        if (isRecording) {
          recordingStepCountRef.current += 1;
          if (recordingStepCountRef.current >= BARS_TO_RECORD * STEPS) {
            setIsRecording(false);
            setShowRecordModal(true);
            recordingStepCountRef.current = 0;
          }
        }

        return nextStep;
      });
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
      if (isRecording) {
        setIsRecording(false);
        recordingStepCountRef.current = 0;
      }
    }
  }, [isPlaying, isRecording]);

  // Start recording
  const startRecording = () => {
    if (!isPlaying) {
      setIsPlaying(true);
    }
    setIsRecording(true);
    recordingStepCountRef.current = 0;
  };

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
    url.searchParams.set("beat", encoded);

    try {
      await navigator.clipboard.writeText(url.toString());
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);

      // Update URL without reload
      router.push(`/beatmaker?beat=${encoded}`, { scroll: false });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getStreetColor = (color: "green" | "pink" | "cyan") => {
    switch (color) {
      case "green":
        return "#ccff00"; // toxic-lime
      case "pink":
        return "#ff0099"; // spray-magenta
      case "cyan":
        return "#ff6600"; // safety-orange
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl md:text-4xl font-header mb-2 text-foreground">
          PRO SEQUENCER
        </h2>
        <p className="text-foreground/60 font-tag text-sm md:text-base">
          Click steps to build your pattern • Crate digging enabled
        </p>
      </div>

      {/* Kit Selector */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <label className="font-tag text-foreground text-sm md:text-base">Kit:</label>
        <div className="flex gap-2 border-2 border-black shadow-hard">
          <button
            type="button"
            onClick={() => setSelectedKit("street")}
            className={`px-4 py-2 font-tag text-sm md:text-base transition-all ${
              selectedKit === "street"
                ? "bg-toxic-lime text-black font-bold"
                : "bg-concrete text-foreground/60 hover:text-foreground"
            }`}
          >
            STREET
          </button>
          <button
            type="button"
            onClick={() => setSelectedKit("lofi")}
            className={`px-4 py-2 font-tag text-sm md:text-base transition-all ${
              selectedKit === "lofi"
                ? "bg-toxic-lime text-black font-bold"
                : "bg-concrete text-foreground/60 hover:text-foreground"
            }`}
          >
            LO-FI
          </button>
        </div>
      </div>

      {/* Sequencer Grid */}
      <div
        className={`bg-concrete rounded-lg border-2 p-4 md:p-6 transition-all ${
          isRecording ? "border-red-500" : "border-black shadow-hard"
        }`}
        style={{
          animation: isRecording ? "recording-pulse 0.5s ease-in-out infinite" : "none",
          boxShadow: isRecording ? "4px 4px 0px 0px rgba(0,0,0,1)" : "4px 4px 0px 0px rgba(0,0,0,1)",
        }}
      >
        {/* Step Numbers Header */}
        <div className="grid grid-cols-[120px_repeat(16,1fr)] gap-2 mb-4">
          <div className="text-xs md:text-sm font-tag text-foreground/40 text-center">
            Instrument
          </div>
          {Array.from({ length: STEPS }, (_, i) => (
            <div
              key={i}
              className="text-xs md:text-sm font-tag text-foreground/40 text-center"
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Instrument Rows */}
        <div className="space-y-3">
          {instruments.map((instrument) => {
            const streetColor = getStreetColor(instrument.color);
            const instrumentSteps = steps[instrument.id] || [];

            return (
              <div
                key={instrument.id}
                className="grid grid-cols-[120px_repeat(16,1fr)] gap-2 items-center"
              >
                {/* Instrument Label */}
                <div
                  className="font-header text-sm md:text-base font-bold text-center px-2 py-2 rounded border-2 border-black bg-concrete"
                  style={{
                    color: streetColor,
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
                        border-2 transition-all border-black
                        ${isActive ? "scale-95" : "scale-100"}
                        ${isCurrentStep ? "ring-2 ring-offset-1 ring-offset-concrete" : ""}
                      `}
                      style={{
                        borderColor: isActive ? streetColor : "#000",
                        backgroundColor: isActive ? streetColor : "#2a2a2a",
                        boxShadow: isActive ? "4px 4px 0px 0px rgba(0,0,0,1)" : "none",
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
                        borderColor: streetColor,
                      }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {isActive && (
                        <motion.div
                          className="w-full h-full rounded"
                          style={{
                            backgroundColor: streetColor,
                            opacity: isCurrentStep ? 1 : 0.8,
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
        <div className="mt-8 pt-6 border-t-2 border-black">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {/* Play/Stop Button */}
            <motion.button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-6 md:px-8 py-3 bg-toxic-lime/20 border-2 border-black text-toxic-lime font-tag rounded-lg flex items-center gap-2 shadow-hard"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                boxShadow: isPlaying
                  ? "4px 4px 0px 0px rgba(0,0,0,1), 0 0 20px #ccff00"
                  : "4px 4px 0px 0px rgba(0,0,0,1)",
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

            {/* REC Button */}
            <motion.button
              onClick={startRecording}
              disabled={isRecording}
              className={`px-6 md:px-8 py-3 border-2 border-black font-tag rounded-lg flex items-center gap-2 shadow-hard ${
                isRecording
                  ? "bg-red-500 text-white"
                  : "bg-concrete text-red-500 hover:bg-red-500/10"
              }`}
              whileHover={!isRecording ? { scale: 1.05 } : {}}
              whileTap={!isRecording ? { scale: 0.95 } : {}}
              style={{
                boxShadow: isRecording
                  ? "4px 4px 0px 0px rgba(0,0,0,1), 0 0 20px #ef4444"
                  : "4px 4px 0px 0px rgba(0,0,0,1)",
              }}
            >
              <Circle className={`w-5 h-5 ${isRecording ? "fill-white" : "fill-red-500"}`} />
              {isRecording ? "REC..." : "REC"}
            </motion.button>

            {/* Tempo/BPM Slider */}
            <div className="flex items-center gap-4">
              <label className="font-tag text-foreground text-sm md:text-base">
                BPM:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={MIN_BPM}
                  max={MAX_BPM}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-32 md:w-40 h-2 bg-foreground/10 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: "#ccff00",
                    background: `linear-gradient(to right, #ccff00 0%, #ccff00 ${((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 100}%, rgba(255, 255, 255, 0.1) ${((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
                  }}
                />
                <span className="font-header text-toxic-lime text-lg md:text-xl font-bold min-w-[3rem] text-center">
                  {bpm}
                </span>
              </div>
            </div>

            {/* Share Button */}
            <motion.button
              className="px-6 py-3 bg-safety-orange/20 border-2 border-black text-safety-orange font-tag rounded-lg flex items-center gap-2 shadow-hard"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
            >
              <Share2 className="w-5 h-5" />
              Share Beat
            </motion.button>

            {/* Clear All Button */}
            <motion.button
              className="px-6 py-3 bg-spray-magenta/20 border-2 border-black text-spray-magenta font-tag rounded-lg shadow-hard"
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
                // Clear URL beat parameter
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
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-concrete border-2 border-black rounded-lg px-6 py-4 flex items-center gap-3 shadow-hard"
          >
            <Check className="w-5 h-5 text-toxic-lime" />
            <span className="font-tag text-toxic-lime">Link Copied!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Record Modal */}
      <AnimatePresence>
        {showRecordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowRecordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-concrete border-2 border-black p-6 md:p-8 max-w-md w-full shadow-hard"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-header text-2xl md:text-3xl text-foreground mb-4 text-center">
                Beat Captured!
              </h3>
              <p className="font-tag text-foreground/80 text-center mb-6">
                Share this pattern?
              </p>
              <div className="flex gap-4 justify-center">
                <motion.button
                  onClick={() => {
                    setShowRecordModal(false);
                    handleShare();
                  }}
                  className="px-6 py-3 bg-toxic-lime border-2 border-black text-black font-tag rounded-lg shadow-hard"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Share
                </motion.button>
                <motion.button
                  onClick={() => setShowRecordModal(false)}
                  className="px-6 py-3 bg-concrete border-2 border-black text-foreground font-tag rounded-lg shadow-hard"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

