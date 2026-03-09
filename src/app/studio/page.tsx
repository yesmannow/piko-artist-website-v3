'use client';

import { Deck } from '@/components/studio/Deck';
import { Mixer } from '@/components/studio/Mixer';
import { Library } from '@/components/studio/Library';

export default function StudioPage() {
  return (
    <div className="w-full flex-1 flex flex-col p-4 gap-4 min-h-screen bg-slate-950 text-slate-200">
      {/* 3-Column Studio Grid Layout */}
      <div className="grid grid-cols-12 gap-4 flex-none lg:h-[420px]">
        {/* Deck A (5 cols) */}
        <Deck deckId="A" />
        
        {/* Central Mixer (2 cols) */}
        <Mixer />
        
        {/* Deck B (5 cols) */}
        <Deck deckId="B" />
      </div>
      
      {/* Bottom Track Library */}
      <Library />
    </div>
  );
}
