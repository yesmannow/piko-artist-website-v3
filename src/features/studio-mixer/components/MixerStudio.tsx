"use client";

import { MixerCenter } from "./MixerCenter";
import { DeckPanel } from "./DeckPanel";
import { MixerDrawer } from "@/features/ui-glass/MixerDrawer";

export function MixerStudio() {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "#121212",
        backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.03) 2px,
            rgba(0, 0, 0, 0.03) 4px
          )`,
      }}
    >
      <div className="flex-1 overflow-y-auto w-full">
        <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8 pb-28 lg:pb-8">
          {/* Mobile: mixer drawer button */}
          <div className="lg:hidden sticky top-0 z-20 -mx-4 px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur">
            <div className="flex items-center gap-2">
              <MixerDrawer
                trigger={
                  <button
                    type="button"
                    className="w-full min-h-[44px] px-3 py-2 border border-[#FFD700]/40 bg-black/40 text-[#FFD700] font-mono text-[10px] uppercase tracking-[0.25em]"
                    aria-label="Open mixer controls"
                  >
                    Mixer
                  </button>
                }
              >
                <MixerCenter />
              </MixerDrawer>
            </div>
          </div>

          {/* Desktop: 3-column layout */}
          <div className="hidden lg:grid grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-1">
              <DeckPanel deckId="A" />
            </div>

            <div className="lg:col-span-1">
              <MixerCenter />
            </div>

            <div className="lg:col-span-1">
              <DeckPanel deckId="B" />
            </div>
          </div>

          {/* Mobile: stacked decks */}
          <div className="lg:hidden flex flex-col gap-6">
            <DeckPanel deckId="A" />
            <DeckPanel deckId="B" />
          </div>
        </div>
      </div>
    </div>
  );
}

