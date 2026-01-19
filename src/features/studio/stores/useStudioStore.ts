"use client";

import { create } from "zustand";

export type StudioDeckId = "A" | "B";
export type StudioStemId = "vocal" | "drum" | "bass" | "other";

export interface StudioTrack {
  id: string;
  url: string;
  volume: number; // 0..1
  stems: Record<StudioStemId, boolean>;
}

export interface StudioTimelineClip {
  id: string;
  name: string;
  startSeconds: number;
  durationSeconds: number;
  /**
   * Non-destructive edit fields:
   * - `sourceOffsetSeconds`: where this clip starts within the underlying AudioBuffer.
   * - `sourceDurationSeconds`: full available duration of the underlying AudioBuffer.
   */
  sourceOffsetSeconds?: number;
  sourceDurationSeconds?: number;
  /**
   * Downsampled waveform peaks (0..1), used for fast Canvas drawing.
   * Not required (e.g. before decode completes).
   */
  peaks?: Float32Array;

  // Analysis (computed in worker)
  detectedBpm?: number;
  energyMap?: number[]; // 0..1 per second
  key?: string; // e.g. "Am"
  camelot?: string; // e.g. "8A"
}

export interface StudioTimelineTrack {
  id: string;
  name: string;
  color: string;
  clips: StudioTimelineClip[];
  automation?: {
    volume: StudioAutomationLane;
    filter: StudioAutomationLane;
  };
}

export type StudioAutomationLaneId = "volume" | "filter";
export type StudioTimelineMode = "clips" | "automation";

export type StudioAutomationPoint = { timeSeconds: number; value01: number };
export type StudioAutomationLane = { points: StudioAutomationPoint[] };

interface StudioStoreState {
  // Transport / global
  isPlaying: boolean;
  bpm: number;
  activeDeck: StudioDeckId;
  masterVolume: number; // 0..1

  // Tracks (simple V1 model)
  tracks: StudioTrack[];
  deckTrackIds: Record<StudioDeckId, string | null>;

  // Timeline / arrangement (Studio DAW)
  timelineTracks: StudioTimelineTrack[];
  selectedClipId: string | null;
  selectedTrackId: string | null;
  snapEnabled: boolean;
  timelineMode: StudioTimelineMode;
  selectedAutomationLane: StudioAutomationLaneId;
  timelineIsPlaying: boolean;

  // Actions
  setPlaying: (playing: boolean) => void;
  setBpm: (bpm: number) => void;
  setActiveDeck: (deck: StudioDeckId) => void;
  setMasterVolume: (value: number) => void;

  setDeckTrack: (deck: StudioDeckId, trackId: string | null) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  toggleStem: (stem: StudioStemId, trackId?: string) => void;

  // Timeline actions
  ensureTimelineTrack: (index: number) => string;
  addTimelineClip: (trackId: string, clip: StudioTimelineClip) => void;
  updateTimelineClip: (clipId: string, patch: Partial<StudioTimelineClip>) => void;
  setSelectedClip: (clipId: string | null, trackId: string | null) => void;
  setSnapEnabled: (enabled: boolean) => void;
  removeTimelineClip: (clipId: string) => void;
  splitTimelineClip: (clipId: string, splitTimeSeconds: number) => { leftId: string; rightId: string } | null;
  setTimelineMode: (mode: StudioTimelineMode) => void;
  setSelectedAutomationLane: (lane: StudioAutomationLaneId) => void;
  setTimelinePlaying: (playing: boolean) => void;
  upsertAutomationPoint: (trackId: string, lane: StudioAutomationLaneId, point: StudioAutomationPoint) => void;
  clearAutomationLane: (trackId: string, lane: StudioAutomationLaneId) => void;

