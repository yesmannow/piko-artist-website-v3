import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { getCrossfadeGains } from '@/lib/utils/audioMath';

type StemKey = 'vocals' | 'drums' | 'bass' | 'other';

type StemBufferMap = Record<StemKey, AudioBuffer | null>;
type StemMuteMap = Record<StemKey, boolean>;
type StemDeckMap<T> = { A: T; B: T }
type PerformanceMode = 'high' | 'balanced' | 'low';

type DeckFocusId = 'A' | 'B' | null;

export type OnboardingStep =
  | 'welcome'
  | 'playback'
  | 'waveform'
  | 'stem-mode'
  | 'library'
  | 'fx'
  | 'done';

type StemGenerationRequest = {
  deck: 'A' | 'B';
  nonce: number;
} | null;

type StemCache = Record<string, boolean>;

interface DeckState {
  volume: number;
  pitch: number;
  isPlaying: boolean;
  isSyncing: boolean;
  currentTime: number;
  duration: number;
}

interface StudioState {
  masterBpm: number;
  crossfaderPos: number;
  crossfadeGains: { gainA: number; gainB: number };
  isRecording: boolean;
  seekRequest: { value: number; nonce: number } | null;
  stems: StemDeckMap<StemBufferMap>;
  mutedStems: StemDeckMap<StemMuteMap>;
  soloStem: StemDeckMap<StemKey | null>;
  focusedDeckId: DeckFocusId;
  stemModeEnabled: boolean;
  libraryOpen: boolean;
  /** @deprecated Phase 3: FX moved to deck-level controls. This toggle is no longer used. */
  fxPanelOpen: boolean;
  settingsOpen: boolean;
  performanceMode: PerformanceMode;
  show3D: boolean;
  showStemWaveforms: boolean;
  autoStem: boolean;
  stemGenerationRequest: StemGenerationRequest;
  stemsCache: StemCache;
  onboardingStep: OnboardingStep;
  onboardingSeen: boolean;
  useGridLayout?: boolean; // Phase V: Toggle between grid and legacy layout
  layoutMode: 'Performance' | 'Library-Heavy'; // New state for layout mode

  deckA: DeckState;
  deckB: DeckState;

  setCrossfader: (pos: number) => void;
  updateDeckTime: (deck: 'deckA' | 'deckB', time: number) => void;
  setDeckDuration: (deck: 'deckA' | 'deckB', duration: number) => void;
  setDeckVolume: (deck: 'deckA' | 'deckB', vol: number) => void;
  setMasterBpm: (bpm: number) => void;
  togglePlayback: (deck: 'deckA' | 'deckB') => void;
  seek: (value: number) => void;
  setStems: (deck: 'A' | 'B', stems: StemBufferMap) => void;
  setMutedStem: (deck: 'A' | 'B', stem: StemKey, muted: boolean) => void;
  setSoloStem: (deck: 'A' | 'B', stem: StemKey | null) => void;
  toggleStemMute: (deck: 'A' | 'B', stem: StemKey) => void; // Phase 3.3: Toggle stem on/off
  activateSoloStem: (deck: 'A' | 'B', stem: StemKey) => void; // Phase 3.3: Solo a stem (mute all others)
  clearSolo: (deck: 'A' | 'B') => void; // Phase 3.3: Clear solo mode
  setFocusedDeckId: (deck: DeckFocusId) => void;
  setStemModeEnabled: (enabled: boolean) => void;
  setLibraryOpen: (open: boolean) => void;
  /** @deprecated Phase 3: FX moved to deck-level controls. Use DeckFXRack instead. */
  setFxPanelOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setPerformanceMode: (mode: PerformanceMode) => void;
  setShow3D: (show: boolean) => void;
  setShowStemWaveforms: (show: boolean) => void;
  setAutoStem: (enabled: boolean) => void;
  requestStemGeneration: (deck: 'A' | 'B') => void;
  markStemsReady: (trackId: string, ready: boolean) => void;
  setOnboardingStep: (step: OnboardingStep) => void;
  setOnboardingSeen: (seen: boolean) => void;
  startOnboarding: () => void;
  nextOnboardingStep: () => void;
  skipOnboarding: () => void;
  setLayoutMode: (mode: 'Performance' | 'Library-Heavy') => void; // New action for setting layout mode
}

const initialDeckState: DeckState = {
  volume: 0.8,
  pitch: 0,
  isPlaying: false,
  isSyncing: false,
  currentTime: 0,
  duration: 0,
};

const initialStemBuffers: StemBufferMap = {
  vocals: null,
  drums: null,
  bass: null,
  other: null,
};

const initialStemMutes: StemMuteMap = {
  vocals: false,
  drums: false,
  bass: false,
  other: false,
};

