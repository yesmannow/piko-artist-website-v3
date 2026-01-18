import { create } from "zustand";
import { MediaItem, tracks } from "@/lib/data";
import { ensureAudioEngineReady } from "@/engine/AudioEngine";
import { analyzeTrackKey } from "@/lib/workers/analyzeKey";
import { detectBPM } from "@/utils/bpmDetection";

type DeckId = "deckA" | "deckB";
type EQBand = "low" | "mid" | "high";
type FxType = "flanger" | "phaser" | "delay";
type CamelotKey = `${number}${"A" | "B"}` | string;
type GhostStatus = "idle" | "loading" | "ready" | "error";

type TimelineTransition = "fade" | "cut" | "echo-out" | "filter-in" | undefined;

export type TimelineSegment = {
  id: string;
  trackId: string;
  startBeat: number;
  endBeat?: number;
  transition?: TimelineTransition;
};

type TimelineRenderState = {
  status: "idle" | "rendering" | "ready" | "error";
  url?: string | null;
  duration?: number | null;
  error?: string | null;
};

export function areKeysCompatible(
  camelotA?: CamelotKey | null,
  camelotB?: CamelotKey | null,
): boolean {
  if (!camelotA || !camelotB) return true;
  const matchA = /^(\d{1,2})([AB])$/i.exec(camelotA);
  const matchB = /^(\d{1,2})([AB])$/i.exec(camelotB);
  if (!matchA || !matchB) return true;

  const numA = parseInt(matchA[1], 10);
  const numB = parseInt(matchB[1], 10);
  const letterA = matchA[2].toUpperCase();
  const letterB = matchB[2].toUpperCase();

  // Same key or adjacent numbers on the wheel, optionally allow same number opposite scale
  const adjacent = Math.abs(numA - numB) === 1 || Math.abs(numA - numB) === 11;
  const same = numA === numB && letterA === letterB;
  const parallel = numA === numB && letterA !== letterB; // e.g., 8A vs 8B

  return same || (letterA === letterB && adjacent) || parallel;
}

interface DeckMetaState {
  track: MediaItem | null;
  eq: Record<EQBand, number>;
  fx: Record<FxType, number>;
  cues: Record<number, number | null>;
  loop: { start: number | null; end: number | null; enabled: boolean };
  showBeatGrid: boolean;
  showElapsed: boolean;
  keyInfo: MediaItem["keyInfo"];
  keyStatus: "idle" | "loading" | "ready" | "error";
  keyError: string | null;
}

interface DeckMixerStore {
  decks: Record<DeckId, DeckMetaState>;
  ghostDeck: {
    track: MediaItem | null;
    keyInfo: MediaItem["keyInfo"];
    bpm: number | null;
    status: GhostStatus;
    error?: string | null;
  };
  mixTimeline: TimelineSegment[];
  timelineRender: TimelineRenderState;
  allowKeyClash: boolean;
  keyWarning: string | null;
  loadTrackToDeck: (deck: DeckId, track: MediaItem) => Promise<void>;
  loadGhostTrack: (trackId: string) => Promise<void>;
  unloadGhostTrack: () => void;
  setEQ: (deck: DeckId, band: EQBand, value: number) => Promise<void>;
  setFXAmount: (deck: DeckId, type: FxType, value: number) => Promise<void>;
  setCuePoint: (deck: DeckId, padIndex: number, time?: number) => Promise<void>;
  clearCuePoint: (deck: DeckId, padIndex: number) => Promise<void>;
  triggerCuePoint: (deck: DeckId, padIndex: number) => Promise<void>;
  setLoopRegion: (deck: DeckId, start: number, end?: number) => Promise<void>;
  toggleLoop: (deck: DeckId, enabled: boolean) => Promise<void>;
  toggleBeatGrid: (deck: DeckId) => void;
  toggleTimeMode: (deck: DeckId) => void;
  toggleAllowKeyClash: (value: boolean) => void;
  addTimelineSegment: (segment: Omit<TimelineSegment, "id">) => void;
  updateTimelineSegment: (id: string, update: Partial<TimelineSegment>) => void;
  removeTimelineSegment: (id: string) => void;
  clearTimeline: () => void;
  startTimelineRender: (bpm?: number) => Promise<void>;
  resetTimelineRender: () => void;
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
  keyInfo: null,
  keyStatus: "idle",
  keyError: null,
};

const cloneDeckState = (): DeckMetaState => ({
  track: null,
  eq: { ...defaultDeckState.eq },
  fx: { ...defaultDeckState.fx },
  cues: { ...defaultDeckState.cues },
  loop: { ...defaultDeckState.loop },
  showBeatGrid: defaultDeckState.showBeatGrid,
  showElapsed: defaultDeckState.showElapsed,
  keyInfo: null,
  keyStatus: "idle",
  keyError: null,
});