  // Voiceover workflow
  ensureVoiceoverTrack: () => string;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * useStudioStore
 *
 * Studio-local DAW state. This is intentionally decoupled from the legacy
 * music player and global site audio so `/studio` can evolve independently.
 */
export const useStudioStore = create<StudioStoreState>((set, get) => ({
  isPlaying: false,
  bpm: 120,
  activeDeck: "A",
  masterVolume: 0.9,

  // Provide a couple known public assets as defaults (can be replaced by UI later).
  tracks: [
    {
      id: "amor-sincero",
      url: "/audio/tracks/amor-sincero.mp3",
      volume: 1,
      stems: { vocal: true, drum: true, bass: true, other: true },
    },
    {
      id: "jardin-de-rosas",
      url: "/audio/tracks/jardin-de-rosas.mp3",
      volume: 1,
      stems: { vocal: true, drum: true, bass: true, other: true },
    },
  ],
  deckTrackIds: {
    A: "amor-sincero",
    B: "jardin-de-rosas",
  },

  timelineTracks: [],
  selectedClipId: null,
  selectedTrackId: null,
  snapEnabled: true,
  timelineMode: "clips",
  selectedAutomationLane: "volume",
  timelineIsPlaying: false,

  setPlaying: (playing) => set({ isPlaying: playing }),
  setBpm: (bpm) => set({ bpm: Math.max(1, Math.round(bpm)) }),
  setActiveDeck: (deck) => set({ activeDeck: deck }),
  setMasterVolume: (value) => set({ masterVolume: clamp01(value) }),

  setDeckTrack: (deck, trackId) =>
    set((state) => ({
      deckTrackIds: { ...state.deckTrackIds, [deck]: trackId },
    })),

  setTrackVolume: (trackId, volume) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, volume: clamp01(volume) } : t
      ),
    })),

  toggleStem: (stem, trackId) => {
    const state = get();
    const resolvedTrackId =
      trackId ?? state.deckTrackIds[state.activeDeck] ?? state.tracks[0]?.id ?? null;

    if (!resolvedTrackId) return;

    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === resolvedTrackId ? { ...t, stems: { ...t.stems, [stem]: !t.stems[stem] } } : t
      ),
    }));
  },

  ensureTimelineTrack: (index) => {
    const existing = get().timelineTracks[index];
    if (existing) return existing.id;

    const colors = ["#00ffff", "#ff00ff", "#00ff66", "#FFD700", "#ff3355", "#66a3ff"];
    const next = [...get().timelineTracks];

    while (next.length <= index) {
      const i = next.length;
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? `trk-${crypto.randomUUID()}`
          : `trk-${Math.random().toString(16).slice(2)}`;

      next.push({
        id,
        name: `Track ${i + 1}`,
        color: colors[i % colors.length],
        clips: [],
        automation: {
          volume: { points: [{ timeSeconds: 0, value01: 1 }] },
          filter: { points: [{ timeSeconds: 0, value01: 1 }] },
        },
      });
    }

    set({ timelineTracks: next });
    return next[index]!.id;
  },

  addTimelineClip: (trackId, clip) =>
    set((state) => ({
      timelineTracks: state.timelineTracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
      ),
    })),

  updateTimelineClip: (clipId, patch) =>
    set((state) => ({
      timelineTracks: state.timelineTracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...patch } : c)),
      })),
    })),

  setSelectedClip: (clipId, trackId) => set({ selectedClipId: clipId, selectedTrackId: trackId }),
  setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),

  removeTimelineClip: (clipId) =>
    set((state) => ({
      timelineTracks: state.timelineTracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => c.id !== clipId),
      })),
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
      selectedTrackId: state.selectedClipId === clipId ? null : state.selectedTrackId,
    })),

  splitTimelineClip: (clipId, splitTimeSeconds) => {
    const state = get();
    let found: { trackId: string; clip: StudioTimelineClip } | null = null;

    for (const t of state.timelineTracks) {
      const clip = t.clips.find((c) => c.id === clipId);
      if (clip) {
        found = { trackId: t.id, clip };
        break;
      }
    }

    if (!found) return null;

    const clip = found.clip;
    const start = clip.startSeconds;
    const end = clip.startSeconds + Math.max(0, clip.durationSeconds);
    const split = Math.max(start + 0.05, Math.min(end - 0.05, splitTimeSeconds));
    if (!(split > start && split < end)) return null;

    const sourceOffset = clip.sourceOffsetSeconds ?? 0;
    const sourceDuration = clip.sourceDurationSeconds ?? clip.durationSeconds;

    const leftDur = split - start;
    const rightDur = end - split;
    const rightOffset = sourceOffset + (split - start);

    const rightId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `clip-${crypto.randomUUID()}`
        : `clip-${Math.random().toString(16).slice(2)}`;

    const slicePeaks = (peaks: Float32Array | undefined, offsetSeconds: number, durationSeconds: number) => {
      if (!peaks || peaks.length < 8) return undefined;
      const total = Math.max(0.001, clip.durationSeconds);
      const startRatio = clamp01(offsetSeconds / total);
      const endRatio = clamp01((offsetSeconds + durationSeconds) / total);
      const a = Math.max(0, Math.floor(startRatio * peaks.length));
      const b = Math.max(a + 1, Math.floor(endRatio * peaks.length));
      return peaks.slice(a, Math.min(peaks.length, b));
    };

    const sliceEnergy = (energy: number[] | undefined, offsetSeconds: number, durationSeconds: number) => {
      if (!energy || energy.length < 1) return undefined;
      const a = Math.max(0, Math.floor(offsetSeconds));
      const b = Math.max(a + 1, Math.ceil(offsetSeconds + durationSeconds));
      return energy.slice(a, Math.min(energy.length, b));
    };

    const leftPatch: StudioTimelineClip = {
      ...clip,
      durationSeconds: leftDur,
      sourceOffsetSeconds: sourceOffset,
      sourceDurationSeconds: sourceDuration,
      peaks: slicePeaks(clip.peaks, 0, leftDur),
      energyMap: sliceEnergy(clip.energyMap, 0, leftDur),
    };

    const rightClip: StudioTimelineClip = {
      ...clip,
      id: rightId,
      startSeconds: split,
      durationSeconds: rightDur,
      sourceOffsetSeconds: rightOffset,
      sourceDurationSeconds: sourceDuration,
      peaks: slicePeaks(clip.peaks, split - start, rightDur),
      energyMap: sliceEnergy(clip.energyMap, split - start, rightDur),
    };

    set((s) => ({
      timelineTracks: s.timelineTracks.map((t) =>
        t.id !== found!.trackId
          ? t
          : {
              ...t,
              clips: [
                ...t.clips.map((c) => (c.id === clipId ? leftPatch : c)),
                rightClip,
              ].sort((a, b) => a.startSeconds - b.startSeconds),
            }
      ),
      selectedClipId: rightId,
      selectedTrackId: found!.trackId,
    }));

    return { leftId: clipId, rightId };
  },

  setTimelineMode: (mode) => set({ timelineMode: mode }),
  setSelectedAutomationLane: (lane) => set({ selectedAutomationLane: lane }),
  setTimelinePlaying: (playing) => set({ timelineIsPlaying: playing }),

  upsertAutomationPoint: (trackId, lane, point) =>
    set((state) => ({
      timelineTracks: state.timelineTracks.map((t) => {
        if (t.id !== trackId) return t;
        const existing = t.automation?.[lane]?.points ?? [];
        // Merge points that are very close in time (avoid dense spam)
        const eps = 0.02;
        const nextPoints = [...existing.filter((p) => Math.abs(p.timeSeconds - point.timeSeconds) > eps), point].sort(
          (a, b) => a.timeSeconds - b.timeSeconds
        );
        return {
          ...t,
          automation: {
            volume: t.automation?.volume ?? { points: [{ timeSeconds: 0, value01: 1 }] },
            filter: t.automation?.filter ?? { points: [{ timeSeconds: 0, value01: 1 }] },
            [lane]: { points: nextPoints },
          },
        };
      }),
    })),

  clearAutomationLane: (trackId, lane) =>
    set((state) => ({
      timelineTracks: state.timelineTracks.map((t) =>
        t.id !== trackId
          ? t
          : {
              ...t,
              automation: {
                volume: t.automation?.volume ?? { points: [{ timeSeconds: 0, value01: 1 }] },
                filter: t.automation?.filter ?? { points: [{ timeSeconds: 0, value01: 1 }] },
                [lane]: { points: [{ timeSeconds: 0, value01: lane === "volume" ? 1 : 1 }] },
              },
            }
      ),
    })),

  ensureVoiceoverTrack: () => {
    const existing = get().timelineTracks.find((t) => t.id === "voiceover");
    if (existing) return existing.id;

    const voice: StudioTimelineTrack = {
      id: "voiceover",
      name: "Voiceover",
      color: "#00ffff",
      clips: [],
      automation: {
        volume: { points: [{ timeSeconds: 0, value01: 1 }] },
        filter: { points: [{ timeSeconds: 0, value01: 1 }] },
      },
    };

    set((s) => ({ timelineTracks: [...s.timelineTracks, voice] }));
    return voice.id;
  },
}));

