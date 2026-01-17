"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Gamepad2,
  Users,
  Monitor,
  Sparkles,
  Settings,
  Radio,
} from "lucide-react";

// Components
import { LatencyMonitor } from "@/components/studio/LatencyMonitor";
import { MIDIControlPanel } from "@/components/studio/MIDIControlPanel";
import { CollaborationPanel } from "@/components/studio/CollaborationPanel";
import { MultiWindowControlPanel } from "@/hooks/useMultiWindow";
import {
  AudioReactiveParticles,
  AudioReactivePlane,
} from "@/components/studio/AudioReactiveShaderVisualizer";
import { useMIDIStore } from "@/store/useMIDIStore";

/**
 * Phase4AdvancedFeaturesDemo
 *
 * Integration example showing all Phase 4 features:
 * - Latency Benchmarking
 * - MIDI Control Panel
 * - Collaboration
 * - Multi-Window Support
 * - 3D Audio Visualizer
 *
 * This component can be integrated into the desktop studio layout
 */

interface Phase4AdvancedFeaturesDemoProps {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
}

export function Phase4AdvancedFeaturesDemo({
  audioContext,
  analyser,
}: Phase4AdvancedFeaturesDemoProps) {
  const [showMIDI, setShowMIDI] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [visualizerStyle, setVisualizerStyle] = useState<"particles" | "plane">(
    "particles",
  );
  const [showSettings, setShowSettings] = useState(false);

  // MIDI store for global learn mode toggle
  const { learnMode, startLearn, stopLearn } = useMIDIStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white">
      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-screen">
        {/* Left Panel - Controls & Monitoring */}
        <div className="space-y-4 overflow-y-auto">
          {/* Global MIDI Learn Mode Toggle */}
          <div className="bg-black/40 backdrop-blur-sm border-2 border-cyan-500/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Radio
                  className={`w-5 h-5 ${learnMode ? "text-cyan-400 animate-pulse" : "text-white/60"}`}
                />
                <div>
                  <div className="font-bold text-sm uppercase tracking-wider">
                    MIDI Learn Mode
                  </div>
                  <div className="text-xs text-white/60">
                    {learnMode
                      ? "Active - Click controls to map"
                      : "Click to enable MIDI learning"}
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  learnMode ? stopLearn() : startLearn("deckA_play")
                } // Dummy action to start learn mode
                className={`px-4 py-2 rounded border-2 transition-all font-bold text-sm uppercase tracking-wider ${
                  learnMode
                    ? "bg-cyan-500 text-black border-cyan-500 shadow-lg shadow-cyan-500/50"
                    : "bg-black border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500"
                }`}
              >
                {learnMode ? "Stop Learn" : "Start Learn"}
              </button>
            </div>
          </div>

          {/* Latency Monitor */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Performance Monitor
            </h2>
            <LatencyMonitor audioContext={audioContext} compact={false} />
          </div>

          {/* Multi-Window Controls */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-2 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Multi-Window
            </h2>
            <div className="bg-black/40 backdrop-blur-sm border-2 border-white/10 p-4">
              <MultiWindowControlPanel />
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Advanced Features
            </h2>

            <div className="space-y-2">
              {/* MIDI Control */}
              <button
                onClick={() => setShowMIDI(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-black/40 border-2 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all"
              >
                <Gamepad2 className="w-5 h-5 text-cyan-400" />
                <div className="text-left flex-1">
                  <div className="font-bold text-sm">MIDI Control</div>
                  <div className="text-xs text-white/60">
                    Map hardware controllers
                  </div>
                </div>
              </button>

              {/* Collaboration */}
              <button
                onClick={() => setShowCollaboration(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-black/40 border-2 border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all"
              >
                <Users className="w-5 h-5 text-purple-400" />
                <div className="text-left flex-1">
                  <div className="font-bold text-sm">Collaboration</div>
                  <div className="text-xs text-white/60">
                    Real-time shared sessions
                  </div>
                </div>
              </button>

              {/* Visualizer Style */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-black/40 border-2 border-white/10 hover:border-green-500/50 hover:bg-green-500/10 transition-all"
              >
                <Sparkles className="w-5 h-5 text-green-400" />
                <div className="text-left flex-1">
                  <div className="font-bold text-sm">Visualizer Style</div>
                  <div className="text-xs text-white/60">
                    Current:{" "}
                    {visualizerStyle === "particles"
                      ? "Particles"
                      : "Wave Plane"}
                  </div>
                </div>
              </button>

              {/* Visualizer Style Picker */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-black/60 border border-white/10 space-y-2">
                      <button
                        onClick={() => setVisualizerStyle("particles")}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          visualizerStyle === "particles"
                            ? "bg-green-500 text-black font-bold"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        Particle System
                      </button>

                      <button
                        onClick={() => setVisualizerStyle("plane")}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          visualizerStyle === "plane"
                            ? "bg-green-500 text-black font-bold"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        Wave Plane
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Center/Right - 3D Visualizer */}
        <div className="lg:col-span-2 bg-black border-2 border-cyan-500/30 relative overflow-hidden">
          {/* Visualizer Label */}
          <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-sm border border-cyan-500/30 px-4 py-2">
            <div className="text-cyan-400 font-bold text-sm uppercase tracking-wider">
              3D Audio Visualizer
            </div>
            <div className="text-white/60 text-xs">
              GPU-Accelerated • Real-time Audio Reactive
            </div>
          </div>

          {/* Canvas */}
          <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />

            {/* Render selected visualizer */}
            {visualizerStyle === "particles" ? (
              <AudioReactiveParticles analyser={analyser} count={10000} />
            ) : (
              <AudioReactivePlane analyser={analyser} segments={128} />
            )}
          </Canvas>

          {/* Compact Latency Monitor Overlay */}
          <div className="absolute bottom-4 right-4 z-10">
            <LatencyMonitor audioContext={audioContext} compact={true} />
          </div>
        </div>
      </div>

      {/* Modal Panels */}
      <AnimatePresence>
        {showMIDI && <MIDIControlPanel onClose={() => setShowMIDI(false)} />}

        {showCollaboration && (
          <CollaborationPanel onClose={() => setShowCollaboration(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
