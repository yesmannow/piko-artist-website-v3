"use client";

/**
 * Phase 5: Mobile Portrait Pocket Studio
 *
 * Tab-based view switcher for portrait mobile orientation
 * - DECKS: Focused deck view with A/B toggle and swipe
 * - MIXER: Full mixer controls
 * - LIBRARY: Track browser
 *
 * Phase S6: Migrated to DeckWaveformWS for consistency with desktop
 */

import { useState } from "react";
import { DeckWaveformWS } from "@/components/studio/ui/DeckWaveformWS";
import { Deck } from "@/components/studio/ui/Deck";
import { TrackLibrary } from "@/components/studio/ui/TrackLibrary";
import { MixerCenter } from "./MixerCenter";

type MobileTab = 'DECKS' | 'MIXER' | 'LIBRARY';

interface MobilePortraitPocketStudioProps {
  readonly initialTab?: MobileTab;
  readonly onTabChange?: (tab: MobileTab) => void;
}

export function MobilePortraitPocketStudio({
  initialTab = 'DECKS',
  onTabChange
}: Readonly<MobilePortraitPocketStudioProps>) {
  const [mobileTab, setMobileTab] = useState<MobileTab>(initialTab);
  const [focusedDeck, setFocusedDeck] = useState<'A' | 'B'>('A');

  const handleTabChange = (tab: MobileTab) => {
    setMobileTab(tab);
    onTabChange?.(tab);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-linear-to-b from-[#151530] to-[#050510]">
      {/* Active View Content */}
      <div className="flex-1 overflow-hidden">
        {mobileTab === 'DECKS' && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Deck A/B Toggle */}
            <div className="flex gap-2 p-3 border-b border-white/10">
              <button
                onClick={() => setFocusedDeck('A')}
                className={`flex-1 h-11 rounded-lg font-mono text-sm uppercase tracking-wider transition-all ${
                  focusedDeck === 'A'
                    ? 'bg-purple-500/20 text-purple-300 border-2 border-purple-400'
                    : 'bg-white/5 text-white/50 border border-white/10'
                }`}
              >
                Deck A
              </button>
              <button
                onClick={() => setFocusedDeck('B')}
                className={`flex-1 h-11 rounded-lg font-mono text-sm uppercase tracking-wider transition-all ${
                  focusedDeck === 'B'
                    ? 'bg-cyan-500/20 text-cyan-300 border-2 border-cyan-400'
                    : 'bg-white/5 text-white/50 border border-white/10'
                }`}
              >
                Deck B
              </button>
            </div>

            {/* Focused Deck View */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-white/50">
                  {focusedDeck === 'A' ? 'Deck A' : 'Deck B'}
                </div>
                <DeckWaveformWS deckId={focusedDeck} />
                <Deck deckId={focusedDeck} showMiniWaveform={false} complexityMode="simple" />
              </div>
            </div>
          </div>
        )}

        {mobileTab === 'MIXER' && (
          <div className="h-full overflow-y-auto p-4">
            <MixerCenter />
          </div>
        )}

        {mobileTab === 'LIBRARY' && (
          <div className="h-full overflow-hidden">
            <TrackLibrary
              isOpen={true}
              onClose={() => handleTabChange('DECKS')}
            />
          </div>
        )}
      </div>

      {/* Bottom Navigation Tabs */}
      <nav className="h-16 min-h-16 border-t border-white/10 flex justify-around items-center bg-black/40 backdrop-blur-sm">
        <button
          onClick={() => handleTabChange('DECKS')}
          className={`flex-1 h-full flex items-center justify-center text-xs font-mono uppercase tracking-wider transition-colors ${
            mobileTab === 'DECKS'
              ? 'text-purple-400 bg-white/5 border-t-2 border-purple-400'
              : 'text-white/50 hover:text-white/80'
          }`}
          aria-label="Decks view"
        >
          Decks
        </button>
        <button
          onClick={() => handleTabChange('MIXER')}
          className={`flex-1 h-full flex items-center justify-center text-xs font-mono uppercase tracking-wider transition-colors ${
            mobileTab === 'MIXER'
              ? 'text-purple-400 bg-white/5 border-t-2 border-purple-400'
              : 'text-white/50 hover:text-white/80'
          }`}
          aria-label="Mixer view"
        >
          Mixer
        </button>
        <button
          onClick={() => handleTabChange('LIBRARY')}
          className={`flex-1 h-full flex items-center justify-center text-xs font-mono uppercase tracking-wider transition-colors ${
            mobileTab === 'LIBRARY'
              ? 'text-purple-400 bg-white/5 border-t-2 border-purple-400'
              : 'text-white/50 hover:text-white/80'
          }`}
          aria-label="Library view"
        >
          Library
        </button>
      </nav>
    </div>
  );
}
