import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define the shape of a single Deck's state
export interface DeckState {
  trackId: string | null;
  trackData: {
    url: string;
    bpm: number;
    title: string;
    artist: string;
    artUrl?: string;
    key?: string;
    scale?: string;
    energy?: number;
    danceability?: number;
    beatGrid?: number[];
    stems?: {
      full?: string;
      vocals?: string;
      drums?: string;
      other?: string;
    };
    markers?: {
      intro?: number;
      verse1?: number;
      chorus1?: number;
      drop?: number;
    };
    colorTheme?: {
      primary: string;
      secondary: string;
    };
  } | null;
  isPlaying: boolean;
  isLoaded: boolean;
  volume: number; // 0 to 1
  playbackRate: number; // 1.0 is normal speed
  eq: { low: number; mid: number; high: number }; // Gains in dB
  filter: number; // 0..1 bipolar filter position
  stems: { vocals: boolean; inst: boolean }; // Phase VI: Stem toggle state
  isKeyLockActive: boolean;
}

export interface FxRackState {
  bitcrush: number;
  filter: number;
  width: number;
  delayMix: number;
  delayFeedback: number;
  reverbMix: number;
  reverbDecay: number;
}

// Define the global Mixer state
export interface MixerState {
  isAudioReady: boolean;
  isAudioStarted: boolean;
  isAppActive: boolean;
  masterBpm: number;
  crossfadeValue: number; // Range: -1 (A) to 1 (B)
  crossfaderMode: 'normal' | 'stem-balance'; // Crossfader mode
  mode: 'simple' | 'studio'; // Progressive disclosure mode
  deckA: DeckState;
  deckB: DeckState;
  fxRack: FxRackState;

  // Actions
  setAudioReady: (status: boolean) => void;
  setAudioStarted: (status: boolean) => void;
  setAppActive: (status: boolean) => void;
  setMasterBpm: (bpm: number) => void;
  setCrossfade: (value: number) => void; // -1 to 1
  setCrossfaderMode: (mode: 'normal' | 'stem-balance') => void;
  setMode: (mode: 'simple' | 'studio') => void;
  setDeckTrack: (deck: 'A' | 'B', trackData: DeckState['trackData']) => void;
  updateDeck: (deck: 'A' | 'B', updates: Partial<DeckState>) => void;
  setDeckVolume: (deck: 'A' | 'B', vol: number) => void;
  setDeckRate: (deck: 'A' | 'B', rate: number) => void;
  setDeckEQ: (deck: 'A' | 'B', eq: DeckState['eq']) => void;
  setDeckFilter: (deck: 'A' | 'B', filter: number) => void;
  togglePlay: (deck: 'A' | 'B') => void;
  setDeckPlaying: (deck: 'A' | 'B', playing: boolean) => void;
  toggleStem: (deck: 'A' | 'B', stem: 'vocals' | 'inst') => void;
  setKeyLock: (deck: 'A' | 'B', active: boolean) => void;
  setFxRack: (updates: Partial<FxRackState>) => void;
}

const initialDeckState: DeckState = {
  trackId: null,
  trackData: null,
  isPlaying: false,
  isLoaded: false,
  volume: 1,
  playbackRate: 1,
  eq: { low: 0, mid: 0, high: 0 },
  filter: 0.5,
  stems: { vocals: true, inst: true }, // Both stems enabled by default
  isKeyLockActive: false,
};

const initialFxRackState: FxRackState = {
  bitcrush: 0,
  filter: 0,
  width: 0,
  delayMix: 0,
  delayFeedback: 0.35,
  reverbMix: 0,
  reverbDecay: 0.35,
};

export const useStore = create<MixerState>()(
  persist(
    (set, _get) => ({
      isAudioReady: false,
      isAudioStarted: false,
      isAppActive: true,
      masterBpm: 128, // Default Master BPM
      crossfadeValue: 0, // Center (-1 = A, 0 = center, 1 = B)
      crossfaderMode: 'normal', // Default to normal crossfade
      mode: 'studio', // Default to studio mode
      deckA: { ...initialDeckState },
      deckB: { ...initialDeckState },
      fxRack: { ...initialFxRackState },

      setAudioReady: (status) => set({ isAudioReady: status }),
      setAudioStarted: (status) => set({ isAudioStarted: status }),
      setAppActive: (status) => set({ isAppActive: status }),
      setMasterBpm: (bpm) => set({ masterBpm: bpm }),
      setCrossfade: (value) => set({ crossfadeValue: Math.max(-1, Math.min(1, value)) }),
      setCrossfaderMode: (mode) => set({ crossfaderMode: mode }),
      setMode: (mode) => set({ mode }),

      setDeckTrack: (deck, trackData) =>
        set((state) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          const currentDeck = state[deckKey];
          return {
            [deckKey]: {
              ...currentDeck,
              trackData: trackData,
              trackId: trackData?.url || null, // Using URL as ID for simplicity
              playbackRate: trackData && trackData.bpm ? state.masterBpm / trackData.bpm : 1, // Auto-calc initial sync rate
              isLoaded: false,
            },
          };
        }),

      updateDeck: (deck, updates) =>
        set((state) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          const currentDeck = state[deckKey];
          return {
            [deckKey]: {
              ...currentDeck,
              ...updates,
            },
          };
        }),

      setDeckVolume: (deck, vol) =>
        set((state) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          const currentDeck = state[deckKey];
          return {
            [deckKey]: {
              ...currentDeck,
              volume: vol,
            },
          };
        }),

      setDeckRate: (deck, rate) =>
        set((state) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          const currentDeck = state[deckKey];
          return {
            [deckKey]: {
              ...currentDeck,
              playbackRate: rate,
            },
          };
        }),

      setDeckEQ: (deck, eq) =>
        set((state) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          const currentDeck = state[deckKey];
          return {
            [deckKey]: {
              ...currentDeck,
              eq: eq,
            },
          };
        }),

      setDeckFilter: (deck, filter) =>
        set((state) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          const currentDeck = state[deckKey];
          return {
            [deckKey]: {
              ...currentDeck,
              filter: filter,
            },
          };
        }),

      togglePlay: (deck) =>
        set((state) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          const currentDeck = state[deckKey];
          return {
            [deckKey]: {
              ...currentDeck,
              isPlaying: !currentDeck.isPlaying,
            },
          };
        }),

      setDeckPlaying: (deck, playing) =>
        set((state) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          const currentDeck = state[deckKey];
          return {
            [deckKey]: {
              ...currentDeck,
              isPlaying: playing,
            },
          };
        }),

      toggleStem: (deck, stem) =>
        set((state) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          const currentDeck = state[deckKey];
          return {
            [deckKey]: {
              ...currentDeck,
              stems: {
                ...currentDeck.stems,
                [stem]: !currentDeck.stems[stem],
              },
            },
          };
        }),

      setKeyLock: (deck, active) =>
        set((state) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          const currentDeck = state[deckKey];
          return {
            [deckKey]: {
              ...currentDeck,
              isKeyLockActive: active,
            },
          };
        }),

      setFxRack: (updates) =>
        set((state) => ({
          fxRack: {
            ...state.fxRack,
            ...updates,
          },
        })),
    }),
    {
      name: 'piko-studio-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        deckA: state.deckA,
        deckB: state.deckB,
        fxRack: state.fxRack,
        masterBpm: state.masterBpm,
        crossfadeValue: state.crossfadeValue,
      }),
    }
  )
);
