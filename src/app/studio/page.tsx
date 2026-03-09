'use client';

import { Deck } from '@/components/studio/Deck';
import { Mixer } from '@/components/studio/Mixer';
import { Library } from '@/components/studio/Library';
import { ParallelWaveforms } from '@/components/studio/ParallelWaveforms';

/**
 * Studio Page — Liquid Obsidian 12-column Bento Grid
 *
 * Slot map (desktop, lg+):
 *   Row 1 [auto]    — col-span-12 : ParallelWaveforms sticky header
 *   Row 2 [420px]   — col-span-5  : Deck A
 *                   — col-span-2  : Mixer spine
 *                   — col-span-5  : Deck B
 *   Row 3 [auto]    — col-span-12 : Track Library
 *
 * Each Deck/Mixer component manages its own col-span via its root className.
 */
export default function StudioPage() {
  return (
    <main className="w-full flex-1 grid grid-cols-12 gap-3 p-3 min-h-screen bg-[#0a0a0c] text-slate-200">
      {/* ── Bento slot: Waveform header ─────────────────────────────────── */}
      <div className="col-span-12">
        <ParallelWaveforms />
      </div>

      {/* ── Bento slots: Deck A | Mixer | Deck B ────────────────────────── */}
      {/* Each component carries its own col-span-12 lg:col-span-N class    */}
      <Deck deckId="A" />
      <Mixer />
      <Deck deckId="B" />

      {/* ── Bento slot: Track Library ────────────────────────────────────── */}
      <div className="col-span-12">
        <Library />
      </div>
    </main>
  );
}

