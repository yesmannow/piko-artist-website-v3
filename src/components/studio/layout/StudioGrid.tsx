"use client";

/**
 * StudioGrid - Industry-Standard 3-Row DJ Layout
 *
 * Professional DJ mixer layout based on CDJ/DJM setup:
 * - Row 1 (Top 40%): Deck Waveforms & Track Info
 * - Row 2 (Middle 35%): Performance Controls & Mixer
 * - Row 3 (Bottom 25%): Track Library & Browser
 *
 * Design System: Pro DJ Dark Mode with 8-point grid spacing
 */

import type * as Tone from "tone";
import { DeckWaveform } from "@/components/studio/ui/DeckWaveform";
import { PerformanceRow } from "./PerformanceRow";
import { LibraryRow } from "./LibraryRow";
import { useStudioStore } from "@/store/useStudioStore";

interface StudioGridProps {
  readonly masterBus?: Tone.Gain | null;
  readonly masterPostFx?: Tone.Gain | null;
  readonly masterProgress: number;
}

export function StudioGrid({ masterBus, masterPostFx, masterProgress }: Readonly<StudioGridProps>) {
  const libraryOpen = useStudioStore((state) => state.libraryOpen);

  return (
    <div
      className="h-screen grid bg-(--bg-primary) overflow-hidden"
      style={{
        gridTemplateRows: libraryOpen
          ? 'minmax(0, 3fr) minmax(0, 3fr) minmax(0, 4fr)' // Library expanded
          : 'minmax(0, 4fr) minmax(0, 3.5fr) minmax(0, 2.5fr)', // Default DJ layout
      }}
    >
      {/* Row 1: Deck Waveforms (Top 40%) */}
      <section
        className="relative flex gap-4 p-4 border-b border-white/5"
        aria-label="Deck Waveforms"
      >
        {/* Deck A Waveform */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="text-xs font-mono uppercase tracking-wider text-white/60 px-2">
            Deck A
          </div>
          <DeckWaveform deckId="A" />
        </div>

        {/* Deck B Waveform */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="text-xs font-mono uppercase tracking-wider text-white/60 px-2">
            Deck B
          </div>
          <DeckWaveform deckId="B" />
        </div>
      </section>

      {/* Row 2: Performance & Mixer (Middle 35%) */}
      <PerformanceRow masterBus={masterBus} masterPostFx={masterPostFx} />

      {/* Row 3: Library & Browser (Bottom 25%) */}
      <LibraryRow />
    </div>
  );
}