export const useStudioStore = create<StudioState>()(
  subscribeWithSelector((set) => ({
    masterBpm: 128,
    crossfaderPos: 0.5,
    crossfadeGains: getCrossfadeGains(0.5),
    isRecording: false,
    seekRequest: null,
    stems: {
      A: { ...initialStemBuffers },
      B: { ...initialStemBuffers },
    },
    mutedStems: {
      A: { ...initialStemMutes },
      B: { ...initialStemMutes },
    },
    soloStem: {
      A: null,
      B: null,
    },
    focusedDeckId: null,
    stemModeEnabled: false,
    libraryOpen: false,
    fxPanelOpen: false,
    settingsOpen: false,
    performanceMode: 'balanced',
    show3D: false, // Clean Pro default: visuals opt-in
    showStemWaveforms: false, // Clean Pro default: reduce visual clutter
    autoStem: false, // Clean Pro default: stems on-demand only
    stemGenerationRequest: null,
    stemsCache: {},
    onboardingStep: 'welcome',
    onboardingSeen: false,
    deckA: { ...initialDeckState },
    deckB: { ...initialDeckState },
    layoutMode: 'Performance', // Initial layout mode

    setCrossfader: (pos) =>
      set(() => {
        const clamped = Math.max(0, Math.min(1, pos));
        return {
          crossfaderPos: clamped,
          crossfadeGains: getCrossfadeGains(clamped),
        };
      }),

    setMasterBpm: (bpm) => set({ masterBpm: bpm }),

    setDeckVolume: (deck, volume) =>
      set((state) => ({
        [deck]: { ...state[deck], volume: Math.max(0, Math.min(1, volume)) },
      })),

    updateDeckTime: (deck, currentTime) =>
      set((state) => ({
        [deck]: { ...state[deck], currentTime },
      })),

    setDeckDuration: (deck, duration) =>
      set((state) => ({
        [deck]: { ...state[deck], duration },
      })),

    togglePlayback: (deck) =>
      set((state) => ({
        [deck]: { ...state[deck], isPlaying: !state[deck].isPlaying },
      })),

    seek: (value) =>
      set((state) => ({
        seekRequest: {
          value: Math.max(0, Math.min(1, value)),
          nonce: (state.seekRequest?.nonce ?? 0) + 1,
        },
      })),

    setStems: (deck, stems) =>
      set((state) => ({
        stems: {
          ...state.stems,
          [deck]: { ...stems },
        },
        mutedStems: {
          ...state.mutedStems,
          [deck]: { ...initialStemMutes },
        },
        soloStem: {
          ...state.soloStem,
          [deck]: null,
        },
      })),

    setMutedStem: (deck, stem, muted) =>
      set((state) => ({
        mutedStems: {
          ...state.mutedStems,
          [deck]: {
            ...state.mutedStems[deck],
            [stem]: muted,
          },
        },
      })),

    setSoloStem: (deck, stem) =>
      set((state) => ({
        soloStem: {
          ...state.soloStem,
          [deck]: stem,
        },
      })),

    // Phase 3.3: Convenience actions for performance pads
    toggleStemMute: (deck, stem) =>
      set((state) => ({
        mutedStems: {
          ...state.mutedStems,
          [deck]: {
            ...state.mutedStems[deck],
            [stem]: !state.mutedStems[deck][stem],
          },
        },
      })),

    activateSoloStem: (deck, stem) =>
      set((state) => {
        // Set this stem as solo (unmute it, mute all others)
        const newMutes: StemMuteMap = {
          vocals: stem !== 'vocals',
          drums: stem !== 'drums',
          bass: stem !== 'bass',
          other: stem !== 'other',
        };
        return {
          soloStem: {
            ...state.soloStem,
            [deck]: stem,
          },
          mutedStems: {
            ...state.mutedStems,
            [deck]: newMutes,
          },
        };
      }),

    clearSolo: (deck) =>
      set((state) => ({
        soloStem: {
          ...state.soloStem,
          [deck]: null,
        },
        mutedStems: {
          ...state.mutedStems,
          [deck]: { ...initialStemMutes }, // Unmute all
        },
      })),

    setFocusedDeckId: (deck) => set({ focusedDeckId: deck }),

    setStemModeEnabled: (enabled) => set({ stemModeEnabled: enabled }),
    setLibraryOpen: (open) => set({ libraryOpen: open }),
    setFxPanelOpen: (open) => set({ fxPanelOpen: open }),
    setSettingsOpen: (open) => set({ settingsOpen: open }),

    setPerformanceMode: (mode) => set({ performanceMode: mode }),
    setShow3D: (show) => set({ show3D: show }),
    setShowStemWaveforms: (show) => set({ showStemWaveforms: show }),
    setAutoStem: (enabled) => set({ autoStem: enabled }),

    requestStemGeneration: (deck) =>
      set((state) => ({
        stemGenerationRequest: {
          deck,
          nonce: (state.stemGenerationRequest?.nonce ?? 0) + 1,
        },
      })),

    markStemsReady: (trackId, ready) =>
      set((state) => ({
        stemsCache: {
          ...state.stemsCache,
          [trackId]: ready,
        },
      })),

    setOnboardingStep: (step) => set({ onboardingStep: step }),
    setOnboardingSeen: (seen) => set({ onboardingSeen: seen }),
    startOnboarding: () => set({ onboardingStep: 'welcome', onboardingSeen: false }),
    nextOnboardingStep: () =>
      set((state) => {
        const order: OnboardingStep[] = [
          'welcome',
          'playback',
          'waveform',
          'stem-mode',
          'library',
          'fx',
          'done',
        ];
        const currentIndex = order.indexOf(state.onboardingStep);
        const next = order[Math.min(currentIndex + 1, order.length - 1)];
        return {
          onboardingStep: next,
          onboardingSeen: next === 'done',
        };
      }),
    skipOnboarding: () => set({ onboardingStep: 'done', onboardingSeen: true }),
    setLayoutMode: (mode) => set({ layoutMode: mode }), // Action for setting layout mode
  }))
);
