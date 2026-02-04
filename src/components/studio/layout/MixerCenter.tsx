"use client";

/**
 * MixerCenter - Central Mixer Column
 *
 * Contains:
 * - Per-Deck EQ Controls
 * - Channel Faders with Level Meters
 * - Crossfader
 * - Master Level Meter
 *
 * Professional DJ mixer layout with hardware-style visual hierarchy
 * Phase 3: FX moved to deck-level controls (DeckFXRack)
 */

import { Crossfader } from "@/components/studio/ui/Crossfader";
import { LevelMeter } from "@/components/studio/ui/LevelMeter";
import { DeckEQ } from "@/components/studio/deck/DeckEQ";
import { ChannelFader } from "@/components/studio/ui/ChannelFader";

export function MixerCenter() {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-(--text-secondary)">
          Mixer
        </h2>
      </div>

      {/* EQ Section */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2 p-2 bg-(--bg-tertiary) rounded border border-white/5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-(--text-secondary)">
            EQ A
          </span>
          <DeckEQ deckId="A" />
        </div>
        <div className="flex flex-col gap-2 p-2 bg-(--bg-tertiary) rounded border border-white/5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-(--text-secondary)">
            EQ B
          </span>
          <DeckEQ deckId="B" />
        </div>
      </div>

      {/* Channel Faders with Level Meters */}
      <div className="flex-1 grid grid-cols-2 gap-4">
        {/* Channel A */}
        <div className="flex gap-2 items-stretch">
          <ChannelFader deckId="A" />
          <LevelMeter deckId="A" accentColor="#009688" />
        </div>

        {/* Channel B */}
        <div className="flex gap-2 items-stretch">
          <ChannelFader deckId="B" />
          <LevelMeter deckId="B" accentColor="#009688" />
        </div>
      </div>

      {/* Crossfader */}
      <div className="p-2 bg-(--bg-tertiary) rounded border border-white/5">
        <Crossfader />
      </div>

      {/* Master Meter */}
      <div className="flex items-center gap-2 p-2 bg-(--bg-tertiary) rounded border border-white/5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-(--text-secondary)">
          Master
        </span>
        <div className="flex-1">
          <LevelMeter deckId="master" orientation="horizontal" accentColor="#009688" />
        </div>
      </div>
    </div>
  );
}
