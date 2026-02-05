import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Pad mode state (Hot Cue/Loop/Slicer/Beat Jump per deck)
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - Performance Pads System
 */

export type PadMode = 'hotCue' | 'loop' | 'slicer' | 'beatJump';

interface PadStoreState {
  // Pad mode per deck
  deckAMode: PadMode;
  deckBMode: PadMode;

  // Actions
  setDeckAMode: (mode: PadMode) => void;
  setDeckBMode: (mode: PadMode) => void;
  setMode: (deck: 'A' | 'B', mode: PadMode) => void;
  getMode: (deck: 'A' | 'B') => PadMode;
}

export const usePadStore = create<PadStoreState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state - both decks start in Hot Cue mode
    deckAMode: 'hotCue',
    deckBMode: 'hotCue',

    // Set Deck A mode
    setDeckAMode: (mode: PadMode) => {
      set({ deckAMode: mode });
    },

    // Set Deck B mode
    setDeckBMode: (mode: PadMode) => {
      set({ deckBMode: mode });
    },

    // Generic setter for either deck
    setMode: (deck: 'A' | 'B', mode: PadMode) => {
      if (deck === 'A') {
        set({ deckAMode: mode });
      } else {
        set({ deckBMode: mode });
      }
    },

    // Generic getter for either deck
    getMode: (deck: 'A' | 'B') => {
      const state = get();
      return deck === 'A' ? state.deckAMode : state.deckBMode;
    },
  }))
);

