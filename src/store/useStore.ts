import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { deriveTrackKey } from '@/lib/trackKey'; // Phase S11.2

// Phase V-B: Per-Deck FX State
export interface DeckFXState {
  filter: number;        // 0-1 (bipolar high-pass/low-pass)
  reverb: number;        // 0-1 (dry/wet mix)
  reverbDecay: number;   // 0-1 (decay time)
  delay: number;         // 0-1 (dry/wet mix)
  delayFeedback: number; // 0-1 (feedback amount)
  delayTime: number;     // 0-1 (delay time)
  distortion: number;    // 0-1 (drive amount)
}

// Phase S9: Hot Cue
export interface HotCue {
  id: number;           // 0-7 (8 slots)
  timeSec: number;      // Position in track (seconds)
  label?: string;       // Optional label
  color?: string;       // Optional color (for visual differentiation)
}

// Phase S9: Loop Region
export interface LoopRegion {
  startSec: number;     // Loop start time (seconds)
  endSec: number;       // Loop end time (seconds)
  enabled: boolean;     // Whether loop is active
  quantized?: boolean;  // Whether loop was quantized to beat grid
}

// Define the shape of a single Deck's state
export interface DeckState {
  trackKey: string | null; // Phase S11.2: Canonical track identifier (normalized slug)
  trackData: {
    trackKey?: string; // Phase S11.2: Canonical track identifier (stable across environments)
    trackId?: string; // Deprecated: Use trackKey instead
    url: string;
    bpm: number;
    title: string;
    artist: string;
    artUrl?: string;
    cover?: string;
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
  filter: number; // 0..1 bipolar filter position (DEPRECATED - moved to fx.filter)
  stems: { vocals: boolean; inst: boolean }; // Phase VI: Stem toggle state
  isKeyLockActive: boolean;
  hasStems: boolean;      // Phase 3.3B: Track if stems are loaded
  // Phase V-B: Per-Deck FX
  fx: DeckFXState;
  // Phase S9: Hot Cues + Loops
  hotCues: HotCue[];     // 8 hot cue slots
  activeLoop: LoopRegion | null;  // Current loop region (only one active at a time)
}

// Legacy global FX rack (being phased out in favor of per-deck FX)
export interface FxRackState {
  bitcrush: number;
  filter: number;
  width: number;
  delayMix: number;
  delayFeedback: number;
  reverbMix: number;
  reverbDecay: number;
}

// Phase S7: Mixer Settings
export interface MixerSettings {
  crossfaderCurve: 'linear' | 'constantPower' | 'dip' | 'cut';
  eqType: 'classic' | 'isolator';
  fxRouting: 'postFader' | 'preFader';
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
  mixerSettings: MixerSettings; // Phase S7: Professional mixer settings
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
  // Phase V-B: Per-Deck FX Actions
  setDeckFX: (deck: 'A' | 'B', effect: keyof DeckFXState, value: number) => void;
  updateDeckFX: (deck: 'A' | 'B', updates: Partial<DeckFXState>) => void;
  // Phase S7: Mixer Settings Actions
  setMixerSettings: (updates: Partial<MixerSettings>) => void;
  // Phase S9: Hot Cue & Loop Actions
  setHotCue: (deck: 'A' | 'B', slot: number, timeSec: number, label?: string, color?: string) => void;
  clearHotCue: (deck: 'A' | 'B', slot: number) => void;
  setActiveLoop: (deck: 'A' | 'B', region: LoopRegion | null) => void;
  toggleLoop: (deck: 'A' | 'B') => void;
}

const initialDeckFXState: DeckFXState = {
  filter: 0.5,        // Center (neutral)
  reverb: 0,          // Dry
  reverbDecay: 0.4,   // Medium decay
  delay: 0,           // Dry
  delayFeedback: 0.35, // Moderate feedback
  delayTime: 0.375,   // Dotted eighth note
  distortion: 0,      // Clean
};

const initialDeckState: DeckState = {
  trackKey: null, // Phase S11.2: Canonical track identifier
  trackData: null,
  isPlaying: false,
  isLoaded: false,
  volume: 1,
  playbackRate: 1,
  eq: { low: 0, mid: 0, high: 0 },
  filter: 0.5, // DEPRECATED - use fx.filter instead
  stems: { vocals: true, inst: true }, // Both stems enabled by default
  isKeyLockActive: false,
  hasStems: false,
  fx: { ...initialDeckFXState },
  hotCues: [], // Phase S9: Initialize empty cue array
  activeLoop: null, // Phase S9: No active loop by default
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

const initialMixerSettings: MixerSettings = {
  crossfaderCurve: 'constantPower',
  eqType: 'classic',
  fxRouting: 'postFader',
};

export const useStore = create<MixerState>()(
  persist(
    // eslint-disable-next-line max-lines-per-function -- Zustand store with many actions
    (set, _get) => ({
      isAudioReady: false,
      isAudioStarted: false,
      isAppActive: true,
      masterBpm: 128, // Default Master BPM
      crossfadeValue: 0, // Center (-1 = A, 0 = center, 1 = B)
      crossfaderMode: 'normal', // Default to normal crossfade
      mode: 'studio', // Default to studio mode
      mixerSettings: { ...initialMixerSettings }, // Phase S7
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
          const deckKey = `deck${deck}`;
          const currentDeck = state[deckKey];
          // Phase S11.2: Derive canonical trackKey from trackData
          const trackKey = trackData ? deriveTrackKey(trackData) : null;
          return {
            [deckKey]: {
              ...currentDeck,
              trackData: trackData,
              trackKey, // Canonical identifier for DB lookups
              playbackRate: trackData?.bpm ? state.masterBpm / trackData.bpm : 1, // Auto-calc initial sync rate
              isLoaded: false,
            },
          };
        }),

      updateDeck: (deck, updates) =>
        set((state) => {
          const deckKey = `deck${deck}`;
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
          const deckKey = `deck${deck}`;
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
          const deckKey = `deck${deck}`;
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
          const deckKey = `deck${deck}`;
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
          const deckKey = `deck${deck}`;
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
          const deckKey = `deck${deck}`;
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
          const deckKey = `deck${deck}`;
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
          const deckKey = `deck${deck}`;
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
          const deckKey = `deck${deck}`;
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

      // Phase V-B: Per-Deck FX Actions
      setDeckFX: (deck, effect, value) =>
        set((state) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          const currentDeck = state[deckKey];
          return {
            [deckKey]: {
              ...currentDeck,
              fx: {
                ...currentDeck.fx,
                [effect]: value,
              },
            },
          };
        }),

      updateDeckFX: (deck, updates) =>
        set((state) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          const currentDeck = state[deckKey];
          return {
            [deckKey]: {
              ...currentDeck,
              fx: {
                ...currentDeck.fx,
                ...updates,
              },
            },
          };
        }),

      // Phase S7: Mixer Settings Actions
      setMixerSettings: (updates) =>
        set((state) => ({
          mixerSettings: {
            ...state.mixerSettings,
            ...updates,
          },
        })),

      // Phase S9: Hot Cue & Loop Actions
      setHotCue: (deck, slot, timeSec, label, color) =>
        set((state) => {
          const deckKey = `deck${deck}`;
          const currentDeck = state[deckKey];
          const existingCues = currentDeck.hotCues;
          const updatedCues = existingCues.filter((c) => c.id !== slot);
          updatedCues.push({ id: slot, timeSec, label, color });
          return {
            [deckKey]: {
              ...currentDeck,
              hotCues: updatedCues.sort((a, b) => a.id - b.id),
            },
          };
        }),

      clearHotCue: (deck, slot) =>
        set((state) => {
          const deckKey = `deck${deck}`;
          const currentDeck = state[deckKey];
          return {
            [deckKey]: {
              ...currentDeck,
              hotCues: currentDeck.hotCues.filter((c) => c.id !== slot),
            },
          };
        }),

      setActiveLoop: (deck, region) =>
        set((state) => {
          const deckKey = `deck${deck}`;
          const currentDeck = state[deckKey];
          return {
            [deckKey]: {
              ...currentDeck,
              activeLoop: region,
            },
          };
        }),

      toggleLoop: (deck) =>
        set((state) => {
          const deckKey = `deck${deck}`;
          const currentDeck = state[deckKey];
          if (!currentDeck.activeLoop) return state; // No loop to toggle
          return {
            [deckKey]: {
              ...currentDeck,
              activeLoop: {
                ...currentDeck.activeLoop,
                enabled: !currentDeck.activeLoop.enabled,
              },
            },
          };
        }),
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
        mixerSettings: state.mixerSettings, // Phase S7: Persist mixer settings
      }),
    }
  )
);