export const useDeckMixerStore = create<DeckMixerStore>((set, get) => ({
  decks: {
    deckA: cloneDeckState(),
    deckB: cloneDeckState(),
  },
  ghostDeck: {
    track: null,
    keyInfo: null,
    bpm: null,
    status: "idle",
    error: null,
  },
  mixTimeline: [],
  timelineRender: { status: "idle", url: null, duration: null, error: null },
  allowKeyClash: false,
  keyWarning: null,

  loadTrackToDeck: async (deck, track) => {
    const engine = await ensureAudioEngineReady();
    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          keyStatus: "loading",
          keyError: null,
        },
      },
    }));

    await engine.loadTrack(deck, track.src);
    const duration = engine.getDuration(deck);
    const deckBuffer = engine.decks.get(deck)?.buffer;

    let keyInfo = track.keyInfo ?? null;
    let keyError: string | null = null;

    if (!keyInfo && deckBuffer) {
      try {
        keyInfo = await analyzeTrackKey(deckBuffer);
        // Persist back to source track so library listings can reflect it
        track.keyInfo = keyInfo;
      } catch (error) {
        keyError =
          error instanceof Error
            ? error.message
            : "Key detection failed for this track";
      }
    }

    const trackWithKey = keyInfo ? { ...track, keyInfo } : track;

    const otherDeck: DeckId = deck === "deckA" ? "deckB" : "deckA";
    const otherKey =
      get().decks[otherDeck].keyInfo || get().decks[otherDeck].track?.keyInfo;
    const compatible =
      !otherKey || areKeysCompatible(otherKey.camelot, keyInfo?.camelot);
    const shouldWarn = !compatible && !get().allowKeyClash;

    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          track: trackWithKey,
          loop: {
            ...state.decks[deck].loop,
            start: null,
            end: null,
            enabled: false,
          },
          keyInfo: keyInfo ?? null,
          keyStatus: keyInfo ? "ready" : keyError ? "error" : "idle",
          keyError,
        },
      },
      keyWarning: shouldWarn
        ? "⚠️ Key mismatch: Mix may clash"
        : state.keyWarning,
    }));

    if (shouldWarn) {
      console.warn("[KeyGuard] Key mismatch between decks");
    }

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
  toggleAllowKeyClash: (value) =>
    set(() => ({
      allowKeyClash: value,
      keyWarning: null,
    })),

  loadGhostTrack: async (trackId) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) {
      set((state) => ({
        ghostDeck: {
          ...state.ghostDeck,
          status: "error",
          error: "Track not found",
        },
      }));
      return;
    }

    set((state) => ({
      ghostDeck: {
        ...state.ghostDeck,
        status: "loading",
        error: null,
        track,
      },
    }));

    let keyInfo = track.keyInfo ?? null;
    let bpm = track.bpm ?? null;
    try {
      if (typeof window !== "undefined") {
        // Fetch/decode for analysis if needed
        if (!keyInfo || !bpm) {
          const response = await fetch(track.src);
          const arrayBuffer = await response.arrayBuffer();
          const audioContext = new AudioContext();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          if (!keyInfo) {
            keyInfo = await analyzeTrackKey(audioBuffer);
          }

          if (!bpm) {
            const bpmResult = await detectBPM(audioBuffer);
            bpm = bpmResult.bpm;
          }
        }
      }

      const updatedTrack = { ...track };
      if (keyInfo) updatedTrack.keyInfo = keyInfo;
      if (bpm) updatedTrack.bpm = bpm;

      set((state) => ({
        ghostDeck: {
          ...state.ghostDeck,
          track: updatedTrack,
          keyInfo: keyInfo ?? null,
          bpm: bpm ?? null,
          status: "ready",
          error: null,
        },
      }));
    } catch (error) {
      console.error("[GhostDeck] analysis failed", error);
      set((state) => ({
        ghostDeck: {
          ...state.ghostDeck,
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "Ghost deck analysis failed",
        },
      }));
    }
  },

  unloadGhostTrack: () =>
    set((state) => ({
      ghostDeck: {
        ...state.ghostDeck,
        track: null,
        keyInfo: null,
        bpm: null,
        status: "idle",
        error: null,
      },
    })),

  addTimelineSegment: (segment) =>
    set((state) => ({
      mixTimeline: [
        ...state.mixTimeline,
        {
          ...segment,
          id: `timeline_${Date.now()}_${state.mixTimeline.length}`,
        },
      ],
    })),

  updateTimelineSegment: (id, update) =>
    set((state) => ({
      mixTimeline: state.mixTimeline.map((segment) =>
        segment.id === id ? { ...segment, ...update } : segment,
      ),
    })),

  removeTimelineSegment: (id) =>
    set((state) => ({
      mixTimeline: state.mixTimeline.filter((segment) => segment.id !== id),
    })),

  clearTimeline: () =>
    set(() => ({
      mixTimeline: [],
    })),

  startTimelineRender: async (bpm = 120) => {
    const { renderTimeline } = await import("@/engine/renderTimeline");
    const segments = get().mixTimeline;
    if (segments.length === 0) {
      set((state) => ({
        timelineRender: {
          ...state.timelineRender,
          status: "error",
          error: "Timeline is empty",
        },
      }));
      return;
    }
    set((state) => ({
      timelineRender: { ...state.timelineRender, status: "rendering", error: null },
    }));
    try {
      const { audioBuffer, duration } = await renderTimeline({ segments, bpm });
      const wavBlob = audioBufferToWav(audioBuffer);
      const url = URL.createObjectURL(wavBlob);
      set((state) => ({
        timelineRender: { ...state.timelineRender, status: "ready", url, duration },
      }));
    } catch (error) {
      set((state) => ({
        timelineRender: {
          ...state.timelineRender,
          status: "error",
          error: error instanceof Error ? error.message : "Render failed",
        },
      }));
    }
  },

  resetTimelineRender: () =>
    set(() => ({
      timelineRender: { status: "idle", url: null, duration: null, error: null },
    })),
}));

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels: Float32Array[] = [];
  let offset = 0;
  let pos = 0;

  setUint32(0x46464952);
  setUint32(length - 8);
  setUint32(0x45564157);

  setUint32(0x20746d66);
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);

  setUint32(0x61746164);
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([bufferArray], { type: "audio/wav" });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
