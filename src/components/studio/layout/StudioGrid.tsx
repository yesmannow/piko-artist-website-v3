"use client";

/**
 * StudioGrid - Phase 5: Mobile Landscape Workstation + Portrait Pocket Tabs
 *
 * Professional DJ mixer layout based on CDJ/DJM setup:
 *
 * DESKTOP (≥768px / Pro Mode):
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Row 1: Dual Waveforms + Rhythm Stripe (beatmatching focus) │ Fixed 140px
 * ├─────────────────────────────────────────────────────────────┤
 * │ Row 2: Deck A | Mixer Center | Deck B (hardware layout)    │ Flex-1
 * ├─────────────────────────────────────────────────────────────┤
 * │ Row 3: Library (search + load + drag/drop)                 │ Fixed 280px or 48px collapsed
 * └─────────────────────────────────────────────────────────────┘
 *
 * MOBILE LANDSCAPE (<768px, landscape):
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Row 1: Compact Waveforms                                    │ Fixed 96px
 * ├─────────────────────────────────────────────────────────────┤
 * │ Row 2: Deck A | Mixer | Deck B (condensed)                 │ Flex-1
 * ├─────────────────────────────────────────────────────────────┤
 * │ Row 3: Library (latched, collapsed)                        │ Fixed 48px or 220px
 * └─────────────────────────────────────────────────────────────┘
 *
 * MOBILE PORTRAIT (<768px, portrait):
 * - Tab-based view switcher (DECKS | MIXER | LIBRARY)
 * - Single active view at a time (Pocket Studio)
 * - Swipe between decks in DECKS view
 *
 * KEY FEATURES:
 * - Zero vertical scrolling (locked viewport)
 * - Mixer always visible and centered
 * - Symmetrical deck layout (muscle memory)
 * - Library scrolls internally (not page)
 * - State preserved across rotation
 *
 * Design Philosophy: djay/VirtualDJ inspired
 * - Ergonomics over gimmicks
 * - View modes / progressive disclosure
 * - Modular architecture (skins/add-ons)
 */

import type * as Tone from "tone";
import { useState, useEffect } from "react";
import { DeckWaveformWS } from "@/components/studio/deck/DeckWaveformWS"; // Phase 6: WaveSurfer integration
import { PerformanceRow } from "./PerformanceRow";
import { LibraryRow } from "./LibraryRow";
import { useStudioStore } from "@/store/useStudioStore";
import { useMobileLandscape } from "@/hooks/useMobileLandscape";
import { MobileLandscapeWorkstation } from "./MobileLandscapeWorkstation";
import { MobilePortraitPocketStudio } from "./MobilePortraitPocketStudio";

interface StudioGridProps {
  readonly masterBus?: Tone.Gain | null;
  readonly masterPostFx?: Tone.Gain | null;
  readonly masterProgress: number;
}

type MobileTab = 'DECKS' | 'MIXER' | 'LIBRARY';

