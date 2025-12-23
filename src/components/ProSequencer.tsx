"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Share2, Check, Circle } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { getKit, type KitType, type Pad } from "@/lib/audio-kits";
import { MPCScreen } from "@/components/MPCScreen";

const STEPS = 16;
const DEFAULT_BPM = 120;
const MIN_BPM = 60;
const MAX_BPM = 200;
const BARS_TO_RECORD = 4; // 4 bars = 64 steps (16 steps per bar)

type Mode = "sequencer" | "remix";

// Encoding: Convert steps state to compressed string
function encodePattern(steps: Record<string, boolean[]>, pads: Pad[]): string {
  const pattern: string[] = [];
  pads.forEach((pad) => {
    const stepPattern = steps[pad.id] || [];
    // Convert boolean array to binary string, then to base36
    const binary = stepPattern.map((b) => (b ? "1" : "0")).join("");
    // Convert binary to base36 for shorter URLs
    const num = parseInt(binary, 2);
    pattern.push(num.toString(36));
  });
  return pattern.join("-");
}

// Decoding: Parse compressed string back to steps state
function decodePattern(encoded: string, pads: Pad[]): Record<string, boolean[]> | null {
  try {
    const parts = encoded.split("-");
    if (parts.length !== pads.length) return null;

    const decoded: Record<string, boolean[]> = {};
    pads.forEach((pad, index) => {
      const num = parseInt(parts[index], 36);
      const binary = num.toString(2).padStart(STEPS, "0");
      decoded[pad.id] = binary.split("").map((b) => b === "1");
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
  const [selectedKit, setSelectedKit] = useState<KitType>("street");
  const [mode, setMode] = useState<Mode>("sequencer");
  const [isRecording, setIsRecording] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [grit, setGrit] = useState(0); // Master FX: 0-100
  const recordingStepCountRef = useRef(0);

  // Get current kit and pads
  const currentKit = getKit(selectedKit);
  const pads = currentKit.pads;

  // State: [padId][stepIndex] = boolean
  const [steps, setSteps] = useState<Record<string, boolean[]>>(() => {
    // Try to load from URL on mount
    const beatParam = searchParams.get("beat");
    if (beatParam) {
      const decoded = decodePattern(beatParam, pads);
      if (decoded) {
        return decoded;
      }
    }
    // Default empty state
    const initial: Record<string, boolean[]> = {};
    pads.forEach((pad) => {
      initial[pad.id] = new Array(STEPS).fill(false);
    });
    return initial;
  });

  // Remix mode: Track which loops are playing
  const [activeLoops, setActiveLoops] = useState<Set<string>>(new Set());
  const loopAudioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement[]>>({});

  // AudioContext setup
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const waveShaperRef = useRef<WaveShaperNode | null>(null);

  // Initialize AudioContext and master effects chain
  useEffect(() => {
    const initAudioContext = async () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = ctx;

        // Create master gain node
        const masterGain = ctx.createGain();
        masterGain.gain.value = 1.0;
        masterGainRef.current = masterGain;

        // Create wave shaper for distortion/grit
        const waveShaper = ctx.createWaveShaper();
        updateWaveShaperCurve(waveShaper, grit);
        waveShaperRef.current = waveShaper;

        // Connect: masterGain -> waveShaper -> destination
        masterGain.connect(waveShaper);
        waveShaper.connect(ctx.destination);
      } catch (error) {
        console.error("Error initializing AudioContext:", error);
      }
    };

    initAudioContext();

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Update wave shaper curve when grit changes
  const updateWaveShaperCurve = (waveShaper: WaveShaperNode, gritValue: number) => {
    const amount = gritValue / 100; // 0 to 1
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      // Bit-crush and saturation effect
      const k = 2 * amount / (1 - amount);
      curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
      // Add bit-crushing
      const bits = Math.max(1, 16 - Math.floor(amount * 15));
      const step = Math.pow(2, bits);
      curve[i] = Math.floor(curve[i] * step) / step;
    }

    waveShaper.curve = curve;
    waveShaper.oversample = "4x";
  };

  useEffect(() => {
    if (waveShaperRef.current) {
      updateWaveShaperCurve(waveShaperRef.current, grit);
    }
  }, [grit]);

  // Preload audio files (create multiple instances for overlapping sounds)
  useEffect(() => {
    const currentAudioRefs = audioRefs.current;
    const currentLoopRefs = loopAudioRefs.current;

    // Cleanup old refs
    Object.values(currentAudioRefs).forEach((audioArray) => {
      audioArray.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
    });
    Object.values(currentLoopRefs).forEach((audio) => {
      audio.pause();
      audio.src = "";
    });

    // Reset refs
    Object.keys(currentAudioRefs).forEach((key) => delete currentAudioRefs[key]);
    Object.keys(currentLoopRefs).forEach((key) => delete currentLoopRefs[key]);

    // Load sequencer mode pads (one-shot samples)
    if (mode === "sequencer" || selectedKit === "street" || selectedKit === "lofi") {
      pads.forEach((pad) => {
        currentAudioRefs[pad.id] = [];
        // Create 4 instances per pad for overlapping playback
        for (let i = 0; i < 4; i++) {
          const audio = new Audio(pad.audioFile);
          audio.preload = "auto";
          audio.playbackRate = currentKit.playbackRate || 1.0;

          // Connect to master gain if available
          if (audioContextRef.current && masterGainRef.current) {
            try {
              // Resume audio context if suspended (requires user interaction)
              if (audioContextRef.current.state === "suspended") {
                audioContextRef.current.resume();
              }
              const source = audioContextRef.current.createMediaElementSource(audio);
              source.connect(masterGainRef.current);
            } catch (error) {
              console.error(`Error connecting audio for ${pad.name}:`, error);
            }
          }

          currentAudioRefs[pad.id].push(audio);
        }
      });
    }

    // Load remix mode pads (loop stems)
    if (mode === "remix" && (selectedKit === "jardin" || selectedKit === "amor")) {
      pads.forEach((pad) => {
        const audio = new Audio(pad.audioFile);
        audio.loop = true;
        audio.preload = "auto";
        audio.playbackRate = currentKit.playbackRate || 1.0;

        // Connect to master gain if available
        if (audioContextRef.current && masterGainRef.current) {
          try {
            // Resume audio context if suspended (requires user interaction)
            if (audioContextRef.current.state === "suspended") {
              audioContextRef.current.resume();
            }
            const source = audioContextRef.current.createMediaElementSource(audio);
            source.connect(masterGainRef.current);
          } catch (error) {
            console.error(`Error connecting loop audio for ${pad.name}:`, error);
          }
        }

        currentLoopRefs[pad.id] = audio;
      });
    }

    return () => {
      // Cleanup
      Object.values(currentAudioRefs).forEach((audioArray) => {
        audioArray.forEach((audio) => {
          audio.pause();
          audio.src = "";
        });
      });
      Object.values(currentLoopRefs).forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
    };
  }, [selectedKit, mode, currentKit, pads]);

  // Sequencer loop (only for sequencer mode)
  useEffect(() => {
    if (!isPlaying || mode !== "sequencer") {
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
      pads.forEach((pad) => {
        const padSteps = steps[pad.id] || [];
        if (padSteps[currentStep]) {
          // Find an available audio instance
          const audioInstances = audioRefs.current[pad.id];
          if (audioInstances && audioInstances.length > 0) {
            const availableAudio = audioInstances.find(
              (audio) => audio.paused || audio.currentTime === 0
            ) || audioInstances[0]; // Fallback to first if all playing

            // Reset and play with kit-specific playback rate
            availableAudio.currentTime = 0;
            availableAudio.playbackRate = currentKit.playbackRate || 1.0;
            availableAudio.play().catch((err) => {
              console.error(`Error playing ${pad.name}:`, err);
            });
          }
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
  }, [isPlaying, currentStep, bpm, steps, mode, pads, currentKit]);

  // Reset current step when stopping
  useEffect(() => {
    if (!isPlaying) {
      setCurrentStep(0);
      if (isRecording) {
        setIsRecording(false);
        recordingStepCountRef.current = 0;
      }
      // Stop all loops in remix mode
      if (mode === "remix") {
        activeLoops.forEach((padId) => {
          const audio = loopAudioRefs.current[padId];
          if (audio) {
            audio.pause();
            audio.currentTime = 0;
          }
        });
        setActiveLoops(new Set());
      }
    }
  }, [isPlaying, isRecording, mode, activeLoops]);

  // Handle mode change: reset state appropriately
  useEffect(() => {
    if (mode === "remix") {
      // Reset sequencer-specific state
      setCurrentStep(0);
      setIsRecording(false);
    } else {
      // Stop all loops when switching to sequencer mode
      activeLoops.forEach((padId) => {
        const audio = loopAudioRefs.current[padId];
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      setActiveLoops(new Set());
    }
  }, [mode]);

  // Remix mode: Toggle loop playback
  const toggleLoop = async (padId: string) => {
    const audio = loopAudioRefs.current[padId];
    if (!audio) return;

    // Resume audio context on first user interaction
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    setActiveLoops((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(padId)) {
        // Stop loop
        audio.pause();
        audio.currentTime = 0;
        newSet.delete(padId);
      } else {
        // Start loop
        audio.currentTime = 0;
        audio.play().catch((err) => {
          console.error(`Error playing loop ${padId}:`, err);
        });
        newSet.add(padId);
      }
      return newSet;
    });
  };

  // Start recording
  const startRecording = () => {
    if (!isPlaying) {
      setIsPlaying(true);
    }
    setIsRecording(true);
    recordingStepCountRef.current = 0;
  };

  const toggleStep = (padId: string, stepIndex: number) => {
    if (mode === "remix") {
      // In remix mode, clicking a pad toggles the loop
      toggleLoop(padId);
      return;
    }

    setSteps((prev) => {
      const newSteps = { ...prev };
      newSteps[padId] = [...newSteps[padId]];
      newSteps[padId][stepIndex] = !newSteps[padId][stepIndex];
      return newSteps;
    });
  };

  const handleShare = async () => {
    if (mode === "remix") {
      // Remix mode doesn't use pattern encoding
      return;
    }

    const encoded = encodePattern(steps, pads);
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
          {mode === "remix" ? "REMIX STATION" : "PRO SEQUENCER"}
        </h2>
        <p className="text-foreground/60 font-tag text-sm md:text-base">
          {mode === "remix"
            ? "Click pads to toggle loops • Mix stems in real-time"
            : "Click steps to build your pattern • Crate digging enabled"}
        </p>
      </div>

      {/* Mode Selector */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <label className="font-tag text-foreground text-sm md:text-base">Mode:</label>
        <div className="flex gap-2 border-2 border-black shadow-hard">
          <button
            type="button"
            onClick={() => setMode("sequencer")}
            className={`px-4 py-2 font-tag text-sm md:text-base transition-all ${
              mode === "sequencer"
                ? "bg-toxic-lime text-black font-bold"
                : "bg-concrete text-foreground/60 hover:text-foreground"
            }`}
          >
            SEQUENCER
          </button>
          <button
            type="button"
            onClick={() => setMode("remix")}
            className={`px-4 py-2 font-tag text-sm md:text-base transition-all ${
              mode === "remix"
                ? "bg-toxic-lime text-black font-bold"
                : "bg-concrete text-foreground/60 hover:text-foreground"
            }`}
          >
            REMIX
          </button>
        </div>
      </div>

      {/* Kit Selector */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <label className="font-tag text-foreground text-sm md:text-base">Kit:</label>
        <div className="flex gap-2 border-2 border-black shadow-hard flex-wrap justify-center">
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
          <button
            type="button"
            onClick={() => setSelectedKit("jardin")}
            disabled={mode === "sequencer"}
            className={`px-4 py-2 font-tag text-sm md:text-base transition-all ${
              selectedKit === "jardin"
                ? "bg-toxic-lime text-black font-bold"
                : "bg-concrete text-foreground/60 hover:text-foreground"
            } ${mode === "sequencer" ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            JARDIN
          </button>
          <button
            type="button"
            onClick={() => setSelectedKit("amor")}
            disabled={mode === "sequencer"}
            className={`px-4 py-2 font-tag text-sm md:text-base transition-all ${
              selectedKit === "amor"
                ? "bg-toxic-lime text-black font-bold"
                : "bg-concrete text-foreground/60 hover:text-foreground"
            } ${mode === "sequencer" ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            AMOR
          </button>
        </div>
      </div>

      {/* MPC Screen */}
      <div className="mb-6">
        <MPCScreen
          kitName={currentKit.name}
          bpm={bpm}
          audioContext={audioContextRef.current || undefined}
          masterGainNode={masterGainRef.current || undefined}
        />
      </div>

      {/* Sequencer Grid / Remix Pads */}
      <div
        className={`bg-concrete rounded-lg border-2 p-4 md:p-6 transition-all ${
          isRecording ? "border-red-500" : "border-black shadow-hard"
        }`}
        style={{
          animation: isRecording ? "recording-pulse 0.5s ease-in-out infinite" : "none",
          boxShadow: isRecording ? "4px 4px 0px 0px rgba(0,0,0,1)" : "4px 4px 0px 0px rgba(0,0,0,1)",
        }}
      >
        {mode === "sequencer" ? (
          <>
            {/* Step Numbers Header */}
            <div className="grid grid-cols-[120px_repeat(16,1fr)] gap-2 mb-4">
              <div className="text-xs md:text-sm font-tag text-foreground/40 text-center">
                Pad
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

            {/* Pad Rows */}
            <div className="space-y-3">
              {pads.map((pad) => {
                const streetColor = getStreetColor(pad.color);
                const padSteps = steps[pad.id] || [];

                return (
                  <div
                    key={pad.id}
                    className="grid grid-cols-[120px_repeat(16,1fr)] gap-2 items-center"
                  >
                    {/* Pad Label */}
                    <div
                      className="font-header text-sm md:text-base font-bold text-center px-2 py-2 rounded border-2 border-black bg-concrete"
                      style={{
                        color: streetColor,
                      }}
                    >
                      {pad.name}
                    </div>

                    {/* Step Buttons */}
                    {padSteps.map((isActive, stepIndex) => {
                      const isCurrentStep = isPlaying && currentStep === stepIndex;
                      return (
                        <motion.button
                          key={stepIndex}
                          type="button"
                          onClick={() => toggleStep(pad.id, stepIndex)}
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
          </>
        ) : (
          /* Remix Mode: Loop Pads */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pads.map((pad) => {
              const streetColor = getStreetColor(pad.color);
              const isActive = activeLoops.has(pad.id);

              return (
                <motion.button
                  key={pad.id}
                  type="button"
                  onClick={() => toggleLoop(pad.id)}
                  className={`
                    aspect-square rounded-lg
                    border-2 transition-all border-black
                    flex flex-col items-center justify-center gap-2
                    ${isActive ? "scale-95" : "scale-100"}
                  `}
                  style={{
                    borderColor: isActive ? streetColor : "#000",
                    backgroundColor: isActive ? streetColor : "#2a2a2a",
                    boxShadow: isActive ? "4px 4px 0px 0px rgba(0,0,0,1)" : "none",
                  }}
                  whileHover={{
                    scale: 1.05,
                    borderColor: streetColor,
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className="font-header text-lg md:text-xl font-bold"
                    style={{
                      color: isActive ? "#000" : streetColor,
                    }}
                  >
                    {pad.name}
                  </div>
                  {isActive && (
                    <motion.div
                      className="w-3 h-3 rounded-full bg-black"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.7, 1],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Controls */}
        <div className="mt-8 pt-6 border-t-2 border-black">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {/* Play/Stop Button */}
            <motion.button
              onClick={async () => {
                // Resume audio context on first user interaction
                if (audioContextRef.current && audioContextRef.current.state === "suspended") {
                  await audioContextRef.current.resume();
                }
                setIsPlaying(!isPlaying);
              }}
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

            {/* REC Button (only in sequencer mode) */}
            {mode === "sequencer" && (
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
            )}

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

            {/* GRIT Knob (Master FX) */}
            <div className="flex flex-col items-center gap-2">
              <label className="font-tag text-foreground text-xs md:text-sm">
                GRIT
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={grit}
                  onChange={(e) => setGrit(Number(e.target.value))}
                  className="w-24 h-2 bg-foreground/10 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: "#ff6600",
                    background: `linear-gradient(to right, #ff6600 0%, #ff6600 ${grit}%, rgba(255, 255, 255, 0.1) ${grit}%, rgba(255, 255, 255, 0.1) 100%)`,
                  }}
                />
                <span className="font-header text-safety-orange text-sm font-bold min-w-[2.5rem] text-center">
                  {grit}%
                </span>
              </div>
            </div>

            {/* Share Button (only in sequencer mode) */}
            {mode === "sequencer" && (
              <motion.button
                className="px-6 py-3 bg-safety-orange/20 border-2 border-black text-safety-orange font-tag rounded-lg flex items-center gap-2 shadow-hard"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
              >
                <Share2 className="w-5 h-5" />
                Share Beat
              </motion.button>
            )}

            {/* Clear All Button */}
            <motion.button
              className="px-6 py-3 bg-spray-magenta/20 border-2 border-black text-spray-magenta font-tag rounded-lg shadow-hard"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const cleared: Record<string, boolean[]> = {};
                pads.forEach((pad) => {
                  cleared[pad.id] = new Array(STEPS).fill(false);
                });
                setSteps(cleared);
                setIsPlaying(false);
                setCurrentStep(0);
                setActiveLoops(new Set());
                // Stop all loops
                Object.values(loopAudioRefs.current).forEach((audio) => {
                  audio.pause();
                  audio.currentTime = 0;
                });
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

