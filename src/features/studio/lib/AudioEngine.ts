"use client";

import { AudioContextManager } from "@/features/audio-engine/lib/AudioContextManager";
import { MasterBus } from "@/features/audio-engine/lib/MasterBus";

/**
 * AudioEngine (Studio)
 *
 * Studio-specific, lightweight orchestration layer.
 *
 * - AudioContext is a singleton via `AudioContextManager`.
 * - Context creation/resume must happen from a **user gesture** (click/tap).
 * - Playback uses the "fire-and-forget" AudioBufferSourceNode pattern.
 */
export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;

  private startTime = 0;
  private pauseOffset = 0;

  private constructor() {}

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Must be called from a user interaction.
   * Creates (if needed) and resumes the AudioContext.
   */
  async initFromUserGesture(): Promise<AudioContext> {
    const manager = AudioContextManager.getInstance();
    const ctx = manager.getContext();
    if (!ctx) {
      throw new Error("AudioContext not available (SSR or unsupported browser).");
    }
    await manager.resume();
    return ctx;
  }

  loadBuffer(buffer: AudioBuffer) {
    this.stopInternal();
    this.buffer = buffer;
    this.pauseOffset = 0;
  }

  getDurationSeconds(): number {
    if (!this.buffer) return 0;
    return this.buffer.duration || 0;
  }

  /**
   * Transport position in seconds relative to loaded buffer.
   * - If playing: derived from AudioContext time for sample-accurate UI sync.
   * - If paused: last captured pause offset.
   */
  getPositionSeconds(): number {
    const manager = AudioContextManager.getInstance();
    const ctx = manager.getContext();
    if (!ctx) return 0;

    if (this.source) {
      return Math.max(0, ctx.currentTime - this.startTime);
    }

    return Math.max(0, this.pauseOffset);
  }

  hasBuffer(): boolean {
    return this.buffer !== null;
  }

  /**
   * Connect source to the existing MasterBus (preferred).
   */
  private connectToMaster(source: AudioBufferSourceNode, ctx: AudioContext) {
    const master = MasterBus.getInstance();
    const input = master.getInput();
    if (input) {
      source.connect(input);
    } else {
      // Fallback (should not happen if AudioContextManager initialized MasterBus).
      source.connect(ctx.destination);
    }
  }

  async play(): Promise<void> {
    const ctx = await this.initFromUserGesture();
    if (!this.buffer) return;

    // If already playing, restart from current pauseOffset (idempotent-ish)
    this.stopInternal();

    const source = ctx.createBufferSource();
    source.buffer = this.buffer;
    this.connectToMaster(source, ctx);

    source.start(0, this.pauseOffset);
    this.source = source;
    this.startTime = ctx.currentTime - this.pauseOffset;

    source.onended = () => {
      // If we ran to the end naturally, reset.
      this.source = null;
      this.pauseOffset = 0;
      this.startTime = 0;
    };
  }

  pause(): void {
    const manager = AudioContextManager.getInstance();
    const ctx = manager.getContext();
    if (!ctx || !this.source) return;

    this.pauseOffset = Math.max(0, ctx.currentTime - this.startTime);
    this.stopInternal();
  }

  setMasterVolume(value: number) {
    MasterBus.getInstance().setVolume(value);
  }

  isPlaying(): boolean {
    return this.source !== null;
  }

  private stopInternal() {
    if (!this.source) return;
    try {
      this.source.onended = null;
      this.source.stop();
    } catch {
      // Already stopped
    }
    try {
      this.source.disconnect();
    } catch {
      // ignore
    }
    this.source = null;
  }
}