export function StudioGrid({ masterBus: _masterBus, masterPostFx: _masterPostFx, masterProgress }: Readonly<StudioGridProps>) {
  const libraryOpen = useStudioStore((state) => state.libraryOpen);
  const setLibraryOpen = useStudioStore((state) => state.setLibraryOpen);
  const settingsOpen = useStudioStore((state) => state.settingsOpen);
  const [mobileTab, setMobileTab] = useState<MobileTab>('DECKS');

  // Phase 5: Detect mobile landscape mode
  const { isMobileLandscape } = useMobileLandscape(300);

  // Clamp progress for UI display (0-1 range)
  const progressClamped = Math.max(0, Math.min(1, masterProgress ?? 0));

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[StudioGrid] progress percent", Math.round(progressClamped * 100));
    }
  }, [progressClamped]);

  // Desktop keyboard shortcuts for library drawer
  useEffect(() => {
    const isEditableTarget = () => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (el.isContentEditable) return true;
      return false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // desktop only
      if (globalThis.window === undefined) return;
      console.debug("[StudioGrid] window width", globalThis.window?.innerWidth);
      if ((globalThis.window?.innerWidth ?? 0) < 768) return;

      // don't steal input typing
      if (isEditableTarget()) return;

      // don't fight other overlays
      if (settingsOpen) return;

      // ignore modified shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // L toggles library
      if (e.code === "KeyL") {
        e.preventDefault();
        setLibraryOpen(!libraryOpen);
        return;
      }

      // Esc closes if open
      if (e.key === "Escape" && libraryOpen) {
        e.preventDefault();
        setLibraryOpen(false);
      }
    };

    if (globalThis.window === undefined) {
      return undefined;
    }

    console.debug("[StudioGrid] keydown listener attached");
    globalThis.window.addEventListener("keydown", onKeyDown);
    return () => globalThis.window?.removeEventListener("keydown", onKeyDown);
  }, [libraryOpen, setLibraryOpen, settingsOpen]);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          DESKTOP PRO: Fixed 3-Row Workstation (md+) - ZERO PAGE SCROLL
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="hidden md:grid fixed inset-0 h-dvh w-screen overflow-hidden bg-linear-to-b from-[#151530] to-[#050510]"
        style={{
          gridTemplateRows: '140px 1fr auto',  // Row1: Fixed | Row2: Flex | Row3: Auto (height set on wrapper)
        }}
      >
        {/* ─────────────────────────────────────────────────────────────────
            ROW 1: WAVEFORMS & RHYTHM STRIPE (Beatmatching Focus)
            Phase 6: Using WaveSurfer for visuals-only rendering
            ───────────────────────────────────────────────────────────────── */}
        <section
          className="flex gap-3 p-3 border-b border-white/5 min-h-0 overflow-hidden"
          aria-label="Deck Waveforms"
        >
          {/* Deck A Waveform */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="text-xs font-mono uppercase tracking-wider text-white/50 px-2">
              Deck A
            </div>
            <div className="flex-1 min-h-0">
              <DeckWaveformWS deckId="A" />
            </div>
          </div>

          {/* Deck B Waveform */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="text-xs font-mono uppercase tracking-wider text-white/50 px-2">
              Deck B
            </div>
            <div className="flex-1 min-h-0">
              <DeckWaveformWS deckId="B" />
            </div>
          </div>
        </section>

        {/* Global Transport / Progress Strip (Subtle, Non-Intrusive) */}
        <div className="hidden md:block px-3 py-2 border-b border-white/5 bg-black/20">
          <progress
            className="sr-only"
            value={Math.round(progressClamped * 100)}
            max={100}
            aria-label="Master progress"
          />
          <div
            className="relative h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/10"
            aria-hidden="true"
          >
            {/* Progress fill */}
            <div
              className="h-full bg-linear-to-r from-purple-500 to-cyan-400 transition-[width] duration-100 ease-linear"
              style={{ width: `${progressClamped * 100}%` }}
            />
            {/* Playhead marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.6)]"
              style={{ left: `${progressClamped * 100}%` }}
            />
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            ROW 2: PERFORMANCE CONTROLS (Deck A | Mixer Center | Deck B)
            ───────────────────────────────────────────────────────────────── */}
        <div className="min-h-0 overflow-hidden">
          <PerformanceRow />
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            ROW 3: LIBRARY & BROWSER (Collapsible with Smooth Transition)
            ───────────────────────────────────────────────────────────────── */}
        <div
          className={`min-h-0 overflow-hidden transition-[height] duration-200 ease-out ${
            libraryOpen ? 'h-70' : 'h-12'
          }`}
        >
          <LibraryRow />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE: Adaptive Layout - Landscape Workstation or Portrait Tabs
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden">
        {isMobileLandscape ? (
          <MobileLandscapeWorkstation />
        ) : (
          <MobilePortraitPocketStudio
            initialTab={mobileTab}
            onTabChange={setMobileTab}
          />
        )}
      </div>
    </>
  );
}

