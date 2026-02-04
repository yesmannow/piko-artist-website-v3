"use client";

/**
 * HotCuePanel - Hot Cue Controls (Phase S9 + S11.3 Part 4)
 *
 * 8 hot cue slots per deck with visual feedback and keyboard shortcuts.
 * Phase S11.3: Cues now persist per trackKey in IndexedDB.
 *
 * Interaction:
 * - Click cue button → Jump to cue time (if set)
 * - Shift + Click → Set cue at current playback position
 * - Ctrl/Cmd + Click → Clear cue slot
 *
 * Visual States:
 * - Empty slot: Dimmed outline
 * - Set cue: Colored button with label
 * - Active cue: Highlighted border when playback near cue time
 *
 * Integration:
 * - Cue markers rendered on waveform via Regions plugin
 * - Clicking waveform marker also triggers jump
 * - Cues persist in IndexedDB by trackKey (Phase S11.3)
 */

import { useCallback } from "react";
import { useStore } from "@/store/useStore";
import { useAudioEngine } from "@/hooks/audio/useAudioEngine";
import { useTrackCues } from "@/hooks/useTrackCues";

interface HotCuePanelProps {
  readonly deckId: "A" | "B";
}

export function HotCuePanel({ deckId }: Readonly<HotCuePanelProps>) {
  const { getPlaybackPosition, seekTo } = useAudioEngine();

  // Phase S11.3: Get trackKey for current deck
  const deck = useStore((state) => state[deckId === "A" ? "deckA" : "deckB"]);
  const trackKey = deck.trackKey;

  // Phase S11.3: Use trackKey-based cues from IndexedDB
  const { cueSlots, setCue, clearCue } = useTrackCues(trackKey);

  // Handle cue button click (jump, set, or clear)
  const handleCueClick = useCallback(
    (slot: number, event: React.MouseEvent) => {
      const cueSlot = cueSlots.find((c) => c.slot === slot);
      const hasCue = cueSlot?.timeSec !== null;

      // Ctrl/Cmd + Click: Clear cue
      if (event.ctrlKey || event.metaKey) {
        if (hasCue) {
          clearCue(slot);
        }
        return;
      }

      // Shift + Click: Set cue at current position
      if (event.shiftKey) {
        const currentTime = getPlaybackPosition(deckId);
        setCue(slot, currentTime, `${slot + 1}`);
        return;
      }

      // Click: Jump to cue (if set)
      if (hasCue && cueSlot?.timeSec !== null) {
        seekTo(deckId, cueSlot.timeSec);
      }
    },
    [cueSlots, deckId, getPlaybackPosition, setCue, clearCue, seekTo]
  );

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/5 bg-black/20 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono uppercase tracking-wider text-white/60">
          Hot Cues
        </span>
        <span className="text-xs font-mono text-white/40">
          Deck {deckId}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {cueSlots.map((cueSlot) => {
          const hasCue = cueSlot.timeSec !== null;
          const isEmpty = !hasCue;
          const color = cueSlot.color ?? '#888888';

          return (
            <button
              key={cueSlot.slot}
              onClick={(e) => handleCueClick(cueSlot.slot, e)}
              className={`
                relative h-12 rounded-md font-mono text-sm font-bold
                transition-all duration-150
                ${
                  isEmpty
                    ? "border border-white/10 bg-white/5 text-white/30 hover:bg-white/10"
                    : "border-2 text-white shadow-md hover:scale-105"
                }
              `}
              style={{
                borderColor: hasCue ? color : undefined,
                backgroundColor: hasCue ? `${color}33` : undefined,
              }}
              title={
                isEmpty
                  ? `Shift+Click to set cue ${cueSlot.slot + 1}`
                  : `Click: Jump | Shift+Click: Set | Ctrl+Click: Clear`
              }
            >
              <span className="absolute top-0.5 left-1 text-[10px] opacity-50">
                {cueSlot.slot + 1}
              </span>
              <div className="mt-2">
                {cueSlot.label ?? "—"}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-1 text-[10px] font-mono text-white/30 space-y-0.5">
        <div>Click: Jump | Shift+Click: Set | Ctrl+Click: Clear</div>
      </div>
    </div>
  );
}
