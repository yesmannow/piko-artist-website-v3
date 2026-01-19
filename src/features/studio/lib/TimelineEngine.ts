"use client";

import { AudioContextManager } from "@/features/audio-engine/lib/AudioContextManager";
import { MasterBus } from "@/features/audio-engine/lib/MasterBus";
import type { StudioTimelineTrack } from "../stores/useStudioStore";
import { StudioBufferCache } from "./StudioBufferCache";

type TrackChain = {
  gain: GainNode;
  duckGain: GainNode;
  filter: BiquadFilterNode;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function valueAtTime(points: Array<{ timeSeconds: number; value01: number }>, t: number, fallback: number) {
  if (!points.length) return fallback;
  const sorted = points.slice().sort((a, b) => a.timeSeconds - b.timeSeconds);
  if (t <= sorted[0]!.timeSeconds) return sorted[0]!.value01;
  if (t >= sorted[sorted.length - 1]!.timeSeconds) return sorted[sorted.length - 1]!.value01;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]!;
    const b = sorted[i + 1]!;
    if (t >= a.timeSeconds && t <= b.timeSeconds) {
      const span = Math.max(0.000001, b.timeSeconds - a.timeSeconds);
      const u = clamp((t - a.timeSeconds) / span, 0, 1);
      return a.value01 + (b.value01 - a.value01) * u;
    }
  }
  return fallback;
}

function filterHzFrom01(v01: number) {
  const minHz = 80;
  const maxHz = 16000;
  const v = clamp(v01, 0, 1);
  return minHz * Math.pow(maxHz / minHz, v);
}

/**
 * TimelineEngine
 *
 * Plays the Studio arrangement timeline (clips) with automation.
 * This is separate from the Deck-oriented `StudioEngine`.
 */
export class TimelineEngine {
  private static instance: TimelineEngine | null = null;

  private chains = new Map<string, TrackChain>();
  private sources: AudioBufferSourceNode[] = [];

  private isPlaying = false;
  private startContextTime = 0;
  private startPlayheadSeconds = 0;

  private constructor() {}

  static getInstance(): TimelineEngine {
    if (!TimelineEngine.instance) TimelineEngine.instance = new TimelineEngine();
    return TimelineEngine.instance;
  }

  async initFromUserGesture(): Promise<AudioContext> {
    const manager = AudioContextManager.getInstance();
    const ctx = manager.getContext();
    if (!ctx) throw new Error("AudioContext not available (SSR or unsupported browser).");
    await manager.resume();
    MasterBus.getInstance();
    return ctx;
  }

  getIsPlaying() {
    return this.isPlaying;
  }

  getPositionSeconds(): number {
    const ctx = AudioContextManager.getInstance().getContext();
    if (!ctx) return 0;
    if (!this.isPlaying) return this.startPlayheadSeconds;
    return this.startPlayheadSeconds + Math.max(0, ctx.currentTime - this.startContextTime);
  }

  stop() {
    this.stopSources();
    this.isPlaying = false;
    this.startPlayheadSeconds = 0;
    this.startContextTime = 0;
  }

  pause() {
    if (!this.isPlaying) return;
    this.startPlayheadSeconds = this.getPositionSeconds();
    this.stopSources();
    this.isPlaying = false;
  }

