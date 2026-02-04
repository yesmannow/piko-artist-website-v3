"use client";

/**
 * Phase 5: Mobile Landscape Workstation
 *
 * Condensed 3-row mixer-first layout for mobile landscape orientation
 * - Compact waveforms (96px)
 * - Deck A | Mixer | Deck B
 * - Collapsible library (48px/220px)
 *
 * Phase S6: Migrated to DeckWaveformWS for consistency with desktop
 */

import { DeckWaveformWS } from "@/components/studio/ui/DeckWaveformWS";
import { Deck } from "@/components/studio/ui/Deck";
import { LibraryRow } from "./LibraryRow";
import { MixerCenter } from "./MixerCenter";
import { useStudioStore } from "@/store/useStudioStore";

export function MobileLandscapeWorkstation() {
  const libraryOpen = useStudioStore((state) => state.libraryOpen);

  return (
    <div
      className="fixed inset-0 h-dvh w-screen overflow-hidden bg-linear-to-b from-[#151530] to-[#050510] grid"
      style={{
        gridTemplateRows: '96px 1fr auto',
      }}
    >
      {/* Row 1: Compact Waveforms */}
      <section
        className="flex gap-2 p-2 border-b border-white/5 min-h-0 overflow-hidden"
        aria-label="Deck Waveforms"
      >
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-white/50 px-1">
            Deck A
          </div>
          <div className="flex-1 min-h-0">
            <DeckWaveformWS deckId="A" />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-white/50 px-1">
            Deck B
          </div>
          <div className="flex-1 min-h-0">
            <DeckWaveformWS deckId="B" />
          </div>
        </div>
      </section>

      {/* Row 2: Deck A | Mixer | Deck B */}
      <div className="min-h-0 overflow-hidden grid grid-cols-[1fr_auto_1fr] gap-2 p-2">
        <div className="min-w-0 overflow-y-auto">
          <Deck deckId="A" showMiniWaveform={false} complexityMode="simple" />
        </div>
        <div className="w-48 min-w-0 overflow-y-auto">
          <MixerCenter />
        </div>
        <div className="min-w-0 overflow-y-auto">
          <Deck deckId="B" showMiniWaveform={false} complexityMode="simple" />
        </div>
      </div>

      {/* Row 3: Library (Collapsed/Expanded) */}
      <div
        className={`min-h-0 overflow-hidden transition-[height] duration-200 ease-out ${
          libraryOpen ? 'h-55' : 'h-12'
        }`}
      >
        <LibraryRow />
      </div>
    </div>
  );
}
