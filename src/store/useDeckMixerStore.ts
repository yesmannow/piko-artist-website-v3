import { create } from "zustand";
import { MediaItem } from "@/lib/data";
import { ensureAudioEngineReady } from "@/engine/AudioEngine";

type DeckId = "deckA" | "deckB";
type EQBand = "low" | "mid" | "high";
type FxType = "flanger" | "phaser" | "delay";

interface DeckMetaState {
  track: MediaItem | null;
  eq: Record<EQBand, number>;
  fx: Record<FxType, number>;
  cues: Record<number, number | null>;
  loop: { start: number | null; end: number | null; enabled: boolean };
  showBeatGrid: boolean;
  showElapsed: boolean;
}

interface DeckMixerStore {
  decks: Record<DeckId, DeckMetaState>;
  loadTrackToDeck: (deck: DeckId, track: MediaItem) => Promise<void>;
  setEQ: (deck: DeckId, band: EQBand, value: number) => Promise<void>;
  setFXAmount: (deck: DeckId, type: FxType, value: number) => Promise<void>;
  setCuePoint: (deck: DeckId, padIndex: number, time?: number) => Promise<void>;
  clearCuePoint: (deck: DeckId, padIndex: number) => Promise<void>;
  triggerCuePoint: (deck: DeckId, padIndex: number) => Promise<void>;
  setLoopRegion: (deck: DeckId, start: number, end?: number) => Promise<void>;
  toggleLoop: (deck: DeckId, enabled: boolean) => Promise<void>;
  toggleBeatGrid: (deck: DeckId) => void;
  toggleTimeMode: (deck: DeckId) => void;
}

const defaultDeckState: DeckMetaState = {
  track: null,
  eq: { low: 0, mid: 0, high: 0 },
  fx: { flanger: 0, phaser: 0, delay: 0 },
  cues: {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
  },
  loop: { start: null, end: null, enabled: false },
  showBeatGrid: false,
  showElapsed: true,
};

const cloneDeckState = (): DeckMetaState => ({
  track: null,
  eq: { ...defaultDeckState.eq },
  fx: { ...defaultDeckState.fx },
  cues: { ...defaultDeckState.cues },
  loop: { ...defaultDeckState.loop },
  showBeatGrid: defaultDeckState.showBeatGrid,
  showElapsed: defaultDeckState.showElapsed,
});

export const useDeckMixerStore = create<DeckMixerStore>((set, get) => ({
  decks: {
    deckA: cloneDeckState(),
    deckB: cloneDeckState(),
  },

  loadTrackToDeck: async (deck, track) => {
    const engine = await ensureAudioEngineReady();
    await engine.loadTrack(deck, track.src);
    const duration = engine.getDuration(deck);

    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          track,
          loop: {
            ...state.decks[deck].loop,
            start: null,
            end: null,
            enabled: false,
          },
        },
      },
    }));

    // Pre-calc a default 4-beat loop for overlays if needed
    if (duration > 0) {
      engine.setLoop(deck, 0, Math.min(duration, 2));
    }
  },

  setEQ: async (deck, band, value) => {
    const engine = await ensureAudioEngineReady();
    await engine.setEQ(deck, { [band]: value });
    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          eq: { ...state.decks[deck].eq, [band]: value },
        },
      },
    }));
  },

  setFXAmount: async (deck, type, value) => {
    const clamped = Math.max(0, Math.min(1, value));
    const engine = await ensureAudioEngineReady();

    // Map requested FX to available engine controls
    if (type === "delay") {
      await engine.setFX(deck, "delay", clamped);
    } else if (type === "phaser") {
      await engine.setFX(deck, "filter", clamped);
    } else if (type === "flanger") {
      // Use reverb as a subtle widening stand-in for flanger depth
      await engine.setFX(deck, "reverb", clamped * 0.6);
    }

    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          fx: { ...state.decks[deck].fx, [type]: clamped },
        },
      },
    }));
  },

  setCuePoint: async (deck, padIndex, time) => {
    const engine = await ensureAudioEngineReady();
    engine.setHotCue(deck, padIndex);
    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          cues: {
            ...state.decks[deck].cues,
            [padIndex]: time ?? state.decks[deck].cues[padIndex],
          },
        },
      },
    }));
  },

  clearCuePoint: async (deck, padIndex) => {
    const engine = await ensureAudioEngineReady();
    engine.deleteHotCue(deck, padIndex);
    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          cues: { ...state.decks[deck].cues, [padIndex]: null },
        },
      },
    }));
  },

  triggerCuePoint: async (deck, padIndex) => {
    const engine = await ensureAudioEngineReady();
    engine.triggerHotCue(deck, padIndex);
  },

  setLoopRegion: async (deck, start, end) => {
    const engine = await ensureAudioEngineReady();
    engine.setLoop(deck, start, end);
    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          loop: { ...state.decks[deck].loop, start, end: end ?? null },
        },
      },
    }));
  },

  toggleLoop: async (deck, enabled) => {
    const engine = await ensureAudioEngineReady();
    if (enabled) {
      engine.enableLoop(deck);
    } else {
      engine.disableLoop(deck);
    }
    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          loop: { ...state.decks[deck].loop, enabled },
        },
      },
    }));
  },

  toggleBeatGrid: (deck) =>
    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          showBeatGrid: !state.decks[deck].showBeatGrid,
        },
      },
    })),

  toggleTimeMode: (deck) =>
    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          showElapsed: !state.decks[deck].showElapsed,
        },
      },
    })),
}));
