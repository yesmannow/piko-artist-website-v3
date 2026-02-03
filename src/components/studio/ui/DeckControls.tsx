"use client";

/**
 * DeckControls - Deck Performance Controls Wrapper
 *
 * Contains:
 * - Jog Wheel
 * - Transport Controls (Play/Pause/Stop)
 * - StemRack (if stems available)
 * - Performance controls
 *
 * Wraps the existing Deck component with layout-specific structure
 */

import { Deck } from "./Deck";
import { StemRack } from "./StemRack";
import { useStudioStore } from "@/store/useStudioStore";

interface DeckControlsProps {
  deckId: "A" | "B";
}

export function DeckControls({ deckId }: DeckControlsProps) {
  const stems = useStudioStore((state) => state.stems[deckId]);
  const hasStemsAvailable = Object.values(stems).some((buffer) => buffer !== null);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Main Deck Controls */}
      <div className="flex-1">
        <Deck deckId={deckId} showMiniWaveform={false} complexityMode="pro" />
      </div>

      {/* StemRack (if stems available) */}
      {hasStemsAvailable && (
        <div className="mt-auto">
          <StemRack deckId={deckId} compact={false} />
        </div>
      )}
    </div>
  );
}
