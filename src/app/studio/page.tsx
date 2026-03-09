'use client';

import { useState } from 'react';
import { Drawer } from 'vaul';
import { Deck } from '@/components/studio/Deck';
import { Mixer } from '@/components/studio/Mixer';
import { LibraryDrawer } from '@/components/studio/LibraryDrawer';
import { ParallelWaveforms } from '@/components/studio/ParallelWaveforms';
import { SlidersHorizontal } from 'lucide-react';

/**
 * Studio Page — Liquid Obsidian 12-column Bento Grid
 *
 * Slot map (desktop lg+):
 *   Row 1 [auto]  — col-span-12 : ParallelWaveforms sticky header
 *   Row 2 [420px] — col-span-5  : Deck A
 *                   col-span-2  : Mixer spine
 *                   col-span-5  : Deck B
 *   Row 3 [auto]  — col-span-12 : LibraryDrawer (inline on desktop, vaul on mobile)
 *
 * Mobile (<lg):
 *   Row 1 — col-span-12 : ParallelWaveforms
 *   Row 2 — col-span-12 : Deck A   (stacked)
 *   Row 3 — col-span-12 : Deck B   (stacked)
 *   Row 4 — col-span-12 : Mixer trigger button → vaul drawer
 *   Row 5 — col-span-12 : LibraryDrawer trigger pill → vaul drawer
 */
export default function StudioPage() {
  const [mixerOpen, setMixerOpen] = useState(false);

  return (
    <main className="w-full flex-1 grid grid-cols-12 gap-3 p-3 min-h-screen bg-[#0a0a0c] text-slate-200">

      {/* ── Row 1: Waveform header ────────────────────────────────────── */}
      <div className="col-span-12">
        <ParallelWaveforms />
      </div>

      {/* ── Row 2 desktop: Deck A | Mixer | Deck B ───────────────────── */}
      {/* Mixer is hidden on mobile; the drawer trigger below replaces it */}
      <Deck deckId="A" />
      <div className="hidden lg:contents">
        <Mixer />
      </div>
      <Deck deckId="B" />

      {/* ── Mobile Mixer drawer trigger ───────────────────────────────── */}
      <div className="col-span-12 lg:hidden">
        <Drawer.Root open={mixerOpen} onOpenChange={setMixerOpen}>
          <Drawer.Trigger asChild>
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800/60 bg-[#0a0a0c]/80 backdrop-blur-[24px] text-slate-400 hover:text-slate-200 transition-colors active:scale-[0.97] touch-none select-none"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Mixer</span>
            </button>
          </Drawer.Trigger>

          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
            <Drawer.Content
              className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl border-t border-slate-800/60 bg-[#0c0c10] outline-none"
              style={{ maxHeight: '85dvh' }}
            >
              <div className="mx-auto mt-3 mb-1 h-1.5 w-10 rounded-full bg-slate-700/60 flex-shrink-0" />
              <Drawer.Title className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Mixer
              </Drawer.Title>
              <div className="overflow-y-auto flex-1 pb-safe">
                {/* Mixer column renders full-width inside the drawer */}
                <div className="grid grid-cols-12">
                  <Mixer />
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>

      {/* ── Row 3: Track Library (inline desktop / drawer mobile) ────── */}
      <LibraryDrawer />

    </main>
  );
}

