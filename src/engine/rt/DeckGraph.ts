/**
 * DeckGraph.ts - Per-Deck Audio Node Chain
 *
 * Phase 4: Audio graph for a single deck
 *
 * Node Chain:
 * Source(AudioBufferSourceNode) -> Rate(playbackRate) -> EQ(3 Biquad) -> Gain -> MixerWorklet
 *
 * EQ Specifications:
 * - Low: lowshelf @ 200Hz
 * - Mid: peaking @ 1kHz, Q=1.0
 * - High: highshelf @ 2.5kHz
 *
 * Constraints:
 * - No node recreation during playback (except source when restarting)
 * - Sample-accurate scheduling using AudioContext.currentTime
 * - Strict TypeScript
 */

import type { EQBand } from "./control/ControlLayout";

export type DeckState = "stopped" | "playing" | "paused";

/**
 * DeckGraph - Encapsulates audio node chain for a single deck
 */
export class DeckGraph {
  private context: AudioContext;
  private mixerNode: AudioNode;
  private mixerInputIndex: number;

  // Audio nodes (persistent, except source)
  private gainNode: GainNode;
  private eqLow: BiquadFilterNode;
  private eqMid: BiquadFilterNode;
  private eqHigh: BiquadFilterNode;

  // Source node (recreated on each play)
  private sourceNode: AudioBufferSourceNode | null = null;

  // Track state
  private audioBuffer: AudioBuffer | null = null;
  private currentState: DeckState = "stopped";
  private playbackRate = 1.0;

  // Timing state (for pause/resume)
  private startTime = 0; // When playback started (context time)
  private pauseTime = 0; // Where in the track we paused (track time)

  constructor(
    context: AudioContext,
    mixerNode: AudioNode,
    mixerInputIndex: number,
  ) {
    this.context = context;
    this.mixerNode = mixerNode;
    this.mixerInputIndex = mixerInputIndex;

    // Create persistent nodes
    this.gainNode = context.createGain();
    this.gainNode.gain.value = 0.8; // Default 80% volume

    // Initialize EQ chain
    this.eqLow = this.createLowShelf();
    this.eqMid = this.createMidPeak();
    this.eqHigh = this.createHighShelf();

    // Connect EQ chain: Low -> Mid -> High -> Gain -> Mixer
    this.eqLow.connect(this.eqMid);
    this.eqMid.connect(this.eqHigh);
    this.eqHigh.connect(this.gainNode);

    // Connect to mixer at specified input index
    // Note: AudioWorkletNode doesn't support connect(destination, input)
    // so we connect to the node itself (inputs are handled internally)
    this.gainNode.connect(this.mixerNode);

    console.log(
      `[DeckGraph] Created deck graph for mixer input ${mixerInputIndex}`,
    );
  }

  /**
   * Create low-shelf filter @ 200Hz
   */
  private createLowShelf(): BiquadFilterNode {
    const filter = this.context.createBiquadFilter();
    filter.type = "lowshelf";
    filter.frequency.value = 200; // Hz
    filter.gain.value = 0; // 0dB (unity)
    return filter;
  }

  /**
   * Create peaking filter @ 1kHz, Q=1.0
   */
  private createMidPeak(): BiquadFilterNode {
    const filter = this.context.createBiquadFilter();
    filter.type = "peaking";
    filter.frequency.value = 1000; // Hz
    filter.Q.value = 1.0;
    filter.gain.value = 0; // 0dB (unity)
    return filter;
  }

  /**
   * Create high-shelf filter @ 2.5kHz
   */
  private createHighShelf(): BiquadFilterNode {
    const filter = this.context.createBiquadFilter();
    filter.type = "highshelf";
    filter.frequency.value = 2500; // Hz
    filter.gain.value = 0; // 0dB (unity)
    return filter;
  }

  /**
   * Load and decode audio track
   *
   * @param url - URL to audio file
   * @returns Promise that resolves when track is loaded
   */
  async loadTrack(url: string): Promise<void> {
    try {
      console.log(`[DeckGraph] Loading track: ${url}`);

      // Fetch audio file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get array buffer
      const arrayBuffer = await response.arrayBuffer();

      // Decode audio data
      this.audioBuffer = await this.context.decodeAudioData(arrayBuffer);

      console.log(
        `[DeckGraph] ✓ Track loaded: ${this.audioBuffer.duration.toFixed(2)}s, ${this.audioBuffer.sampleRate}Hz`,
      );
    } catch (error) {
      console.error("[DeckGraph] Failed to load track:", error);
      throw error;
    }
  }

