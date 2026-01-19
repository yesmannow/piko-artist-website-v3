"use client";

import { AudioContextManager } from "@/features/audio-engine/lib/AudioContextManager";
import { MasterBus } from "@/features/audio-engine/lib/MasterBus";
import type { StudioStemId } from "../stores/useStudioStore";
import { TrackNode } from "./TrackNode";
import { StudioBufferCache } from "./StudioBufferCache";

/**
 * StudioEngine
 *
 * Studio-local audio engine facade:
 * - Ensures AudioContext exists and is resumed via user gesture.
 * - Owns TrackNodes and routes all audio through the shared MasterBus.
 */
export class StudioEngine {
  private static instance: StudioEngine | null = null;

  private trackNodes = new Map<string, TrackNode>();
  private activeTrackId: string | null = null;

  private constructor() {}

  static getInstance(): StudioEngine {
    if (!StudioEngine.instance) {
      StudioEngine.instance = new StudioEngine();
    }
    return StudioEngine.instance;
  }

  async initFromUserGesture(): Promise<AudioContext> {
    const manager = AudioContextManager.getInstance();
    const ctx = manager.getContext();
    if (!ctx) throw new Error("AudioContext not available (SSR or unsupported browser).");
    await manager.resume();
    // Ensure MasterBus exists
    MasterBus.getInstance();
    return ctx;
  }

  getActiveTrackId(): string | null {
    return this.activeTrackId;
  }

  setActiveTrack(trackId: string | null) {
    this.activeTrackId = trackId;
  }

  getOrCreateTrack(trackId: string): TrackNode {
    const existing = this.trackNodes.get(trackId);
    if (existing) return existing;
    const ctx = AudioContextManager.getInstance().getContext();
    if (!ctx) {
      throw new Error("AudioContext not initialized yet.");
    }
    const node = new TrackNode(ctx);
    this.trackNodes.set(trackId, node);
    return node;
  }

  setStemBuffer(trackId: string, stem: StudioStemId, buffer: AudioBuffer) {
    const node = this.getOrCreateTrack(trackId);
    node.setStemBuffer(stem, buffer);
    StudioBufferCache.getInstance().setStemBuffer(trackId, stem, buffer);
  }

  setStemActive(trackId: string, stem: StudioStemId, active: boolean) {
    const node = this.getOrCreateTrack(trackId);
    node.toggleStem(stem, active);
  }

  setTrackVolume(trackId: string, volume01: number) {
    const node = this.getOrCreateTrack(trackId);
    node.setVolume(volume01);
  }

  setMasterVolume(volume01: number) {
    MasterBus.getInstance().setVolume(volume01);
  }

  playTrack(trackId: string) {
    this.activeTrackId = trackId;
    this.getOrCreateTrack(trackId).play();
  }

  pauseTrack(trackId: string) {
    const node = this.trackNodes.get(trackId);
    if (!node) return;
    node.pause();
  }

  getActivePositionSeconds(): number {
    if (!this.activeTrackId) return 0;
    const node = this.trackNodes.get(this.activeTrackId);
    if (!node) return 0;
    return node.getPositionSeconds();
  }

  /**
   * Automix: basic crossfade between two tracks.
   *
   * This is an MVP curve (linear). Later phases can replace with
   * energy-map-shaped curves.
   */
  automixCrossfade(fromTrackId: string, toTrackId: string, durationSeconds: number) {
    const ctx = AudioContextManager.getInstance().getContext();
    if (!ctx) throw new Error("AudioContext not initialized.");

    const from = this.getOrCreateTrack(fromTrackId);
    const to = this.getOrCreateTrack(toTrackId);

    const start = ctx.currentTime + 0.05;

    // Ensure destination track is audible but starts at 0.
    to.setVolume(0);
    to.play(start);

    from.scheduleVolumeRamp(0, start, durationSeconds);
    to.scheduleVolumeRamp(1, start, durationSeconds);

    // Make 'to' the new active track after crossfade.
    this.activeTrackId = toTrackId;
  }

  automixCrossfadeCurve(
    fromTrackId: string,
    toTrackId: string,
    durationSeconds: number,
    curve01: Float32Array
  ) {
    const ctx = AudioContextManager.getInstance().getContext();
    if (!ctx) throw new Error("AudioContext not initialized.");

    const from = this.getOrCreateTrack(fromTrackId);
    const to = this.getOrCreateTrack(toTrackId);

    const start = ctx.currentTime + 0.05;

    // Ensure destination track starts at 0 and is playing.
    to.setVolume(0);
    to.play(start);

    // Build complementary curves.
    const toCurve = curve01;
    const fromCurve = new Float32Array(curve01.length);
    for (let i = 0; i < curve01.length; i++) {
      fromCurve[i] = 1 - (curve01[i] ?? 0);
    }

    from.scheduleVolumeCurve(fromCurve, start, durationSeconds);
    to.scheduleVolumeCurve(toCurve, start, durationSeconds);

    this.activeTrackId = toTrackId;
  }
}