  /**
   * Play from the current stored playhead (resume) or an optional seek time.
   */
  async play(tracks: StudioTimelineTrack[], seekSeconds?: number) {
    const ctx = await this.initFromUserGesture();

    if (typeof seekSeconds === "number" && Number.isFinite(seekSeconds)) {
      this.startPlayheadSeconds = Math.max(0, seekSeconds);
    }

    const playhead = this.startPlayheadSeconds;
    const start = ctx.currentTime + 0.05;
    this.startContextTime = start;
    this.isPlaying = true;

    this.stopSources();

    const masterInput = MasterBus.getInstance().getInput();
    const cache = StudioBufferCache.getInstance();

    const getChain = (trackId: string) => {
      const existing = this.chains.get(trackId);
      if (existing) return existing;
      const gain = ctx.createGain();
      gain.gain.value = 1;

      const duckGain = ctx.createGain();
      duckGain.gain.value = 1;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 20000;
      filter.Q.value = 0.707;

      gain.connect(duckGain);
      duckGain.connect(filter);
      if (masterInput) filter.connect(masterInput);
      else filter.connect(ctx.destination);

      const chain = { gain, duckGain, filter };
      this.chains.set(trackId, chain);
      return chain;
    };

    // Determine timeline end for basic cleanup window (optional)
    let timelineEnd = 0;
    for (const t of tracks) {
      for (const c of t.clips) {
        timelineEnd = Math.max(timelineEnd, c.startSeconds + c.durationSeconds);
      }
      const ptsVol = t.automation?.volume.points ?? [];
      const ptsFil = t.automation?.filter.points ?? [];
      if (ptsVol.length) timelineEnd = Math.max(timelineEnd, ptsVol[ptsVol.length - 1]!.timeSeconds);
      if (ptsFil.length) timelineEnd = Math.max(timelineEnd, ptsFil[ptsFil.length - 1]!.timeSeconds);
    }

    // Schedule automation per track
    for (const t of tracks) {
      const chain = getChain(t.id);
      const volPoints = t.automation?.volume.points ?? [];
      const filPoints = t.automation?.filter.points ?? [];

      // Volume
      const volAt = valueAtTime(volPoints, playhead, 1);
      chain.gain.gain.cancelScheduledValues(start);
      chain.gain.gain.setValueAtTime(clamp(volAt, 0, 1), start);
      for (const p of volPoints) {
        if (p.timeSeconds < playhead) continue;
        const when = start + (p.timeSeconds - playhead);
        chain.gain.gain.linearRampToValueAtTime(clamp(p.value01, 0, 1), when);
      }

      // Filter (0..1 -> Hz)
      const filAt = valueAtTime(filPoints, playhead, 1);
      chain.filter.frequency.cancelScheduledValues(start);
      chain.filter.frequency.setValueAtTime(filterHzFrom01(filAt), start);
      for (const p of filPoints) {
        if (p.timeSeconds < playhead) continue;
        const when = start + (p.timeSeconds - playhead);
        chain.filter.frequency.linearRampToValueAtTime(filterHzFrom01(p.value01), when);
      }
    }

    // Auto-ducking for Voiceover track
    const voice = tracks.find((t) => t.id === "voiceover") ?? null;
    const intervals =
      voice?.clips
        .map((c) => ({
          start: c.startSeconds,
          end: c.startSeconds + Math.max(0, c.durationSeconds),
        }))
        .filter((x) => x.end > x.start) ?? [];

    intervals.sort((a, b) => a.start - b.start);
    // Merge overlaps
    const merged: Array<{ start: number; end: number }> = [];
    for (const it of intervals) {
      const last = merged[merged.length - 1];
      if (!last || it.start > last.end) merged.push({ ...it });
      else last.end = Math.max(last.end, it.end);
    }

    const duckLevel = 0.35;
    const attack = 0.05;
    const release = 0.2;
    for (const t of tracks) {
      const chain = getChain(t.id);
      chain.duckGain.gain.cancelScheduledValues(start);
      chain.duckGain.gain.setValueAtTime(1, start);
      if (t.id === "voiceover") continue;

      for (const it of merged) {
        if (it.end <= playhead) continue;
        const s0 = Math.max(playhead, it.start);
        const e0 = it.end;
        const tDuck = start + (s0 - playhead);
        const tUnduck = start + (e0 - playhead);
        chain.duckGain.gain.linearRampToValueAtTime(duckLevel, tDuck + attack);
        chain.duckGain.gain.linearRampToValueAtTime(1, tUnduck + release);
      }
    }

    // Schedule clips
    for (const t of tracks) {
      const chain = getChain(t.id);
      for (const clip of t.clips) {
        const buf = cache.getClipBuffer(clip.id);
        if (!buf) continue;

        const clipStart = clip.startSeconds;
        const clipEnd = clip.startSeconds + Math.max(0, clip.durationSeconds);
        if (clipEnd <= playhead) continue;

        const startAtTimeline = Math.max(playhead, clipStart);
        const remaining = Math.max(0, clipEnd - startAtTimeline);
        if (remaining <= 0) continue;

        const when = start + Math.max(0, clipStart - playhead);
        const offsetIntoClip = Math.max(0, playhead - clipStart);
        const sourceOffset = (clip.sourceOffsetSeconds ?? 0) + offsetIntoClip;

        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(chain.gain);
        try {
          src.start(when, sourceOffset, remaining);
        } catch {
          // ignore bad scheduling
          continue;
        }
        this.sources.push(src);
      }
    }

    // Optional: stop automatically after end (prevents runaways)
    if (timelineEnd > playhead) {
      const stopAfter = start + (timelineEnd - playhead) + 0.2;
      setTimeout(() => {
        // Only stop if still playing and near expected end
        if (this.isPlaying && this.getPositionSeconds() >= timelineEnd - 0.1) {
          this.pause();
        }
      }, Math.max(0, (stopAfter - ctx.currentTime) * 1000));
    }
  }

  private stopSources() {
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        // ignore
      }
      try {
        s.disconnect();
      } catch {
        // ignore
      }
    }
    this.sources = [];
  }
}

