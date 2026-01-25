"use client";

import { useMixerStore } from "../stores/useMixerStore";
import { MixerDeck } from "./MixerDeck";

export function DeckPanel({ deckId }: { deckId: "A" | "B" }) {
  const track = useMixerStore((s) => s.deckTrack[deckId]);

  return (
    <div className="relative transition-all">
      <div className="flex flex-col items-center gap-4 md:gap-6 p-4 md:p-6 bg-[#0a0a0a] rounded-lg border border-gray-800 w-full relative">
        <h3 className="text-lg font-barlow uppercase tracking-wider text-gray-300">
          DECK {deckId}
        </h3>

        {/* Track hint */}
        <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.25em]">
          {track ? `${track.title} • ${track.artist}` : "No track loaded"}
        </div>

        <MixerDeck deckId={deckId} />
      </div>
    </div>
  );
}

