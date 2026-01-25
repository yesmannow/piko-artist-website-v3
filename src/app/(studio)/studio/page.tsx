"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StudioHeader } from "@/features/studio/components/StudioHeader";
import { TimelineView } from "@/features/studio/components/TimelineView";
import { MixerRack } from "@/features/studio/components/MixerRack";
import { MixerStudio } from "@/features/studio-mixer/components/MixerStudio";
import { MixerGraph } from "@/features/studio-mixer/lib/MixerGraph";
import { TrackLibraryMobile } from "@/features/studio-mixer/components/TrackLibrary";
import { FxRack } from "@/features/studio-mixer/components/FxRack";
import { StudioEngine } from "@/features/studio/lib/StudioEngine";
import { TimelineEngine } from "@/features/studio/lib/TimelineEngine";
import { useStudioStore } from "@/features/studio/stores/useStudioStore";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StudioNavMenu } from "@/components/studio/StudioNavMenu";

type StudioMode = "mixer" | "timeline" | "library" | "fx";

export default function StudioPage() {
  const router = useRouter();
  const params = useSearchParams();
  // In Next.js 15, useSearchParams() returns ReadonlyURLSearchParams directly
  // Access it synchronously (the warnings are dev-mode only)
  const modeParam = params.get("mode");
  const paramsString = params.toString();
  const prevModeRef = useRef<StudioMode | null>(null);

  const mode = useMemo(() => {
    const raw = (modeParam ?? "mixer").toLowerCase();
    if (raw === "timeline") return "timeline";
    if (raw === "library") return "library";
    if (raw === "fx") return "fx";
    return "mixer";
  }, [modeParam]);

  const setMode = useCallback(
    (next: StudioMode) => {
      const sp = new URLSearchParams(paramsString);
      sp.set("mode", next);
      router.replace(`/studio?${sp.toString()}`);
    },
    [paramsString, router]
  );

  // Ensure `mode` exists in URL for shareable deep links.
  useEffect(() => {
    if (!modeParam) {
      setMode("mixer");
    }
  }, [modeParam, setMode]);

  // Safety: when switching away from Timeline mode, stop TimelineEngine + StudioEngine
  // so we never have two mixes running simultaneously.
  // Note: library and fx tabs don't stop audio - they're part of the mixer experience
  useEffect(() => {
    const prev = prevModeRef.current;
    if (!prev) {
      prevModeRef.current = mode;
      return;
    }

    if (prev === "timeline" && (mode === "mixer" || mode === "library" || mode === "fx")) {
      // Stop arrangement playback
      const timelineEngine = TimelineEngine.getInstance();
      if (timelineEngine.getIsPlaying()) timelineEngine.pause();
      useStudioStore.getState().setTimelinePlaying(false);

      // Stop deck-oriented playback (StudioEngine)
      const studioEngine = StudioEngine.getInstance();
      const deckIds = useStudioStore.getState().deckTrackIds;
      (["A", "B"] as const).forEach((d) => {
        const id = deckIds[d];
        if (id) studioEngine.pauseTrack(id);
      });
      const active = studioEngine.getActiveTrackId();
      if (active) studioEngine.pauseTrack(active);
      useStudioStore.getState().setPlaying(false);
    }

    prevModeRef.current = mode;
  }, [mode]);

  const isMixerMode = mode === "mixer" || mode === "library" || mode === "fx";

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#050505] text-[#E0E0E0] flex flex-col">
      {/* Navigation Menu */}
      <StudioNavMenu />

      {/* Top mode toggle (desktop/tablet) */}
      <div className="hidden sm:flex items-center justify-center gap-2 px-2 py-2 border-b border-white/10 bg-black/30 flex-shrink-0">
        <button
          type="button"
          onClick={() => setMode("mixer")}
          className={[
            "px-3 py-2 border text-[11px] font-black uppercase tracking-[0.25em]",
            "min-h-[44px] min-w-[44px]",
            mode === "mixer"
              ? "border-[#FFD700] text-[#FFD700] bg-black/60"
              : "border-white/10 text-white/60 bg-black/30 hover:bg-black/40",
          ].join(" ")}
          aria-pressed={mode === "mixer"}
        >
          Mixer
        </button>
        <button
          type="button"
          onClick={() => setMode("library")}
          className={[
            "px-3 py-2 border text-[11px] font-black uppercase tracking-[0.25em]",
            "min-h-[44px] min-w-[44px]",
            mode === "library"
              ? "border-[#FFD700] text-[#FFD700] bg-black/60"
              : "border-white/10 text-white/60 bg-black/30 hover:bg-black/40",
          ].join(" ")}
          aria-pressed={mode === "library"}
        >
          Library
        </button>
        <button
          type="button"
          onClick={() => setMode("fx")}
          className={[
            "px-3 py-2 border text-[11px] font-black uppercase tracking-[0.25em]",
            "min-h-[44px] min-w-[44px]",
            mode === "fx"
              ? "border-[#FFD700] text-[#FFD700] bg-black/60"
              : "border-white/10 text-white/60 bg-black/30 hover:bg-black/40",
          ].join(" ")}
          aria-pressed={mode === "fx"}
        >
          FX
        </button>
        <button
          type="button"
          onClick={() => setMode("timeline")}
          className={[
            "px-3 py-2 border text-[11px] font-black uppercase tracking-[0.25em]",
            "min-h-[44px] min-w-[44px]",
            mode === "timeline"
              ? "border-[#FFD700] text-[#FFD700] bg-black/60"
              : "border-white/10 text-white/60 bg-black/30 hover:bg-black/40",
          ].join(" ")}
          aria-pressed={mode === "timeline"}
        >
          Timeline
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 w-full overflow-hidden">
        {mode === "timeline" ? (
          <ErrorBoundary>
            <div className="h-full w-full p-2 flex flex-col gap-2 overflow-hidden">
              <StudioHeader />
              <TimelineView />
              <MixerRack />
            </div>
          </ErrorBoundary>
        ) : isMixerMode ? (
          <ErrorBoundary>
            <MixerGraph>
              {mode === "mixer" && <MixerStudio />}
              {mode === "library" && (
                <div
                  className="h-full w-full overflow-y-auto"
                  style={{
                    background: "#121212",
                    backgroundImage: `repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        rgba(0, 0, 0, 0.03) 2px,
                        rgba(0, 0, 0, 0.03) 4px
                      )`,
                  }}
                >
                  <div className="p-4 md:p-6 lg:p-8">
                    <div className="max-w-4xl mx-auto">
                      <h1 className="text-2xl font-barlow uppercase tracking-wider text-gray-300 mb-6">
                        Track Library
                      </h1>
                      <TrackLibraryMobile />
                    </div>
                  </div>
                </div>
              )}
              {mode === "fx" && (
                <div
                  className="h-full w-full overflow-y-auto"
                  style={{
                    background: "#121212",
                    backgroundImage: `repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        rgba(0, 0, 0, 0.03) 2px,
                        rgba(0, 0, 0, 0.03) 4px
                      )`,
                  }}
                >
                  <div className="p-4 md:p-6 lg:p-8">
                    <div className="max-w-6xl mx-auto">
                      <h1 className="text-2xl font-barlow uppercase tracking-wider text-gray-300 mb-6">
                        FX Rack
                      </h1>
                      <FxRack />
                    </div>
                  </div>
                </div>
              )}
            </MixerGraph>
          </ErrorBoundary>
        ) : null}
      </div>

      {/* Mobile bottom mode bar (app-like) */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#FFD700]/20 bg-gradient-to-t from-black via-[#050505] to-[#050505] pb-[env(safe-area-inset-bottom)]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg%20width%3D%27100%27%20height%3D%27100%27%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%3E%3Cfilter%20id%3D%27noise%27%3E%3CfeTurbulence%20type%3D%27fractalNoise%27%20baseFrequency%3D%270.9%27%20numOctaves%3D%273%27/%3E%3C/filter%3E%3Crect%20width%3D%27100%25%27%20height%3D%27100%25%27%20filter%3D%27url(%23noise)%27%20opacity%3D%270.04%27/%3E%3C/svg%3E\")",
        }}
      >
        <div className="flex items-center justify-around px-1 py-2 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setMode("mixer")}
            className={[
              "flex-shrink-0 min-h-[44px] px-2 py-3 border-2",
              "font-mono text-[10px] font-bold uppercase tracking-[0.25em]",
              mode === "mixer"
                ? "border-[#FFD700] text-[#FFD700] bg-black/50"
                : "border-white/10 text-white/50 bg-black/30",
            ].join(" ")}
            aria-pressed={mode === "mixer"}
          >
            Mixer
          </button>
          <button
            type="button"
            onClick={() => setMode("library")}
            className={[
              "flex-shrink-0 min-h-[44px] px-2 py-3 border-2",
              "font-mono text-[10px] font-bold uppercase tracking-[0.25em]",
              mode === "library"
                ? "border-[#FFD700] text-[#FFD700] bg-black/50"
                : "border-white/10 text-white/50 bg-black/30",
            ].join(" ")}
            aria-pressed={mode === "library"}
          >
            Library
          </button>
          <button
            type="button"
            onClick={() => setMode("fx")}
            className={[
              "flex-shrink-0 min-h-[44px] px-2 py-3 border-2",
              "font-mono text-[10px] font-bold uppercase tracking-[0.25em]",
              mode === "fx"
                ? "border-[#FFD700] text-[#FFD700] bg-black/50"
                : "border-white/10 text-white/50 bg-black/30",
            ].join(" ")}
            aria-pressed={mode === "fx"}
          >
            FX
          </button>
          <button
            type="button"
            onClick={() => setMode("timeline")}
            className={[
              "flex-shrink-0 min-h-[44px] px-2 py-3 border-2",
              "font-mono text-[10px] font-bold uppercase tracking-[0.25em]",
              mode === "timeline"
                ? "border-[#FFD700] text-[#FFD700] bg-black/50"
                : "border-white/10 text-white/50 bg-black/30",
            ].join(" ")}
            aria-pressed={mode === "timeline"}
          >
            Timeline
          </button>
        </div>
      </div>
    </div>
  );
}
