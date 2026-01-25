"use client";

import { useEffect } from "react";
import { ProlinkProvider, useProlinkContext } from "@/features/hardware-bridge/context/ProlinkContext";

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinel>;
  };
};

/**
 * Monitor Content - Inner component that uses the context
 */
function MonitorContent() {
  const { latestStatus, isConnected } = useProlinkContext();

  // Request wake lock to prevent screen dimming
  useEffect(() => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }

    const wakeLockNavigator = navigator as WakeLockNavigator;
    let wakeLockSentinel: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        const lock = await wakeLockNavigator.wakeLock?.request("screen");
        if (lock) {
          wakeLockSentinel = lock;
        }
      } catch (error) {
        console.warn("[Monitor] Failed to request wake lock:", error);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, []);

  const bpm = latestStatus?.currentBpm || 0;
  const isPlaying = latestStatus?.playState === "playing";

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute top-4 left-4 text-red-500 font-mono text-sm">
          ⚠ Bridge Disconnected
        </div>
      )}

      {/* Main BPM Display */}
      <div className="text-center">
        <div className="text-6xl md:text-9xl font-black text-[#FFD700] mb-4">
          {bpm > 0 ? Math.round(bpm) : "---"}
        </div>
        <div className="text-2xl md:text-4xl font-mono text-white uppercase tracking-wider">
          BPM
        </div>
      </div>

      {/* On Air Indicator */}
      {isPlaying && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-500 font-mono text-sm uppercase">ON AIR</span>
        </div>
      )}

      {/* Track Info */}
      {latestStatus && (
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <div className="text-lg md:text-2xl font-mono text-white/60">
            Track ID: {latestStatus.trackId}
          </div>
          <div className="text-sm md:text-lg font-mono text-white/40 mt-2">
            Pitch: {((latestStatus.sliderPitch - 0.5) * 100).toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Monitor Page - Second Screen HUD for DJ Booth
 *
 * Read-only display showing:
 * - Current Master BPM (huge, centered)
 * - Current Key (Camelot notation)
 * - 'On Air' indicator (red dot if playing)
 *
 * Uses Wake Lock API to prevent screen dimming.
 */
export default function MonitorPage() {
  return (
    <ProlinkProvider>
      <MonitorContent />
    </ProlinkProvider>
  );
}
