"use client";

import { MasterBus } from "@/features/audio-engine/lib/MasterBus";
import type { StudioStemId } from "../stores/useStudioStore";

type StemId = StudioStemId;

/**
 * TrackNode (Stem-capable)
 *
 * A track is a mini graph:
 *   [stem BufferSource] -> [stem Gain] -> [track Gain] -> [MasterBus input]
 *
 * Notes:
 * - AudioBufferSourceNode is one-shot; we recreate sources on each play().
 * - Stems are expected to be pre-separated for stability (web standard).
 */
export class TrackNode {
  private ctx: AudioContext;

  private stemBuffers: Partial<Record<StemId, AudioBuffer>> = {};
  private stemGains: Record<StemId, GainNode>;

  private trackGain: GainNode;
  private sources: Partial<Record<StemId, AudioBufferSourceNode>> = {};

  private startContextTime = 0;
  private pauseOffsetSeconds = 0;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;

    this.trackGain = ctx.createGain();
    this.trackGain.gain.value = 1;

    // Route to shared MasterBus input when available.
    const masterInput = MasterBus.getInstance().getInput();
    if (masterInput) {
      this.trackGain.connect(masterInput);
    } else {
      this.trackGain.connect(ctx.destination);
    }

    const makeStemGain = () => {
      const g = ctx.createGain();
      g.gain.value = 1;
      g.connect(this.trackGain);
      return g;
    };

    this.stemGains = {
      vocal: makeStemGain(),
      drum: makeStemGain(),
      bass: makeStemGain(),
      other: makeStemGain(),
    };
  }

  setStemBuffer(stem: StemId, buffer: AudioBuffer) {
    this.stemBuffers[stem] = buffer;
  }

  setVolume(volume01: number) {
    const v = Math.max(0, Math.min(1, volume01));
    this.trackGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
  }

  /**
   * Schedule volume automation on the audio timeline.
   * Use for crossfades/automix curves.
   */
  scheduleVolumeRamp(target01: number, startTime: number, durationSeconds: number) {
    const g = this.trackGain.gain;
    const startVal = g.value;
    const t0 = Math.max(this.ctx.currentTime, startTime);
    const t1 = t0 + Math.max(0, durationSeconds);
    g.cancelScheduledValues(t0);
    g.setValueAtTime(startVal, t0);
    g.linearRampToValueAtTime(Math.max(0, Math.min(1, target01)), t1);
  }

  scheduleVolumeCurve(curve: Float32Array, startTime: number, durationSeconds: number) {
    const g = this.trackGain.gain;
    const t0 = Math.max(this.ctx.currentTime, startTime);
    const dur = Math.max(0, durationSeconds);
    g.cancelScheduledValues(t0);
    // Ensure a defined start value.
    g.setValueAtTime(curve[0] ?? g.value, t0);
    g.setValueCurveAtTime(curve, t0, dur);
  }

  /**
   * Smooth stem toggle to avoid clicks.
   */
  toggleStem(stem: StemId, isActive: boolean) {
    const g = this.stemGains[stem];
    g.gain.setTargetAtTime(isActive ? 1 : 0, this.ctx.currentTime, 0.05);
  }

  isPlaying(): boolean {
    return Object.values(this.sources).some(Boolean);
  }

  getPositionSeconds(): number {
    if (this.isPlaying()) {
      return Math.max(0, this.ctx.currentTime - this.startContextTime);
    }
    return Math.max(0, this.pauseOffsetSeconds);
  }

  play(whenContextTime?: number): void {
    if (!Object.keys(this.stemBuffers).length) return;
    this.stopSources();

    const offset = this.pauseOffsetSeconds;
    const when = whenContextTime ?? this.ctx.currentTime;
    this.startContextTime = when - offset;

    (["vocal", "drum", "bass", "other"] as StemId[]).forEach((stem) => {
      const buffer = this.stemBuffers[stem];
      if (!buffer) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(this.stemGains[stem]);
      src.start(when, offset);
      src.onended = () => {
        delete this.sources[stem];
      };
      this.sources[stem] = src;
    });
  }

  pause(): void {
    if (!this.isPlaying()) return;
    this.pauseOffsetSeconds = this.getPositionSeconds();
    this.stopSources();
  }

  stop(): void {
    this.pauseOffsetSeconds = 0;
    this.stopSources();
  }

  private stopSources() {
    (Object.keys(this.sources) as StemId[]).forEach((stem) => {
      const src = this.sources[stem];
      if (!src) return;
      try {
        src.onended = null;
        src.stop();
      } catch {
        // ignore
      }
      try {
        src.disconnect();
      } catch {
        // ignore
      }
      delete this.sources[stem];
    });
  }
}

