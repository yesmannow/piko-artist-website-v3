"use client";

/**
 * LoopControls - Loop Region Management (Phase S9)
 *
 * Controls for setting, adjusting, and toggling loop regions.
 *
 * Interaction:
 * - Set In/Out: Mark loop boundaries at current playback position
 * - Toggle Loop: Enable/disable active loop
 * - Clear Loop: Remove loop region
 * - Draggable loop region on waveform via Regions plugin
 *
 * Visual States:
 * - No loop: "Set In" and "Set Out" buttons enabled
 * - Loop set: In/Out time display, toggle and clear buttons
 * - Loop enabled: Highlighted indicator, audio engine loops
 *
 * Integration:
 * - Loop region rendered on waveform via Regions plugin
 * - Tone.js Transport manages actual audio looping
 * - Store manages loop state persistence
 */

import { useCallback, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { useAudioEngine } from "@/hooks/useAudioEngine";

interface LoopControlsProps {
  readonly deckId: "A" | "B";
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

export function LoopControls({ deckId }: Readonly<LoopControlsProps>) {
  const { getPlaybackPosition, setLoopPoints, clearLoopPoints, enableLoop } = useAudioEngine();

  // Store selectors
  const activeLoop = useStore((state) =>
    deckId === "A" ? state.deckA.activeLoop : state.deckB.activeLoop
  );
  const setActiveLoop = useStore((state) => state.setActiveLoop);
  const toggleLoop = useStore((state) => state.toggleLoop);

  // Sync loop state with audio engine
  useEffect(() => {
    if (!activeLoop) {
      clearLoopPoints(deckId);
      return;
    }

    // Set loop points in audio engine
    setLoopPoints(deckId, activeLoop.startSec, activeLoop.endSec);
    enableLoop(deckId, activeLoop.enabled);
  }, [activeLoop, deckId, setLoopPoints, clearLoopPoints, enableLoop]);

  // Set loop in point at current position
  const handleSetIn = useCallback(() => {
    const currentTime = getPlaybackPosition(deckId);
    const outTime = activeLoop?.endSec ?? currentTime + 4; // Default 4-beat loop

    setActiveLoop(deckId, {
      startSec: currentTime,
      endSec: Math.max(outTime, currentTime + 0.5), // Minimum 0.5s loop
      enabled: false, // Don't enable until explicitly toggled
    });
  }, [deckId, activeLoop, getPlaybackPosition, setActiveLoop]);

  // Set loop out point at current position
  const handleSetOut = useCallback(() => {
    const currentTime = getPlaybackPosition(deckId);
    const inTime = activeLoop?.startSec ?? currentTime - 4; // Default 4-beat loop

    setActiveLoop(deckId, {
      startSec: Math.min(inTime, currentTime - 0.5), // Minimum 0.5s loop
      endSec: currentTime,
      enabled: false,
    });
  }, [deckId, activeLoop, getPlaybackPosition, setActiveLoop]);

  // Toggle loop on/off
  const handleToggle = useCallback(() => {
    toggleLoop(deckId);
  }, [deckId, toggleLoop]);

  // Clear loop region
  const handleClear = useCallback(() => {
    setActiveLoop(deckId, null);
  }, [deckId, setActiveLoop]);

  const deckColor = deckId === "A" ? "#4af2c5" : "#7c8dff";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/5 bg-black/20 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono uppercase tracking-wider text-white/60">
          Loop Region
        </span>
        <span className="text-xs font-mono text-white/40">
          Deck {deckId}
        </span>
      </div>

      {!activeLoop ? (
        // No loop set: Show In/Out buttons
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSetIn}
            className="h-10 rounded-md border border-white/20 bg-white/5 text-xs font-mono font-bold uppercase text-white/70 hover:bg-white/10 transition-colors"
          >
            Set In
          </button>
          <button
            onClick={handleSetOut}
            className="h-10 rounded-md border border-white/20 bg-white/5 text-xs font-mono font-bold uppercase text-white/70 hover:bg-white/10 transition-colors"
          >
            Set Out
          </button>
        </div>
      ) : (
        // Loop set: Show times and controls
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="rounded bg-black/40 p-2">
              <div className="text-white/40 text-[10px] mb-0.5">In</div>
              <div className="text-white/90">{formatTime(activeLoop.startSec)}</div>
            </div>
            <div className="rounded bg-black/40 p-2">
              <div className="text-white/40 text-[10px] mb-0.5">Out</div>
              <div className="text-white/90">{formatTime(activeLoop.endSec)}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleSetIn}
              className="h-8 rounded border border-white/10 bg-white/5 text-[10px] font-mono font-bold uppercase text-white/60 hover:bg-white/10 transition-colors"
            >
              In
            </button>
            <button
              onClick={handleSetOut}
              className="h-8 rounded border border-white/10 bg-white/5 text-[10px] font-mono font-bold uppercase text-white/60 hover:bg-white/10 transition-colors"
            >
              Out
            </button>
            <button
              onClick={handleClear}
              className="h-8 rounded border border-red-500/20 bg-red-500/10 text-[10px] font-mono font-bold uppercase text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Clear
            </button>
          </div>

          <button
            onClick={handleToggle}
            className={`
              w-full h-10 rounded-md font-mono text-sm font-bold uppercase
              transition-all duration-150
              ${
                activeLoop.enabled
                  ? "border-2 shadow-lg scale-105"
                  : "border border-white/20 bg-white/5"
              }
            `}
            style={{
              borderColor: activeLoop.enabled ? deckColor : undefined,
              backgroundColor: activeLoop.enabled ? `${deckColor}22` : undefined,
              color: activeLoop.enabled ? deckColor : "#ffffff99",
            }}
          >
            {activeLoop.enabled ? "Loop On" : "Loop Off"}
          </button>
        </div>
      )}

      <div className="mt-1 text-[10px] font-mono text-white/30">
        Drag loop region on waveform to adjust
      </div>
    </div>
  );
}
