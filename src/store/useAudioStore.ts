import { create } from "zustand";

interface DeckState {
  url: string | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
}

interface AudioStore {
  decks: {
    [key: string]: DeckState;
  };
  masterVolume: number;

  // Actions called by the AudioEngine to sync state
  setDeckState: (deckId: string, updates: Partial<DeckState>) => void;
  setMasterVolume: (val: number) => void;
}

export const useAudioStore = create<AudioStore>((set) => ({
  decks: {
    deckA: {
      url: null,
      isPlaying: false,
      volume: 1,
      currentTime: 0,
      duration: 0,
    },
    deckB: {
      url: null,
      isPlaying: false,
      volume: 1,
      currentTime: 0,
      duration: 0,
    },
  },
  masterVolume: 1,

  setDeckState: (deckId, updates) =>
    set((state) => ({
      decks: {
        ...state.decks,
        [deckId]: {
          ...state.decks[deckId],
          ...updates,
        },
      },
    })),

  setMasterVolume: (val) => set({ masterVolume: val }),
}));
