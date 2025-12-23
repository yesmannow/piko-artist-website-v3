"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Share2, Check, Circle } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { getKit, type KitType, type Pad } from "@/lib/audio-kits";
import { MPCScreen } from "@/components/MPCScreen";
import {
  AudioEngine,
  LookaheadScheduler,
  getAudioEngine,
  disposeAudioEngine,
} from "@/lib/audio-engine";

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
  const [speed, setSpeed] = useState(1.0); // Speed/Pitch: 0.5-1.0
  const [filter, setFilter] = useState(100); // Filter: 0-100
  const [mutedPads, setMutedPads] = useState<Set<string>>(new Set()); // Muted pads in remix mode
  const [buffersLoaded, setBuffersLoaded] = useState(false);
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
  const loopGainRefs = useRef<Record<string, GainNode>>({});

  // Refs for accessing state values in scheduler callbacks without triggering re-renders
  const isRecordingRef = useRef(isRecording);
  const stepsRef = useRef(steps);
  const speedRef = useRef(speed);

  // Keep refs in sync with state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(DEFAULT_BPM);

  // Audio Engine refs
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const schedulerRef = useRef<LookaheadScheduler | null>(null);

  // Initialize Audio Engine
  useEffect(() => {
    const engine = getAudioEngine();
    audioEngineRef.current = engine;

    // Create scheduler with callbacks
    const scheduler = engine.createScheduler({
      // Called when a step should be played (with precise audio timing)
      onStep: (stepIndex, time) => {
        const currentSteps = stepsRef.current;
        const currentSpeed = speedRef.current;
        const kit = getKit(selectedKit);
        const baseRate = kit.playbackRate || 1.0;

        // Play sounds for this step
        kit.pads.forEach((pad) => {
          const padSteps = currentSteps[pad.id] || [];
          if (padSteps[stepIndex]) {
            const buffer = engine.bufferManager.getBuffer(pad.audioFile);
            if (buffer) {
              engine.playBuffer(buffer, {
                time,
                playbackRate: baseRate * currentSpeed,
              });
            }
          }
        });

        // Recording logic
        if (isRecordingRef.current) {
          recordingStepCountRef.current += 1;
          if (recordingStepCountRef.current >= BARS_TO_RECORD * STEPS) {
            setIsRecording(false);
            setShowRecordModal(true);
            recordingStepCountRef.current = 0;
          }
        }
      },
      // Called for visual updates (synced with audio but runs on main thread)
      onStepVisual: (stepIndex) => {
        setCurrentStep(stepIndex);
      },
    });

    schedulerRef.current = scheduler;
    scheduler.setBpm(bpm);

    return () => {
      scheduler.stop();
      disposeAudioEngine();
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update scheduler BPM when it changes
  useEffect(() => {
    if (schedulerRef.current) {
      schedulerRef.current.setBpm(bpm);
    }
  }, [bpm]);

  // Load audio buffers for current kit
  useEffect(() => {
    const loadBuffers = async () => {
      const engine = audioEngineRef.current;
      if (!engine) return;

      setBuffersLoaded(false);

      // Get all audio URLs for current kit
      const urls = pads.map((pad) => pad.audioFile);

      try {
        await engine.bufferManager.preloadBuffers(urls);
        setBuffersLoaded(true);
      } catch (error) {
        console.error("Error loading audio buffers:", error);
      }
    };

    loadBuffers();
  }, [selectedKit, pads]);

  // Update effects when parameters change
  useEffect(() => {
    const engine = audioEngineRef.current;
    if (engine) {
      engine.setGrit(grit);
    }
  }, [grit]);

  useEffect(() => {
    const engine = audioEngineRef.current;
    if (engine) {
      engine.setFilter(filter);
    }
  }, [filter]);

  // Handle play/stop
  useEffect(() => {
    const scheduler = schedulerRef.current;
    const engine = audioEngineRef.current;

    if (!scheduler || !engine) return;

    if (isPlaying && mode === "sequencer") {
      // Resume audio context if needed
      engine.resume().then(() => {
        scheduler.start();
      });
    } else {
      scheduler.stop();
      scheduler.reset();
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
  }, [isPlaying, mode, isRecording, activeLoops]);

  // Load remix mode audio (uses HTMLAudioElement for looping)
  useEffect(() => {
    const engine = audioEngineRef.current;
    if (!engine || mode !== "remix") return;

    const currentLoopRefs = loopAudioRefs.current;

    // Cleanup old refs
    Object.values(currentLoopRefs).forEach((audio) => {
      audio.pause();
      audio.src = "";
    });
    Object.keys(currentLoopRefs).forEach((key) => delete currentLoopRefs[key]);
    Object.keys(loopGainRefs.current).forEach((key) => delete loopGainRefs.current[key]);

    // Only load for remix-compatible kits
    if (selectedKit === "jardin" || selectedKit === "amor") {
      pads.forEach((pad) => {
        const audio = new Audio(pad.audioFile);
        audio.loop = true;
        audio.preload = "auto";
        audio.playbackRate = (currentKit.playbackRate || 1.0) * speed;

        try {
          const source = engine.audioContext.createMediaElementSource(audio);
          const gainNode = engine.audioContext.createGain();
          gainNode.gain.value = mutedPads.has(pad.id) ? 0 : 1.0;

          source.connect(gainNode);
          gainNode.connect(engine.getInputNode());

          loopGainRefs.current[pad.id] = gainNode;
        } catch (error) {
          console.error(`Error connecting loop audio for ${pad.name}:`, error);
        }

        currentLoopRefs[pad.id] = audio;
      });
    }

    return () => {
      Object.values(currentLoopRefs).forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
    };
  }, [selectedKit, mode, currentKit, pads, speed, mutedPads]);

  // Update loop playback rate when speed changes
  useEffect(() => {
    const baseRate = currentKit.playbackRate || 1.0;
    const targetRate = baseRate * speed;

    Object.values(loopAudioRefs.current).forEach((audio) => {
      audio.playbackRate = targetRate;
    });
  }, [speed, currentKit]);

  // Update gain nodes when mute state changes
  useEffect(() => {
    Object.keys(loopGainRefs.current).forEach((padId) => {
      const gainNode = loopGainRefs.current[padId];
      if (gainNode) {
        gainNode.gain.value = mutedPads.has(padId) ? 0 : 1.0;
      }
    });
  }, [mutedPads]);

  // Handle mode change
  useEffect(() => {
    if (mode === "remix") {
      setCurrentStep(0);
      setIsRecording(false);
      schedulerRef.current?.stop();
    } else {
      // Stop all loops when switching to sequencer mode
      Object.values(loopAudioRefs.current).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      setActiveLoops(new Set());
    }
  }, [mode]);

  // Remix mode: Toggle loop playback
  const toggleLoop = useCallback(async (padId: string) => {
    const audio = loopAudioRefs.current[padId];
    if (!audio) return;

    const engine = audioEngineRef.current;
    if (engine) {
      await engine.resume();
    }

    setActiveLoops((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(padId)) {
        audio.pause();
        audio.currentTime = 0;
        newSet.delete(padId);
      } else {
        audio.currentTime = 0;
        audio.play().catch((err) => {
          console.error(`Error playing loop ${padId}:`, err);
        });
        newSet.add(padId);
      }
      return newSet;
    });
  }, []);

  // Toggle mute for a pad in remix mode
  const toggleMute = useCallback((padId: string) => {
    setMutedPads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(padId)) {
        newSet.delete(padId);
      } else {
        newSet.add(padId);
      }
      return newSet;
    });
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    if (!isPlaying) {
      setIsPlaying(true);
    }
    setIsRecording(true);
    recordingStepCountRef.current = 0;
  }, [isPlaying]);

  // Play a single pad immediately (for manual pad tapping)
  const playPadNow = useCallback(async (pad: Pad) => {
    const engine = audioEngineRef.current;
    if (!engine) return;

    await engine.resume();

    const buffer = engine.bufferManager.getBuffer(pad.audioFile);
    if (buffer) {
      const baseRate = currentKit.playbackRate || 1.0;
      engine.playBuffer(buffer, {
        playbackRate: baseRate * speed,
      });
    }
  }, [currentKit, speed]);

  const toggleStep = useCallback((padId: string, stepIndex: number) => {
    if (mode === "remix") {
      toggleLoop(padId);
      return;
    }

    setSteps((prev) => {
      const newSteps = { ...prev };
      newSteps[padId] = [...newSteps[padId]];
      newSteps[padId][stepIndex] = !newSteps[padId][stepIndex];
      return newSteps;
    });
  }, [mode, toggleLoop]);

  const handleShare = useCallback(async () => {
    if (mode === "remix") return;

    const encoded = encodePattern(steps, pads);
    const url = new URL(window.location.href);
    url.searchParams.set("beat", encoded);

    try {
      await navigator.clipboard.writeText(url.toString());
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      router.push(`/beatmaker?beat=${encoded}`, { scroll: false });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [mode, steps, pads, router]);

  const handleClearAll = useCallback(() => {
    const cleared: Record<string, boolean[]> = {};
    pads.forEach((pad) => {
      cleared[pad.id] = new Array(STEPS).fill(false);
    });
    setSteps(cleared);
    setIsPlaying(false);
    setCurrentStep(0);
    setActiveLoops(new Set());
    Object.values(loopAudioRefs.current).forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    router.push("/beatmaker", { scroll: false });
  }, [pads, router]);

  const handlePlayToggle = useCallback(async () => {
    const engine = audioEngineRef.current;
    if (engine) {
      await engine.resume();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

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
        {!buffersLoaded && mode === "sequencer" && (
          <p className="text-safety-orange font-tag text-xs mt-2 animate-pulse">
            Loading samples...
          </p>
        )}
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

      {/* MPC Screen with Speed Slider */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex-1">
          <MPCScreen
            kitName={currentKit.name}
            bpm={bpm}
            audioContext={audioEngineRef.current?.audioContext}
            masterGainNode={audioEngineRef.current?.masterGain}
          />
        </div>
        {/* Speed Fader (Vertical Slider) */}
        <div className="flex flex-col items-center gap-2 pt-4">
          <label className="font-tag text-foreground text-xs md:text-sm font-bold">
            SPEED
          </label>
          <div className="relative h-48 md:h-64 w-12 flex items-center justify-center">
            <div
              className="absolute w-8 h-full bg-foreground/10 rounded-lg border-2 border-black"
              style={{
                background: `linear-gradient(to top, #ccff00 0%, #ccff00 ${((speed - 0.5) / 0.5) * 100}%, rgba(255, 255, 255, 0.1) ${((speed - 0.5) / 0.5) * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
              }}
            />
            <input
              type="range"
              min={0.5}
              max={1.0}
              step={0.01}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="absolute w-full h-full appearance-none bg-transparent cursor-pointer z-10"
              style={{
                writingMode: "vertical-lr",
                direction: "rtl",
                accentColor: "transparent",
              }}
            />
            {/* Fader Cap Style */}
            <div
              className="absolute pointer-events-none z-20"
              style={{
                left: "50%",
                top: `${100 - ((speed - 0.5) / 0.5) * 100}%`,
                transform: "translate(-50%, -50%)",
                width: "24px",
                height: "32px",
                backgroundColor: "#ccff00",
                border: "2px solid #000",
                borderRadius: "4px",
                boxShadow: "2px 2px 0px 0px rgba(0,0,0,1)",
              }}
            />
          </div>
          <span className="font-header text-toxic-lime text-xs font-bold">
            {(speed * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Sequencer Grid / Remix Pads */}
      <div
        className={`bg-concrete rounded-lg border-2 p-4 md:p-6 transition-all ${
          isRecording ? "border-red-500" : "border-black shadow-hard"
        }`}
        style={{
          animation: isRecording ? "recording-pulse 0.5s ease-in-out infinite" : "none",
          boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
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
                    {/* Pad Label - clickable for instant play */}
                    <motion.button
                      type="button"
                      onClick={() => playPadNow(pad)}
                      className="font-header text-sm md:text-base font-bold text-center px-2 py-2 rounded border-2 border-black bg-concrete cursor-pointer"
                      style={{ color: streetColor }}
                      whileHover={{ scale: 1.05, backgroundColor: streetColor, color: "#000" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {pad.name}
                    </motion.button>

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
          <div className="space-y-4">
            {/* MUTE Buttons Row (only for first 4 pads) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {pads.slice(0, 4).map((pad) => {
                const isMuted = mutedPads.has(pad.id);
                return (
                  <motion.button
                    key={`mute-${pad.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute(pad.id);
                    }}
                    className={`
                      px-3 py-2 rounded-lg
                      border-2 border-black
                      font-tag text-xs md:text-sm font-bold
                      transition-all
                    `}
                    style={{
                      backgroundColor: isMuted ? "#ef4444" : "#2a2a2a",
                      color: isMuted ? "#fff" : "#ef4444",
                      boxShadow: isMuted ? "4px 4px 0px 0px rgba(0,0,0,1)" : "none",
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isMuted ? "UNMUTE" : "MUTE"}
                  </motion.button>
                );
              })}
            </div>

            {/* Pad Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {pads.map((pad) => {
                const streetColor = getStreetColor(pad.color);
                const isActive = activeLoops.has(pad.id);
                const isMuted = mutedPads.has(pad.id);

                return (
                  <motion.button
                    key={pad.id}
                    type="button"
                    onClick={() => toggleLoop(pad.id)}
                    className={`
                      relative aspect-square rounded-lg
                      border-2 transition-all border-black
                      flex flex-col items-center justify-center gap-2
                      ${isActive ? "scale-95" : "scale-100"}
                      ${isMuted ? "opacity-50" : ""}
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
                    {isMuted && (
                      <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mt-8 pt-6 border-t-2 border-black">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {/* Play/Stop Button */}
            <motion.button
              onClick={handlePlayToggle}
              disabled={!buffersLoaded && mode === "sequencer"}
              className={`px-6 md:px-8 py-3 bg-toxic-lime/20 border-2 border-black text-toxic-lime font-tag rounded-lg flex items-center gap-2 shadow-hard ${
                !buffersLoaded && mode === "sequencer" ? "opacity-50 cursor-not-allowed" : ""
              }`}
              whileHover={buffersLoaded || mode !== "sequencer" ? { scale: 1.05 } : {}}
              whileTap={buffersLoaded || mode !== "sequencer" ? { scale: 0.95 } : {}}
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
                disabled={isRecording || !buffersLoaded}
                className={`px-6 md:px-8 py-3 border-2 border-black font-tag rounded-lg flex items-center gap-2 shadow-hard ${
                  isRecording
                    ? "bg-red-500 text-white"
                    : "bg-concrete text-red-500 hover:bg-red-500/10"
                } ${!buffersLoaded ? "opacity-50 cursor-not-allowed" : ""}`}
                whileHover={!isRecording && buffersLoaded ? { scale: 1.05 } : {}}
                whileTap={!isRecording && buffersLoaded ? { scale: 0.95 } : {}}
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

            {/* FILTER Knob */}
            <div className="flex flex-col items-center gap-2">
              <label className="font-tag text-foreground text-xs md:text-sm">
                FILTER
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={filter}
                  onChange={(e) => setFilter(Number(e.target.value))}
                  className="w-24 h-2 bg-foreground/10 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: "#00ffff",
                    background: `linear-gradient(to right, #00ffff 0%, #00ffff ${filter}%, rgba(255, 255, 255, 0.1) ${filter}%, rgba(255, 255, 255, 0.1) 100%)`,
                  }}
                />
                <span className="font-header text-cyan-500 text-sm font-bold min-w-[2.5rem] text-center">
                  {filter}%
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
              onClick={handleClearAll}
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
