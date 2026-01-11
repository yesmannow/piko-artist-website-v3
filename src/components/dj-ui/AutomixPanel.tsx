"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Square, Settings, Shuffle, Zap } from "lucide-react";
import { getAutomixEngine, type AutomixSettings } from "@/engine/AutomixEngine";
import { type TrackMetadata } from "@/utils/automix";

interface AutomixPanelProps {
  currentTrack: TrackMetadata | null;
  availableTracks: TrackMetadata[];
  onTrackSelect?: (track: TrackMetadata) => void;
}

export function AutomixPanel({ currentTrack, availableTracks, onTrackSelect }: AutomixPanelProps) {
  const automixEngine = getAutomixEngine();
  const [isActive, setIsActive] = useState(false);
  const [settings, setSettings] = useState<AutomixSettings>({
    transitionDuration: 8,
    vibeMatching: true,
    autoStartNext: true,
    crossfadeCurve: 'constant-power'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [nextTrack, setNextTrack] = useState<TrackMetadata | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);

  useEffect(() => {
    const updateState = () => {
      const state = automixEngine.getState();
      setIsActive(state.isActive);
      setNextTrack(state.nextTrack);
      setTransitionProgress(state.transitionProgress);
    };

    // Update immediately and set up interval for real-time updates
    updateState();
    const interval = setInterval(updateState, 100); // 10 FPS updates

    return () => clearInterval(interval);
  }, []);

  const handleStartAutomix = async () => {
    if (!currentTrack) return;

    const success = await automixEngine.startAutomix('deckA', currentTrack, settings);
    if (success) {
      setIsActive(true);
    }
  };

  const handleStopAutomix = () => {
    automixEngine.stopAutomix();
    setIsActive(false);
  };

  const handleSettingsChange = (newSettings: Partial<AutomixSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    automixEngine.updateSettings(updatedSettings);
  };

  const handleTriggerTransition = async () => {
    await automixEngine.triggerTransition();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/80 backdrop-blur-md rounded-lg border border-toxic-lime/20 p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-toxic-lime" />
          <h3 className="text-lg font-bold text-toxic-lime uppercase tracking-wider">
            AI Automix
          </h3>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-400 hover:text-toxic-lime transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Status */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-toxic-lime animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-sm text-gray-300">
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {currentTrack && (
          <div className="text-xs text-gray-400 mb-2">
            Current: <span className="text-toxic-lime">{currentTrack.title}</span>
          </div>
        )}

        {nextTrack && (
          <div className="text-xs text-gray-400">
            Next: <span className="text-cyan-400">{nextTrack.title}</span>
          </div>
        )}
      </div>

      {/* Transition Progress */}
      {isActive && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Transition</span>
            <span>{Math.round(transitionProgress * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-toxic-lime to-cyan-400 h-2 rounded-full"
              style={{ width: `${transitionProgress * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 mb-4">
        {!isActive ? (
          <button
            onClick={handleStartAutomix}
            disabled={!currentTrack}
            className="flex-1 bg-toxic-lime hover:bg-toxic-lime/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4" />
            Start Automix
          </button>
        ) : (
          <>
            <button
              onClick={handleTriggerTransition}
              disabled={!nextTrack}
              className="flex-1 bg-cyan-500 hover:bg-cyan-500/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              Next Track
            </button>
            <button
              onClick={handleStopAutomix}
              className="border border-red-500 text-red-400 hover:bg-red-500/10 py-2 px-4 rounded flex items-center justify-center transition-colors"
            >
              <Square className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-700 pt-4 space-y-4"
        >
          {/* Transition Duration */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Transition Duration: {settings.transitionDuration}s
            </label>
            <input
              type="range"
              min="2"
              max="16"
              step="1"
              value={settings.transitionDuration}
              onChange={(e) => handleSettingsChange({ transitionDuration: Number(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Crossfade Curve */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Crossfade Curve
            </label>
            <select
              value={settings.crossfadeCurve}
              onChange={(e) => handleSettingsChange({ crossfadeCurve: e.target.value as 'linear' | 'constant-power' })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="constant-power">Constant Power</option>
              <option value="linear">Linear</option>
            </select>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Vibe Matching</label>
              <input
                type="checkbox"
                checked={settings.vibeMatching}
                onChange={(e) => handleSettingsChange({ vibeMatching: e.target.checked })}
                className="w-4 h-4 text-toxic-lime bg-gray-800 border-gray-600 rounded focus:ring-toxic-lime"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Auto Start Next</label>
              <input
                type="checkbox"
                checked={settings.autoStartNext}
                onChange={(e) => handleSettingsChange({ autoStartNext: e.target.checked })}
                className="w-4 h-4 text-toxic-lime bg-gray-800 border-gray-600 rounded focus:ring-toxic-lime"
              />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
