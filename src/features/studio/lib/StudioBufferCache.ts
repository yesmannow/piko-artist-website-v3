"use client";

import type { StudioStemId } from "../stores/useStudioStore";

/**
 * StudioBufferCache
 *
 * Holds decoded AudioBuffers that should not live inside React/Zustand state.
 * This enables:
 * - Timeline scheduling/export (OfflineAudioContext) without re-decoding.
 * - Reuse across UI components.
 */
export class StudioBufferCache {
  private static instance: StudioBufferCache | null = null;

  private clipBuffers = new Map<string, AudioBuffer>();
  private stemBuffers = new Map<string, AudioBuffer>(); // `${trackId}:${stem}`

  private constructor() {}

  static getInstance(): StudioBufferCache {
    if (!StudioBufferCache.instance) {
      StudioBufferCache.instance = new StudioBufferCache();
    }
    return StudioBufferCache.instance;
  }

  setClipBuffer(clipId: string, buffer: AudioBuffer) {
    this.clipBuffers.set(clipId, buffer);
  }

  getClipBuffer(clipId: string): AudioBuffer | null {
    return this.clipBuffers.get(clipId) ?? null;
  }

  setStemBuffer(trackId: string, stem: StudioStemId, buffer: AudioBuffer) {
    this.stemBuffers.set(`${trackId}:${stem}`, buffer);
  }

  getStemBuffer(trackId: string, stem: StudioStemId): AudioBuffer | null {
    return this.stemBuffers.get(`${trackId}:${stem}`) ?? null;
  }
}

