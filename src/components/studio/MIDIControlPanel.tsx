"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Gamepad2, Radio, Trash2, X, CheckCircle2, Circle } from "lucide-react";
import { useMIDIStore, type MIDIAction } from "@/store/useMIDIStore";
import { getMIDIManager } from "@/engine/MIDIManager";

interface MIDIControlPanelProps {
  onClose?: () => void;
}

/**
 * MIDIControlPanel - MIDI mapping and learning UI
 *
 * Phase 4: Advanced Features - Web MIDI Integration
 *
 * Features:
 * - MIDI device connection status
 * - Visual MIDI Learn mode
 * - Mapping management (view, edit, delete)
 * - Activity indicator
 * - Preset mappings
 */
export function MIDIControlPanel({ onClose }: MIDIControlPanelProps) {
  const {
    isConnected,
    deviceName,
    lastActivity,
    mappings,
    learnMode,
    learnTarget,
    startLearn,
    stopLearn,
    removeMapping,
    clearMappings,
  } = useMIDIStore();

  const [activityPulse, setActivityPulse] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize MIDI on mount
  useEffect(() => {
    const initMIDI = async () => {
      try {
        const midiManager = getMIDIManager();
        const success = await midiManager.initialize();
        setIsInitialized(success);
      } catch (error) {
        console.error("Failed to initialize MIDI:", error);
      }
    };

    initMIDI();
  }, []);

  // Activity pulse animation
  useEffect(() => {
    if (lastActivity > 0) {
      setActivityPulse(true);
      const timeout = setTimeout(() => setActivityPulse(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [lastActivity]);

  // Available actions for MIDI mapping
  const availableActions: Array<{
    action: MIDIAction;
    label: string;
    group: string;
  }> = [
    { action: "deckA_play", label: "Deck A: Play", group: "Deck A" },
    { action: "deckA_pause", label: "Deck A: Pause", group: "Deck A" },
    { action: "deckA_cue", label: "Deck A: Cue", group: "Deck A" },
    { action: "deckA_volume", label: "Deck A: Volume", group: "Deck A" },
    { action: "deckB_play", label: "Deck B: Play", group: "Deck B" },
    { action: "deckB_pause", label: "Deck B: Pause", group: "Deck B" },
    { action: "deckB_cue", label: "Deck B: Cue", group: "Deck B" },
    { action: "deckB_volume", label: "Deck B: Volume", group: "Deck B" },
    { action: "crossfader", label: "Crossfader", group: "Mixer" },
    { action: "masterVolume", label: "Master Volume", group: "Mixer" },
  ];

  // Group actions by category
  const groupedActions = availableActions.reduce(
    (acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
    },
    {} as Record<string, typeof availableActions>,
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-2xl bg-zinc-900 border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/20 font-mono overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-zinc-950 border-b border-cyan-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">
              MIDI Control
            </h2>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          )}
        </div>

        {/* Connection Status */}
        <div className="p-4 bg-zinc-950/50 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-3 h-3 rounded-full transition-colors ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                {activityPulse && (
                  <motion.div
                    className="absolute inset-0 w-3 h-3 rounded-full bg-cyan-400"
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>

              <div className="text-sm">
                <div className="text-white font-bold">
                  {isConnected ? "Connected" : "Disconnected"}
                </div>
                {deviceName && (
                  <div className="text-white/60 text-xs">{deviceName}</div>
                )}
              </div>
            </div>

            {!isInitialized && (
              <div className="text-yellow-500 text-xs">
                WebMIDI not supported or permission denied
              </div>
            )}
          </div>
        </div>

        {/* Learn Mode Banner */}
        <AnimatePresence>
          {learnMode && learnTarget && (
            <motion.div
              className="bg-cyan-500 text-black p-4 flex items-center justify-between"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 animate-pulse" />
                <div className="font-bold">
                  Learning Mode Active
                  <div className="text-xs font-normal opacity-80">
                    Move a control on your MIDI device to map:{" "}
                    {
                      availableActions.find((a) => a.action === learnTarget)
                        ?.label
                    }
                  </div>
                </div>
              </div>

              <button
                onClick={stopLearn}
                className="px-3 py-1 bg-black text-white rounded hover:bg-black/80 transition-colors text-sm font-bold"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-6">
          {/* Current Mappings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold uppercase tracking-wider text-sm">
                Current Mappings ({Object.keys(mappings).length})
              </h3>

              {Object.keys(mappings).length > 0 && (
                <button
                  onClick={clearMappings}
                  className="px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-2">
              {Object.keys(mappings).length === 0 ? (
                <div className="text-white/40 text-sm text-center py-8">
                  No mappings yet. Click "Learn" to map a control.
                </div>
              ) : (
                Object.entries(mappings).map(([midiKey, mapping]) => (
                  <motion.div
                    key={midiKey}
                    className="flex items-center justify-between p-3 bg-black/40 border border-white/10 hover:border-cyan-500/30 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex-1">
                      <div className="text-white font-bold text-sm">
                        {
                          availableActions.find(
                            (a) => a.action === mapping.action,
                          )?.label
                        }
                      </div>
                      <div className="text-white/40 text-xs font-mono">
                        {mapping.label} ({midiKey})
                      </div>
                    </div>

                    <button
                      onClick={() => removeMapping(midiKey)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      aria-label="Remove mapping"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Available Actions */}
          <div>
            <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-3">
              Map Controls
            </h3>

            <div className="space-y-4">
              {Object.entries(groupedActions).map(([group, actions]) => (
                <div key={group}>
                  <div className="text-cyan-400 text-xs font-bold mb-2 uppercase">
                    {group}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {actions.map(({ action, label }) => {
                      const isMapped = Object.values(mappings).some(
                        (m) => m.action === action,
                      );

                      return (
                        <button
                          key={action}
                          onClick={() => startLearn(action)}
                          disabled={learnMode && learnTarget !== action}
                          className={`
                            p-2 text-left text-sm border transition-all
                            ${
                              learnMode && learnTarget === action
                                ? "bg-cyan-500 text-black border-cyan-400 animate-pulse"
                                : isMapped
                                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                                  : "bg-black/40 border-white/10 text-white/80 hover:border-cyan-500/30 hover:bg-cyan-500/10"
                            }
                            ${learnMode && learnTarget !== action ? "opacity-50 cursor-not-allowed" : ""}
                          `}
                        >
                          <div className="flex items-center gap-2">
                            {isMapped ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Circle className="w-3 h-3" />
                            )}
                            <span className="text-xs">{label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950/50 border-t border-white/10 text-xs text-white/40">
          <p>
            💡 Tip: Click "Learn" next to a control, then move a
            knob/fader/button on your MIDI controller to map it.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
