"use client";

import { useEffect, useMemo, useState } from "react";
import { Wand2 } from "lucide-react";
import { suggestMix, type TrackSuggestion } from "@/engine/suggestMix";
import { useDeckMixerStore } from "@/store/useDeckMixerStore";
import { SuggestedTracksModal } from "@/components/SuggestedTracksModal";

type SmartSuggestButtonProps = {
  limit?: number;
};

export function SmartSuggestButton({ limit = 6 }: SmartSuggestButtonProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<TrackSuggestion[]>([]);
  const ghostDeck = useDeckMixerStore((state) => state.ghostDeck);
  const decks = useDeckMixerStore((state) => state.decks);
  const loadGhostTrack = useDeckMixerStore((state) => state.loadGhostTrack);

  const keyRefs = useMemo(
    () => [
      decks.deckA.keyInfo?.camelot,
      decks.deckB.keyInfo?.camelot,
      ghostDeck.keyInfo?.camelot,
    ],
    [decks, ghostDeck],
  );

  const bpmRefs = useMemo(
    () => [decks.deckA.track?.bpm, decks.deckB.track?.bpm, ghostDeck.bpm],
    [decks, ghostDeck],
  );

  useEffect(() => {
    if (!open) return;
    const results = suggestMix({
      currentKeys: keyRefs,
      currentBpms: bpmRefs,
      limit,
      vibe: "any",
    });
    setSuggestions(results);
  }, [open, keyRefs, bpmRefs, limit]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:border-[#c1ff00]/40"
      >
        <Wand2 className="h-4 w-4" />
        Smart Suggest
      </button>
      <SuggestedTracksModal
        open={open}
        onClose={() => setOpen(false)}
        suggestions={suggestions}
      />
    </div>
  );
}
