"use client";

/**
 * DeckWaveformWS - WaveSurfer-based Waveform Display (Phase S9: Cues + Loops)
 *
 * VISUALS ONLY: Uses WaveSurfer.js for waveform rendering and interaction.
 * Audio playback remains 100% controlled by Tone.js engine.
 *
 * Features:
 * - Robust waveform rendering from WaveSurfer
 * - Click-to-seek interaction (forwards to engine)
 * - Cursor position sync based on engine playback time
 * - No audio duplication (WaveSurfer audio disabled)
 * - Phase S9: Hot cue markers + loop regions via Regions plugin
 *
 * Phase 6.1 Hardening:
 * - RAF loop stops when tab hidden (visibilitychange)
 * - RAF loop stops when no URL loaded
 * - Throttled cursor updates (30fps vs 60fps for better performance)
 * - Proper cleanup on track switch
 *
 * Phase S9 Regions:
 * - Hot cues rendered as point markers (8 slots per deck)
 * - Loop region rendered as draggable selection
 * - Click cue marker → seek to cue time
 * - Regions plugin memoized to prevent mutation issues
 */

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useStore } from "@/store/useStore";

interface DeckWaveformWSProps {
  readonly deckId: "A" | "B";
}

export function DeckWaveformWS({ deckId }: Readonly<DeckWaveformWSProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { getPlaybackPosition, getDeckDuration, seekTo } = useAudioEngine();

  // Get track data and S9 state from store
  const trackData = useStore((state) =>
    deckId === "A" ? state.deckA.trackData : state.deckB.trackData
  );
  const hotCues = useStore((state) =>
    deckId === "A" ? state.deckA.hotCues : state.deckB.hotCues
  );
  const activeLoop = useStore((state) =>
    deckId === "A" ? state.deckA.activeLoop : state.deckB.activeLoop
  );

  const url = trackData?.url;
  const title = trackData?.title;
  const rafRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);

  // Phase S9: Memoize Regions plugin to prevent mutation issues
  // CRITICAL: useMemo prevents WaveSurfer from mutating plugin instances
  const regionsPlugin = useMemo(() => RegionsPlugin.create(), []);

  // Memoize WaveSurfer options to prevent unnecessary re-creation
  const wavesurferOptions = useMemo(() => ({
    container: containerRef,
    url: url,
    waveColor: deckId === "A" ? "#4af2c566" : "#7c8dff66",
    progressColor: deckId === "A" ? "#4af2c5" : "#7c8dff",
    cursorColor: deckId === "A" ? "#4af2c5" : "#7c8dff",
    cursorWidth: 2,
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    height: 80,
    normalize: true,
    backend: "WebAudio" as const,
    // CRITICAL: Disable WaveSurfer audio playback
    interact: true,
    hideScrollbar: true,
    autoCenter: false,
    fillParent: true,
    plugins: [regionsPlugin], // Phase S9: Add Regions plugin
  }), [url, deckId, regionsPlugin]);

  // WaveSurfer setup with audio disabled (visuals only)
  const { wavesurfer, isReady } = useWavesurfer(wavesurferOptions);

  // Phase 6.1: Track document visibility to stop RAF when tab hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;

      // Cancel RAF loop when tab hidden to save CPU
      if (document.hidden && rafRef.current !== null) {
        globalThis.window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Click-to-seek: Forward to Tone engine
  useEffect(() => {
    if (!wavesurfer) return;

    const handleSeek = (progress: number) => {
      const duration = getDeckDuration(deckId);
      if (duration > 0) {
        const seekTime = progress * duration;
        seekTo(deckId, seekTime);
      }
    };

    wavesurfer.on("interaction", handleSeek);
    return () => {
      wavesurfer.un("interaction", handleSeek);
    };
  }, [wavesurfer, deckId, getDeckDuration, seekTo]);

  // Phase S9: Sync regions with store state (hot cues + loop)
  useEffect(() => {
    if (!wavesurfer || !isReady || !regionsPlugin) return;

    // Clear all existing regions
    regionsPlugin.clearRegions();

    const duration = getDeckDuration(deckId);
    if (duration <= 0) return;

    // Render hot cues as point markers
    hotCues.forEach((cue) => {
      const color = cue.color ?? (deckId === "A" ? "#4af2c5" : "#7c8dff");
      regionsPlugin.addRegion({
        id: `cue-${cue.id}`,
        start: cue.timeSec,
        end: cue.timeSec + 0.001, // Tiny width for point marker
        color: color,
        drag: false,
        resize: false,
        content: cue.label ?? `${cue.id + 1}`,
      });
    });

    // Render active loop as draggable region
    if (activeLoop) {
      const deckColor = deckId === "A" ? "#4af2c544" : "#7c8dff44";
      const loopColor = activeLoop.enabled ? deckColor : "#ffffff22";
      regionsPlugin.addRegion({
        id: "loop",
        start: activeLoop.startSec,
        end: activeLoop.endSec,
        color: loopColor,
        drag: true,
        resize: true,
      });
    }
  }, [wavesurfer, isReady, regionsPlugin, hotCues, activeLoop, deckId, getDeckDuration]);

  // Phase S9: Handle region click (jump to cue)
  useEffect(() => {
    if (!regionsPlugin) return;

    const handleRegionClick = (region: { id: string; start: number }) => {
      // Only jump on hot cue clicks, not loop clicks
      if (region.id.startsWith("cue-")) {
        seekTo(deckId, region.start);
      }
    };

    regionsPlugin.on("region-clicked", handleRegionClick);
    return () => {
      regionsPlugin.un("region-clicked", handleRegionClick);
    };
  }, [regionsPlugin, deckId, seekTo]);

  // Sync WaveSurfer cursor to engine playback position (Phase 6.1: Throttled to 30fps)
  const syncCursorPosition = useCallback(() => {
    if (!wavesurfer || !isReady || !url) return;

    // Throttle to 30fps (~33ms) instead of 60fps to reduce overhead
    const now = performance.now();
    if (now - lastUpdateTimeRef.current < 33) return;
    lastUpdateTimeRef.current = now;

    const currentTime = getPlaybackPosition(deckId);
    const duration = getDeckDuration(deckId);

    if (duration > 0) {
      const progress = currentTime / duration;
      // Update cursor position without triggering audio playback
      wavesurfer.seekTo(progress);
    }
  }, [wavesurfer, isReady, url, deckId, getPlaybackPosition, getDeckDuration]);

  // RAF loop for cursor sync (Phase 6.1: Stops when tab hidden or no URL)
  useEffect(() => {
    // Don't start RAF loop if no URL loaded
    if (!url) return;

    const tick = () => {
      // Only sync if tab visible
      if (isVisibleRef.current) {
        syncCursorPosition();
      }

      // Continue RAF loop only if URL still loaded and component mounted
      if (url) {
        rafRef.current = globalThis.window.requestAnimationFrame(tick);
      }
    };

    // Start RAF loop
    rafRef.current = globalThis.window.requestAnimationFrame(tick);

    return () => {
      // Stop RAF loop on cleanup
      if (rafRef.current !== null) {
        globalThis.window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [syncCursorPosition, url]);

  // Phase 6.1: Cleanup WaveSurfer instance on unmount or track change
  useEffect(() => {
    return () => {
      if (wavesurfer) {
        // Ensure RAF loop is stopped before destroying
        if (rafRef.current !== null) {
          globalThis.window.cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }

        // Destroy WaveSurfer instance to free memory
        wavesurfer.destroy();
      }
    };
  }, [wavesurfer, url]); // Re-run when URL changes to cleanup old instance

  if (!url) {
    return (
      <div className="flex-1 rounded-lg border border-white/5 bg-(--bg-secondary) p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-white/60">
            {title ?? `Deck ${deckId}`}
          </span>
          <span className="text-xs font-mono text-white/40">No track loaded</span>
        </div>
        <div className="h-20 rounded bg-white/5 flex items-center justify-center">
          <span className="text-xs font-mono uppercase tracking-widest text-white/30">
            Load Track
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 rounded-lg border border-white/5 bg-(--bg-secondary) p-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-white/60">
          {title ?? `Deck ${deckId}`}
        </span>
        <span className="text-xs font-mono text-white/40">
          {isReady ? "WaveSurfer" : "Loading..."}
        </span>
      </div>
      <div
        ref={containerRef}
        className="rounded bg-black/40 overflow-hidden cursor-pointer"
        style={{ minHeight: "80px" }}
      />
    </div>
  );
}
