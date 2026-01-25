import { create } from 'zustand';

// Define the shape of a single Deck's state
export interface DeckState {
  trackId: string | null;
  trackData: {
    url: string;
    bpm: number;
    title: string;
    artist: string;
  } | null;
  isPlaying: boolean;
  volume: number; // 0 to 1
  playbackRate: number; // 1.0 is normal speed
  eq: { low: number; mid: number; high: number }; // Gains in dB
  filter: number; // Filter frequency or dry/wet mix
}

// Define the global Mixer state
export interface MixerState {
  isAudioReady: boolean;
  masterBpm: number;
  crossfader: number; // Range: -1 (A) to 1 (B)
  deckA: DeckState;
  deckB: DeckState;
  
  // Actions
  setAudioReady: (status: boolean) => void;
  setMasterBpm: (bpm: number) => void;
  setCrossfader: (value: number) => void;
  setDeckTrack: (deck: 'A' | 'B', trackData: DeckState['trackData']) => void;
  setDeckVolume: (deck: 'A' | 'B', vol: number) => void;
  setDeckRate: (deck: 'A' | 'B', rate: number) => void;
  setDeckEQ: (deck: 'A' | 'B', eq: DeckState['eq']) => void;
  setDeckFilter: (deck: 'A' | 'B', filter: number) => void;
  togglePlay: (deck: 'A' | 'B') => void;
}

const initialDeckState: DeckState = {
  trackId: null,
  trackData: null,
  isPlaying: false,
  volume: 1,
  playbackRate: 1,
  eq: { low: 0, mid: 0, high: 0 },
  filter: 0,
};

export const useStore = create<MixerState>((set) => ({
  isAudioReady: false,
  masterBpm: 128, // Default Master BPM
  crossfader: 0, // Center
  deckA: { ...initialDeckState },
  deckB: { ...initialDeckState },

  setAudioReady: (status) => set({ isAudioReady: status }),
  setMasterBpm: (bpm) => set({ masterBpm: bpm }),
  setCrossfader: (value) => set({ crossfader: value }),
  
  setDeckTrack: (deck, trackData) => set((state) => {
    const deckKey = `deck${deck}` as 'deckA' | 'deckB';
    const currentDeck = state[deckKey];
    return {
      [deckKey]: {
        ...currentDeck,
        trackData: trackData,
        trackId: trackData?.url || null, // Using URL as ID for simplicity
        playbackRate: trackData ? state.masterBpm / trackData.bpm : 1 // Auto-calc initial sync rate
      }
    };
  }),

  setDeckVolume: (deck, vol) => set((state) => {
    const deckKey = `deck${deck}` as 'deckA' | 'deckB';
    const currentDeck = state[deckKey];
    return {
      [deckKey]: {
        ...currentDeck,
        volume: vol
      }
    };
  }),

  setDeckRate: (deck, rate) => set((state) => {
    const deckKey = `deck${deck}` as 'deckA' | 'deckB';
    const currentDeck = state[deckKey];
    return {
      [deckKey]: {
        ...currentDeck,
        playbackRate: rate
      }
    };
  }),

  setDeckEQ: (deck, eq) => set((state) => {
    const deckKey = `deck${deck}` as 'deckA' | 'deckB';
    const currentDeck = state[deckKey];
    return {
      [deckKey]: {
        ...currentDeck,
        eq: eq
      }
    };
  }),

  setDeckFilter: (deck, filter) => set((state) => {
    const deckKey = `deck${deck}` as 'deckA' | 'deckB';
    const currentDeck = state[deckKey];
    return {
      [deckKey]: {
        ...currentDeck,
        filter: filter
      }
    };
  }),

  togglePlay: (deck) => set((state) => {
    const deckKey = `deck${deck}` as 'deckA' | 'deckB';
    const currentDeck = state[deckKey];
    return {
      [deckKey]: {
        ...currentDeck,
        isPlaying: !currentDeck.isPlaying
      }
    };
  }),
}));
