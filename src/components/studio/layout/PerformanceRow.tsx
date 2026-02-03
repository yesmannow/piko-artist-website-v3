"use client";

/**
 * PerformanceRow - Middle Performance Controls & Mixer
 *
 * 3-Column Layout:
 * - Left: Deck A Controls (Jog Wheel, Transport, StemRack)
 * - Center: Mixer (EQ, Faders, Level Meters, FX)
 * - Right: Deck B Controls (Jog Wheel, Transport, StemRack)
 *
 * Professional DJ layout with tactile hardware-emulated controls
 */

import type * as Tone from "tone";
import { DeckControls } from "@/components/studio/ui/DeckControls";
import { MixerCenter } from "./MixerCenter";

interface PerformanceRowProps {
  masterBus?: Tone.Gain | null;
  masterPostFx?: Tone.Gain | null;
}

export function PerformanceRow({ masterBus, masterPostFx }: PerformanceRowProps) {
  return (
    <section
      className="grid gap-4 p-4 border-b border-white/5"
      style={{
        gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 380px) minmax(0, 1fr)',
      }}
      aria-label="Performance Controls"
    >
      {/* Left Column: Deck A Controls */}
      <div className="flex flex-col gap-4">
        <DeckControls deckId="A" />
      </div>

      {/* Center Column: Mixer (Slightly Elevated) */}
      <div className="flex flex-col bg-(--bg-secondary) rounded-lg border border-white/5 p-4 shadow-lg">
        <MixerCenter masterBus={masterBus} masterPostFx={masterPostFx} />
      </div>

      {/* Right Column: Deck B Controls */}
      <div className="flex flex-col gap-4">
        <DeckControls deckId="B" />
      </div>
    </section>
  );
}
