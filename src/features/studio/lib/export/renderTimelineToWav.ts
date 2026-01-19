"use client";

import { audioBufferToWAV } from "@/utils/audioRenderer";
import type { StudioTimelineTrack } from "../../stores/useStudioStore";
import { StudioBufferCache } from "../StudioBufferCache";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function filterHzFrom01(v01: number) {
  const minHz = 80;
  const maxHz = 16000;
  const v = clamp(v01, 0, 1);
  return minHz * Math.pow(maxHz / minHz, v);
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

export async function renderTimelineToWav(tracks: StudioTimelineTrack[]): Promise<Blob> {
  const clips = tracks.flatMap((t) => t.clips.map((c) => ({ trackId: t.id, clip: c })));
  if (clips.length === 0) {
    return new Blob([], { type: "audio/wav" });
  }

  // Determine render length based on cached buffers.
  const cache = StudioBufferCache.getInstance();
  let maxEnd = 0;
  let sampleRate = 44100;

  for (const { clip } of clips) {
    const buf = cache.getClipBuffer(clip.id);
    if (!buf) continue;
    sampleRate = buf.sampleRate || sampleRate;
    maxEnd = Math.max(maxEnd, clip.startSeconds + Math.max(0, clip.durationSeconds));
  }

  if (maxEnd <= 0) {
    return new Blob([], { type: "audio/wav" });
  }

  const length = Math.ceil(maxEnd * sampleRate);
  const offline = new OfflineAudioContext(2, length, sampleRate);

  // Simple mastering chain (mirrors MasterBus conceptually).
  const masterGain = offline.createGain();
  masterGain.gain.value = 1;

  const limiter = offline.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 30;
  limiter.ratio.value = 4;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.1;

  masterGain.connect(limiter);
  limiter.connect(offline.destination);

  // Per-track chain: Gain -> DuckGain -> Filter -> Master
  const trackChains = new Map<string, { gain: GainNode; duckGain: GainNode; filter: BiquadFilterNode }>();
  const getTrackChain = (trackId: string) => {
    const existing = trackChains.get(trackId);
    if (existing) return existing;
    const gain = offline.createGain();
    gain.gain.value = 1;

    const duckGain = offline.createGain();
    duckGain.gain.value = 1;

    const filter = offline.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 20000;
    filter.Q.value = 0.707;

    gain.connect(duckGain);
    duckGain.connect(filter);
    filter.connect(masterGain);

    const chain = { gain, duckGain, filter };
    trackChains.set(trackId, chain);
    return chain;
  };

  // Apply automation (volume + filter) into OfflineAudioContext
  for (const t of tracks) {
    const chain = getTrackChain(t.id);
    const volPoints = t.automation?.volume.points ?? [];
    const filPoints = t.automation?.filter.points ?? [];

    const v0 = valueAtTime(volPoints, 0, 1);
    chain.gain.gain.setValueAtTime(clamp(v0, 0, 1), 0);
    for (const p of volPoints) {
      chain.gain.gain.linearRampToValueAtTime(clamp(p.value01, 0, 1), p.timeSeconds);
    }

    const f0 = valueAtTime(filPoints, 0, 1);
    chain.filter.frequency.setValueAtTime(filterHzFrom01(f0), 0);
    for (const p of filPoints) {
      chain.filter.frequency.linearRampToValueAtTime(filterHzFrom01(p.value01), p.timeSeconds);
    }
  }

  // Auto-ducking based on Voiceover track clips
  const voice = tracks.find((t) => t.id === "voiceover") ?? null;
  const intervals =
    voice?.clips
      .map((c) => ({ start: c.startSeconds, end: c.startSeconds + Math.max(0, c.durationSeconds) }))
      .filter((x) => x.end > x.start) ?? [];
  intervals.sort((a, b) => a.start - b.start);
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
    const chain = getTrackChain(t.id);
    chain.duckGain.gain.setValueAtTime(1, 0);
    if (t.id === "voiceover") continue;
    for (const it of merged) {
      chain.duckGain.gain.linearRampToValueAtTime(duckLevel, it.start + attack);
      chain.duckGain.gain.linearRampToValueAtTime(1, it.end + release);
    }
  }

  for (const { trackId, clip } of clips) {
    const buf = cache.getClipBuffer(clip.id);
    if (!buf) continue;

    const src = offline.createBufferSource();
    src.buffer = buf;
    src.connect(getTrackChain(trackId).gain);
    const offset = Math.max(0, clip.sourceOffsetSeconds ?? 0);
    const dur = Math.max(0, clip.durationSeconds);
    try {
      src.start(clip.startSeconds, offset, dur);
    } catch {
      // ignore bad schedule
    }
  }

  const rendered = await offline.startRendering();
  return audioBufferToWAV(rendered);
}

