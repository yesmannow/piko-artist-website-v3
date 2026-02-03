"use client";

/**
 * ChannelFader - Vertical Channel Volume Fader
 *
 * Hardware-style channel fader for deck volume control
 */

import { useStore } from "@/store/useStore";
import { Fader } from "@/components/studio/controls/Fader";

interface ChannelFaderProps {
  deckId: "A" | "B";
}

export function ChannelFader({ deckId }: ChannelFaderProps) {
  const deckKey: 'deckA' | 'deckB' = deckId === 'A' ? 'deckA' : 'deckB';
  const deck = useStore((state) => state[deckKey]);
  const setDeckVolume = useStore((state) => state.setDeckVolume);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
        Ch {deckId}
      </span>
      <Fader
        value={deck.volume}
        onChange={(value) => setDeckVolume(deckId, value)}
        orientation="vertical"
        height={200}
      />
    </div>
  );
}
