"use client";

import { create } from "zustand";
import { tracks as mediaTracks } from "@/lib/data";

export type MixerDeckId = "A" | "B";
export type CrossfaderCurve = "smooth" | "linear" | "sharp";
export type FxTarget = MixerDeckId | "master";

export type FxFilterType = "lpf" | "hpf" | "bpf";

export interface MixerTrackItem {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverArt?: string;
  vibe?: string;
}

interface MixerStoreState {
  // Global
  bpm: number;
  fxTarget: FxTarget;

  // Deck routing
  deckUrl: Record<MixerDeckId, string | null>;
  deckTrack: Record<MixerDeckId, MixerTrackItem | null>;

  // Mixer
  deckVolume: Record<MixerDeckId, number>; // 0..1
  crossfader: number; // -1..1
  crossfaderCurve: CrossfaderCurve;

  // EQ (V1)
  eq: Record<MixerDeckId, { high: number; mid: number; low: number }>; // -1..1
  kills: Record<MixerDeckId, { high: boolean; mid: boolean; low: boolean }>;

  // FX (V1, 0..1 unless specified)
  fx: {
    filterType: FxFilterType;
    filterCutoff01: number;
    grit01: number;
    reverbWet01: number;
    delayTime01: number;
    delayFeedback01: number;
    flangerRate01: number;
    flangerDepth01: number;
    phaserRate01: number;
    phaserDepth01: number;
    chorusRate01: number;
    chorusDepth01: number;
    echoTime01: number;
    echoFeedback01: number;
  };

  // Kaoss pad
  kaoss: { x01: number; y01: number };

  // Library UI
  libraryOpen: boolean;
  search: string;
  vibeFilter: string;

  // Derived
  libraryTracks: MixerTrackItem[];

  // Actions
  setBpm: (bpm: number) => void;
  setFxTarget: (target: FxTarget) => void;

  setDeckTrack: (deck: MixerDeckId, track: MixerTrackItem | null) => void;
  setDeckUrl: (deck: MixerDeckId, url: string | null) => void;

  setDeckVolume: (deck: MixerDeckId, v01: number) => void;
  setCrossfader: (v: number) => void;
  setCrossfaderCurve: (curve: CrossfaderCurve) => void;

  setEq: (deck: MixerDeckId, band: "high" | "mid" | "low", value: number) => void;
  toggleKill: (deck: MixerDeckId, band: "high" | "mid" | "low") => void;

  setFxParam: <K extends keyof MixerStoreState["fx"]>(key: K, value: MixerStoreState["fx"][K]) => void;
  setKaoss: (x01: number, y01: number) => void;
  resetFx: () => void;

  setLibraryOpen: (open: boolean) => void;
  setSearch: (q: string) => void;
  setVibeFilter: (vibe: string) => void;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const clamp11 = (v: number) => Math.max(-1, Math.min(1, v));

const DEFAULT_FX: MixerStoreState["fx"] = {
  filterType: "lpf",
  filterCutoff01: 1,
  grit01: 0,
  reverbWet01: 0,
  delayTime01: 0,
  delayFeedback01: 0,
  flangerRate01: 0.25,
  flangerDepth01: 0,
  phaserRate01: 0.25,
  phaserDepth01: 0,
  chorusRate01: 0.4,
  chorusDepth01: 0,
  echoTime01: 0.25,
  echoFeedback01: 0,
};

const DEFAULT_LIBRARY: MixerTrackItem[] = mediaTracks
  .filter((t) => t.type === "audio")
  .map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    url: t.src,
    coverArt: t.coverArt,
    vibe: t.vibe,
  }));

export const useMixerStore = create<MixerStoreState>((set, _get) => ({
  bpm: 120,
  fxTarget: "A",

  deckUrl: { A: DEFAULT_LIBRARY[0]?.url ?? null, B: DEFAULT_LIBRARY[1]?.url ?? null },
  deckTrack: { A: DEFAULT_LIBRARY[0] ?? null, B: DEFAULT_LIBRARY[1] ?? null },

  deckVolume: { A: 0.9, B: 0.9 },
  crossfader: 0,
  crossfaderCurve: "smooth",

  eq: { A: { high: 0, mid: 0, low: 0 }, B: { high: 0, mid: 0, low: 0 } },
  kills: { A: { high: false, mid: false, low: false }, B: { high: false, mid: false, low: false } },

  fx: { ...DEFAULT_FX },
  kaoss: { x01: 0.5, y01: 0.5 },

  libraryOpen: false,
  search: "",
  vibeFilter: "all",
  libraryTracks: DEFAULT_LIBRARY,

  setBpm: (bpm) => set({ bpm: Math.max(1, Math.round(bpm)) }),
  setFxTarget: (target) => set({ fxTarget: target }),

  setDeckTrack: (deck, track) =>
    set((s) => ({
      deckTrack: { ...s.deckTrack, [deck]: track },
      deckUrl: { ...s.deckUrl, [deck]: track?.url ?? null },
    })),
  setDeckUrl: (deck, url) => set((s) => ({ deckUrl: { ...s.deckUrl, [deck]: url } })),

  setDeckVolume: (deck, v01) => set((s) => ({ deckVolume: { ...s.deckVolume, [deck]: clamp01(v01) } })),
  setCrossfader: (v) => set({ crossfader: clamp11(v) }),
  setCrossfaderCurve: (curve) => set({ crossfaderCurve: curve }),

  setEq: (deck, band, value) =>
    set((s) => ({ eq: { ...s.eq, [deck]: { ...s.eq[deck], [band]: clamp11(value) } } })),
  toggleKill: (deck, band) =>
    set((s) => ({ kills: { ...s.kills, [deck]: { ...s.kills[deck], [band]: !s.kills[deck][band] } } })),

  setFxParam: (key, value) =>
    set((s) => ({
      fx: {
        ...s.fx,
        [key]:
          typeof value === "number" ? (key === "filterType" ? value : clamp01(value)) : value,
      } as MixerStoreState["fx"],
    })),

  setKaoss: (x01, y01) => set({ kaoss: { x01: clamp01(x01), y01: clamp01(y01) } }),

  resetFx: () => set({ fx: { ...DEFAULT_FX }, kaoss: { x01: 0.5, y01: 0.5 } }),

  setLibraryOpen: (open) => set({ libraryOpen: open }),
  setSearch: (q) => set({ search: q }),
  setVibeFilter: (vibe) => set({ vibeFilter: vibe }),
}));

