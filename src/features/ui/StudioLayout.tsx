"use client";

import { ReactNode } from 'react';
import { MixerDrawer } from '../ui-glass/MixerDrawer';

/**
 * StudioLayout - Adaptive layout for desktop and mobile
 *
 * Desktop (lg+): 3-column grid - Deck A | Mixer | Deck B
 * Mobile (default): Vertical stack - Deck A → Deck B, Mixer in bottom drawer
 */
export interface StudioLayoutProps {
  deckA: ReactNode;
  deckB: ReactNode;
  mixer: ReactNode;
}

export function StudioLayout({ deckA, deckB, mixer }: StudioLayoutProps) {
  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Desktop Layout: 3-column grid */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-4 lg:p-4">
        {/* Deck A - Left */}
        <div className="lg:col-span-4">
          {deckA}
        </div>

        {/* Mixer - Center (permanent on desktop) */}
        <div className="lg:col-span-4">
          {mixer}
        </div>

        {/* Deck B - Right */}
        <div className="lg:col-span-4">
          {deckB}
        </div>
      </div>

      {/* Mobile Layout: Vertical stack */}
      <div className="lg:hidden flex flex-col gap-2 p-2">
        {/* Deck A */}
        <div className="flex-shrink-0">
          {deckA}
        </div>

        {/* Deck B */}
        <div className="flex-shrink-0">
          {deckB}
        </div>

        {/* Mixer Drawer (Mobile) */}
        <MixerDrawer>
          {mixer}
        </MixerDrawer>
      </div>
    </div>
  );
}
