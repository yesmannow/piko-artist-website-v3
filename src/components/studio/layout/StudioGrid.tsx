"use client";

/**
 * StudioGrid - 2026 Iron-Clad Single-Viewport Workstation
 *
 * Professional DJ mixer layout based on CDJ/DJM setup:
 * - Desktop (md+): Fixed 3-row layout with zero scroll
 *   - Row 1 (Top): Deck Waveforms & Track Info
 *   - Row 2 (Middle): Performance Controls & Mixer (flex-1 expansion)
 *   - Row 3 (Bottom): Track Library & Browser
 *
 * - Mobile (<md): Tab-based view switcher
 *   - DECKS | MIXER | LIBRARY navigation tabs
 *   - Single active view at a time
 *
 * Design System: Expert Desaturated Palette with 8-point grid spacing
 * Constraint: ZERO vertical scrolling on desktop (1080p+)
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
      {/* DESKTOP: Fixed 3-Row Workstation (md+) - ZERO SCROLL */}
      <div
        className="hidden md:flex fixed inset-0 h-screen w-screen overflow-hidden flex-col bg-(--bg-primary)"
      >
        {/* Row 1: Deck Waveforms (Fixed Height) */}
        <section
          className="relative flex gap-4 p-4 border-b border-white/5 h-35 min-h-35"
          aria-label="Deck Waveforms"
        >
          {/* Deck A Waveform */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="text-xs font-mono uppercase tracking-wider text-(--text-secondary) px-2">
              Deck A
            </div>
            <DeckWaveform deckId="A" />
          </div>

          {/* Deck B Waveform */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="text-xs font-mono uppercase tracking-wider text-(--text-secondary) px-2">
              Deck B
            </div>
            <DeckWaveform deckId="B" />
          </div>
        </section>

        {/* Global Transport / Progress Strip (Desktop Pro Workstation) */}
        <div className="hidden md:block px-4 py-2 border-b border-white/5 bg-(--bg-secondary)">
          <div
            className="relative h-2 rounded bg-white/10 overflow-hidden border border-white/10"
            role="progressbar"
            aria-label="Master progress"
            aria-valuenow={Math.round(progressClamped * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {/* Progress fill */}
            <div
              className="h-full bg-(--color-accent) transition-[width] duration-100 ease-linear"
              style={{ width: `${progressClamped * 100}%` }}
            />
            {/* Playhead marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-[0_0_4px_rgba(255,255,255,0.5)]"
              style={{ left: `${progressClamped * 100}%` }}
            />
          </div>
        </div>

        {/* Row 2: Performance & Mixer (Flex-1 - Expands to fill) */}
        <div className="flex-1 overflow-hidden">
          <PerformanceRow masterBus={masterBus} masterPostFx={masterPostFx} />
        </div>

        {/* Row 3: Library & Browser (Fixed or Collapsed) */}
        <div className={libraryOpen ? "h-75 min-h-75" : "h-12 min-h-12"}>
          <LibraryRow />
        </div>
      </div>

      {/* MOBILE: Tab-Based View Switcher (<md) */}
      <div className="flex md:hidden flex-col h-screen overflow-hidden bg-(--bg-primary)">
        {/* Active View Content */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === 'DECKS' && (
            <div className="h-full overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-(--text-secondary)">
                  Deck A
                </div>
                <DeckWaveform deckId="A" />
                <DeckControls deckId="A" />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-(--text-secondary)">
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
        <nav className="h-16 min-h-16 border-t border-white/10 flex justify-around items-center bg-(--bg-secondary)">
          <button
            onClick={() => setMobileTab('DECKS')}
            className={`flex-1 h-full flex items-center justify-center text-xs font-mono uppercase tracking-wider transition-colors ${
              mobileTab === 'DECKS'
                ? 'text-(--accent-color) bg-white/5'
                : 'text-(--text-secondary) hover:text-(--text-primary)'
            }`}
          >
            Decks
          </button>
          <button
            onClick={() => setMobileTab('MIXER')}
            className={`flex-1 h-full flex items-center justify-center text-xs font-mono uppercase tracking-wider transition-colors ${
              mobileTab === 'MIXER'
                ? 'text-(--accent-color) bg-white/5'
                : 'text-(--text-secondary) hover:text-(--text-primary)'
            }`}
          >
            Mixer
          </button>
          <button
            onClick={() => setMobileTab('LIBRARY')}
            className={`flex-1 h-full flex items-center justify-center text-xs font-mono uppercase tracking-wider transition-colors ${
              mobileTab === 'LIBRARY'
                ? 'text-(--accent-color) bg-white/5'
                : 'text-(--text-secondary) hover:text-(--text-primary)'
            }`}
          >
            Library
          </button>
        </nav>
      </div>
    </>
  );
}
