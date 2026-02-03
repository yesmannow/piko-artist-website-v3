"use client";

/**
 * DeckEQ - 3-Band EQ Controls
 *
 * Hardware-style EQ knobs for:
 * - High (treble)
 * - Mid (midrange)
 * - Low (bass)
 */

import { useStore } from "@/store/useStore";
import { Knob } from "@/components/studio/controls/Knob";

interface DeckEQProps {
  deckId: "A" | "B";
}

export function DeckEQ({ deckId }: DeckEQProps) {
  const deckKey: 'deckA' | 'deckB' = deckId === 'A' ? 'deckA' : 'deckB';
  const deck = useStore((state) => state[deckKey]);
  const setDeckEQ = useStore((state) => state.setDeckEQ);

  const eq = deck.eq;

  return (
    <div className="grid grid-cols-3 gap-1">
      <Knob
        label="High"
        value={eq.high}
        onChange={(value) => setDeckEQ(deckId, { ...eq, high: value })}
        size="sm"
        color="#00F2FF"
        min={-24}
        max={12}
        defaultValue={0}
      />
      <Knob
        label="Mid"
        value={eq.mid}
        onChange={(value) => setDeckEQ(deckId, { ...eq, mid: value })}
        size="sm"
        color="#9333ea"
        min={-24}
        max={12}
        defaultValue={0}
      />
      <Knob
        label="Low"
        value={eq.low}
        onChange={(value) => setDeckEQ(deckId, { ...eq, low: value })}
        size="sm"
        color="#ef4444"
        min={-24}
        max={12}
        defaultValue={0}
      />
    </div>
  );
}
