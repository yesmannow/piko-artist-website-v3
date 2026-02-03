"use client";

/**
 * MixerCenter - Central Mixer Column
 *
 * Contains:
 * - Per-Deck EQ Controls
 * - Channel Faders with Level Meters
 * - Crossfader
 * - Master Level Meter
 * - Per-Deck FX Sends
 *
 * Professional DJ mixer layout with hardware-style visual hierarchy
 */

import type * as Tone from "tone";
import { FXRack } from "@/components/studio/core/FXRack";
import { Crossfader } from "@/components/studio/ui/Crossfader";
import { LevelMeter } from "@/components/studio/ui/LevelMeter";
import { DeckEQ } from "@/components/studio/ui/DeckEQ";
import { ChannelFader } from "@/components/studio/ui/ChannelFader";

interface MixerCenterProps {
  masterBus?: Tone.Gain | null;
  masterPostFx?: Tone.Gain | null;
}

export function MixerCenter({ masterBus, masterPostFx }: MixerCenterProps) {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-white/60">
          Mixer
        </h2>
      </div>

      {/* EQ Section */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2 p-2 bg-(--bg-tertiary) rounded border border-white/5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
            EQ A
          </span>
          <DeckEQ deckId="A" />
        </div>
        <div className="flex flex-col gap-2 p-2 bg-(--bg-tertiary) rounded border border-white/5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
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
          <LevelMeter deckId="A" />
        </div>

        {/* Channel B */}
        <div className="flex gap-2 items-stretch">
          <ChannelFader deckId="B" />
          <LevelMeter deckId="B" />
        </div>
      </div>

      {/* Crossfader */}
      <div className="p-2 bg-(--bg-tertiary) rounded border border-white/5">
        <Crossfader />
      </div>

      {/* Master Meter */}
      <div className="flex items-center gap-2 p-2 bg-(--bg-tertiary) rounded border border-white/5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
          Master
        </span>
        <div className="flex-1">
          <LevelMeter deckId="master" orientation="horizontal" />
        </div>
      </div>

      {/* FX Rack (Global for now, will be per-deck later) */}
      <div className="mt-auto">
        <FXRack masterBus={masterBus} masterPostFx={masterPostFx} />
      </div>
    </div>
  );
}