  /**
   * Play the loaded track
   *
   * @param atContextTime - Optional context time to start playback (for sample-accurate scheduling)
   */
  play(atContextTime?: number): void {
    if (!this.audioBuffer) {
      console.warn("[DeckGraph] Cannot play: No track loaded");
      return;
    }

    if (this.currentState === "playing") {
      console.warn("[DeckGraph] Already playing");
      return;
    }

    // Stop existing source if any
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // Create new source node
    this.sourceNode = this.context.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.playbackRate.value = this.playbackRate;

    // Connect source to EQ chain
    this.sourceNode.connect(this.eqLow);

    // Calculate start time and offset
    const now = this.context.currentTime;
    const startTime = atContextTime !== undefined ? atContextTime : now;
    const offset = this.currentState === "paused" ? this.pauseTime : 0;

    // Start playback (sample-accurate)
    this.sourceNode.start(startTime, offset);

    // Update state
    this.startTime = startTime;
    this.pauseTime = offset;
    this.currentState = "playing";

    console.log(
      `[DeckGraph] Playing from ${offset.toFixed(2)}s at context time ${startTime.toFixed(3)}`,
    );
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.currentState === "stopped") {
      return;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (error) {
        // Source may have already stopped
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    this.currentState = "stopped";
    this.pauseTime = 0;
    this.startTime = 0;

    console.log("[DeckGraph] Stopped");
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.currentState !== "playing") {
      return;
    }

    // Calculate current playback position
    const elapsed =
      (this.context.currentTime - this.startTime) * this.playbackRate;
    this.pauseTime = this.pauseTime + elapsed;

    // Clamp to track duration
    if (this.audioBuffer) {
      this.pauseTime = Math.min(this.pauseTime, this.audioBuffer.duration);
    }

    // Stop source
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (error) {
        // Source may have already stopped
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    this.currentState = "paused";

    console.log(`[DeckGraph] Paused at ${this.pauseTime.toFixed(2)}s`);
  }

  /**
   * Set playback rate
   *
   * @param rate - Playback speed (0.5 to 2.0, where 1.0 is normal)
   */
  setRate(rate: number): void {
    const clampedRate = Math.max(0.5, Math.min(2.0, rate));
    this.playbackRate = clampedRate;

    // Update active source node if playing
    if (this.sourceNode && this.currentState === "playing") {
      this.sourceNode.playbackRate.value = clampedRate;
    }
  }

  /**
   * Seek to a specific position in the track
   *
   * Phase 9B: Used for beat-boundary nudging in sync controller
   *
   * @param trackTime - Target position in track time (seconds)
   */
  seek(trackTime: number): void {
    if (!this.audioBuffer) {
      return;
    }

    const clampedTime = Math.max(
      0,
      Math.min(this.audioBuffer.duration, trackTime),
    );

    if (this.currentState === "playing") {
      // Stop current playback
      if (this.sourceNode) {
        try {
          this.sourceNode.stop();
        } catch (error) {
          // Source may have already stopped
        }
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }

      // Update pause time to new position
      this.pauseTime = clampedTime;

      // Restart playback from new position
      const now = this.context.currentTime;
      this.play(now + 0.01); // Small delay to ensure clean restart
    } else if (this.currentState === "paused") {
      // Just update pause position
      this.pauseTime = clampedTime;
    } else {
      // Stopped: just update pause time (will be used on next play)
      this.pauseTime = clampedTime;
    }
  }

  /**
   * Get current audio context time for sample-accurate scheduling
   */
  private get atContextTime(): number {
    return this.context.currentTime;
  }

  /**
   * Set EQ band gain
   *
   * @param band - 'low', 'mid', or 'high'
   * @param gainDb - Gain in dB (-12 to +12)
   */
  setEQ(band: EQBand, gainDb: number): void {
    const clampedGain = Math.max(-12, Math.min(12, gainDb));

    switch (band) {
      case "low":
        this.eqLow.gain.value = clampedGain;
        break;
      case "mid":
        this.eqMid.gain.value = clampedGain;
        break;
      case "high":
        this.eqHigh.gain.value = clampedGain;
        break;
    }
  }

  /**
   * Set master gain
   *
   * @param gain - Linear gain (0.0 to 1.0)
   */
  setGain(gain: number): void {
    const clampedGain = Math.max(0, Math.min(1, gain));
    this.gainNode.gain.value = clampedGain;
  }

  /**
   * Get current state
   */
  get state(): DeckState {
    return this.currentState;
  }

  /**
   * Get current playback position in seconds
   */
  get currentTime(): number {
    if (this.currentState === "stopped") {
      return 0;
    }

    if (this.currentState === "paused") {
      return this.pauseTime;
    }

    // Playing: calculate position
    const elapsed =
      (this.context.currentTime - this.startTime) * this.playbackRate;
    return this.pauseTime + elapsed;
  }

  /**
   * Get track duration
   */
  get duration(): number {
    return this.audioBuffer ? this.audioBuffer.duration : 0;
  }

  /**
   * Check if track is loaded
   */
  get isLoaded(): boolean {
    return this.audioBuffer !== null;
  }

  /**
   * Cleanup and disconnect all nodes
   */
  dispose(): void {
    this.stop();

    // Disconnect all nodes
    this.gainNode.disconnect();
    this.eqHigh.disconnect();
    this.eqMid.disconnect();
    this.eqLow.disconnect();

    console.log("[DeckGraph] Disposed");
  }
}
