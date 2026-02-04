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
import { Knob } from "@/components/studio/ui/controls/Knob";

interface DeckEQProps {
  deckId: "A" | "B";
}

// EQ range: -24dB to +12dB (total 36dB range)
const EQ_MIN = -24;
const EQ_MAX = 12;
const EQ_RANGE = EQ_MAX - EQ_MIN;

// Convert dB value to 0-1 normalized range
const dbToNormalized = (db: number): number => {
  return (db - EQ_MIN) / EQ_RANGE;
};

// Convert 0-1 normalized value to dB
const normalizedToDb = (normalized: number): number => {
  return normalized * EQ_RANGE + EQ_MIN;
};

export function DeckEQ({ deckId }: DeckEQProps) {
  const deckKey: 'deckA' | 'deckB' = deckId === 'A' ? 'deckA' : 'deckB';
  const deck = useStore((state) => state[deckKey]);
  const setDeckEQ = useStore((state) => state.setDeckEQ);

  const eq = deck.eq;

  return (
    <div className="grid grid-cols-3 gap-1">
      <Knob
        label="High"
        value={dbToNormalized(eq.high)}
        onChange={(normalized) => setDeckEQ(deckId, { ...eq, high: normalizedToDb(normalized) })}
        size={48}
        color="#00F2FF"
      />
      <Knob
        label="Mid"
        value={dbToNormalized(eq.mid)}
        onChange={(normalized) => setDeckEQ(deckId, { ...eq, mid: normalizedToDb(normalized) })}
        size={48}
        color="#9333ea"
      />
      <Knob
        label="Low"
        value={dbToNormalized(eq.low)}
        onChange={(normalized) => setDeckEQ(deckId, { ...eq, low: normalizedToDb(normalized) })}
        size={48}
        color="#ef4444"
      />
    </div>
  );
}
