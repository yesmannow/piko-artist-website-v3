"use client";

/**
 * StudioGrid - Phase 2: Desktop Pro "Mixer-First" Workstation
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
 * KEY FEATURES:
 * - Zero vertical scrolling (locked viewport)
 * - Mixer always visible and centered
 * - Symmetrical deck layout (muscle memory)
 * - Library scrolls internally (not page)
 *
 * MOBILE (<768px / Pocket Studio):
 * - Tab-based view switcher (DECKS | MIXER | LIBRARY)
 * - Single active view at a time
 * - Existing behavior preserved
 *
 * Design Philosophy: djay/VirtualDJ inspired
 * - Ergonomics over gimmicks
 * - View modes / progressive disclosure
 * - Modular architecture (skins/add-ons)
 */

import type * as Tone from "tone";
import { useState } from "react";
import { DeckWaveform } from "@/components/studio/ui/DeckWaveform";
import { DeckControls } from "@/components/studio/ui/DeckControls";
import { TrackLibrary } from "@/components/studio/ui/TrackLibrary";
import { PerformanceRow } from "./PerformanceRow";
import { LibraryRow } from "./LibraryRow";
import { MixerCenter } from "./MixerCenter";
import { useStudioStore } from "@/store/useStudioStore";

interface StudioGridProps {
  readonly masterBus?: Tone.Gain | null;
  readonly masterPostFx?: Tone.Gain | null;
  readonly masterProgress: number;
}

type MobileTab = 'DECKS' | 'MIXER' | 'LIBRARY';

export function StudioGrid({ masterBus, masterPostFx, masterProgress }: Readonly<StudioGridProps>) {
  const libraryOpen = useStudioStore((state) => state.libraryOpen);
  const [mobileTab, setMobileTab] = useState<MobileTab>('DECKS');

  // Clamp progress for UI display (0-1 range)
  const progressClamped = Math.max(0, Math.min(1, masterProgress ?? 0));

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          DESKTOP PRO: Fixed 3-Row Workstation (md+) - ZERO PAGE SCROLL
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="hidden md:grid fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-gradient-to-b from-[#151530] to-[#050510]"
        style={{
          gridTemplateRows: '140px 1fr auto',  // Row1: Fixed | Row2: Flex | Row3: Auto (height set on wrapper)
        }}
      >
        {/* ─────────────────────────────────────────────────────────────────
            ROW 1: WAVEFORMS & RHYTHM STRIPE (Beatmatching Focus)
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
              <DeckWaveform deckId="A" />
            </div>
          </div>

          {/* Deck B Waveform */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="text-xs font-mono uppercase tracking-wider text-white/50 px-2">
              Deck B
            </div>
            <div className="flex-1 min-h-0">
              <DeckWaveform deckId="B" />
            </div>
          </div>
        </section>

        {/* Global Transport / Progress Strip (Subtle, Non-Intrusive) */}
        <div className="hidden md:block px-3 py-2 border-b border-white/5 bg-black/20">
          <div
            className="relative h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/10"
            role="progressbar"
            aria-label="Master progress"
            aria-valuenow={Math.round(progressClamped * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {/* Progress fill */}
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-[width] duration-100 ease-linear"
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
          <PerformanceRow masterBus={masterBus} masterPostFx={masterPostFx} />
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            ROW 3: LIBRARY & BROWSER (Collapsible with Smooth Transition)
            ───────────────────────────────────────────────────────────────── */}
        <div
          className={`min-h-0 overflow-hidden transition-[height] duration-200 ease-out ${
            libraryOpen ? 'h-[280px]' : 'h-[48px]'
          }`}
        >
          <LibraryRow />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE: Tab-Based View Switcher (<md) - POCKET STUDIO MODE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex md:hidden flex-col h-screen overflow-hidden bg-gradient-to-b from-[#151530] to-[#050510]">
        {/* Active View Content */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === 'DECKS' && (
            <div className="h-full overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-white/50">
                  Deck A
                </div>
                <DeckWaveform deckId="A" />
                <DeckControls deckId="A" />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-white/50">
                  Deck B
                </div>
                <DeckWaveform deckId="B" />
                <DeckControls deckId="B" />
              </div>
            </div>
          )}

          {mobileTab === 'MIXER' && (
            <div className="h-full overflow-y-auto p-4">
              <MixerCenter masterBus={masterBus} masterPostFx={masterPostFx} />
            </div>
          )}

          {mobileTab === 'LIBRARY' && (
            <div className="h-full overflow-hidden">
              <TrackLibrary
                isOpen={true}
                onClose={() => setMobileTab('DECKS')}
              />
            </div>
          )}
        </div>

        {/* Bottom Navigation Tabs */}
        <nav className="h-16 min-h-16 border-t border-white/10 flex justify-around items-center bg-black/40 backdrop-blur-sm">
          <button
            onClick={() => setMobileTab('DECKS')}
            className={`flex-1 h-full flex items-center justify-center text-xs font-mono uppercase tracking-wider transition-colors ${
              mobileTab === 'DECKS'
                ? 'text-purple-400 bg-white/5 border-t-2 border-purple-400'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            Decks
          </button>
          <button
            onClick={() => setMobileTab('MIXER')}
            className={`flex-1 h-full flex items-center justify-center text-xs font-mono uppercase tracking-wider transition-colors ${
              mobileTab === 'MIXER'
                ? 'text-purple-400 bg-white/5 border-t-2 border-purple-400'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            Mixer
          </button>
          <button
            onClick={() => setMobileTab('LIBRARY')}
            className={`flex-1 h-full flex items-center justify-center text-xs font-mono uppercase tracking-wider transition-colors ${
              mobileTab === 'LIBRARY'
                ? 'text-purple-400 bg-white/5 border-t-2 border-purple-400'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            Library
          </button>
        </nav>
      </div>
    </>
  );
}

