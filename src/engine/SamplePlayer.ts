/**
 * SamplePlayer.ts - Sample Playback Service with Beat Sync
 *
 * Phase X: Service for managing sample playback synchronized to beatgrid markers
 *
 * Features:
 * - One-shot sample playback
 * - Beat-synchronized triggering
 * - Sample library management
 * - Velocity control
 */

import { getBeatGridService } from "../engine/BeatGridService";
import { getAudioEngine } from "../engine/AudioEngine";

export interface SampleInfo {
  id: string;
  name: string;
  url: string;
  category: "drum" | "scratch" | "fx" | "vocal" | "stem";
  bpm?: number;
  duration?: number;
  buffer?: AudioBuffer; // Cached audio buffer
}

export interface PlaybackOptions {
  velocity?: number; // 0-1
  syncToBeat?: boolean; // Whether to sync to nearest beat
  deckId?: "deckA" | "deckB"; // Which deck to sync to
}

/**
 * SamplePlayer - Service for beat-synchronized sample playback
 */
class SamplePlayer {
  private static instance: SamplePlayer | null = null;

  private audioContext: AudioContext | null = null;
  private beatGridService = getBeatGridService();
  private audioEngine = getAudioEngine();
  private sampleCache = new Map<string, AudioBuffer>();
  private activeSources = new Set<AudioBufferSourceNode>();

  // Private constructor enforces singleton
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): SamplePlayer {
    if (!SamplePlayer.instance) {
      SamplePlayer.instance = new SamplePlayer();
    }
    return SamplePlayer.instance;
  }

  /**
   * Initialize the sample player
   */
  async initialize(): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("[SamplePlayer] Cannot initialize on server");
    }

    // Create AudioContext if needed
    if (!this.audioContext) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({
        latencyHint: "interactive",
      });

      // Resume if suspended
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
    }

    console.log("[SamplePlayer] Initialized");
  }

  /**
   * Preload a sample into cache
   */
  async preloadSample(sample: SampleInfo): Promise<void> {
    if (this.sampleCache.has(sample.id)) {
      return; // Already cached
    }

    try {
      const response = await fetch(sample.url);
      const arrayBuffer = await response.arrayBuffer();

      if (!this.audioContext) {
        throw new Error("AudioContext not initialized");
      }

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sampleCache.set(sample.id, audioBuffer);

      console.log(`[SamplePlayer] Preloaded sample: ${sample.name}`);
    } catch (error) {
      console.error(
        `[SamplePlayer] Failed to preload sample ${sample.name}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Play a sample with beat synchronization
   */
  async playSample(
    sample: SampleInfo,
    options: PlaybackOptions = {},
  ): Promise<void> {
    const { velocity = 0.8, syncToBeat = true, deckId = "deckA" } = options;

    if (!this.audioContext) {
      throw new Error("SamplePlayer not initialized");
    }

    // Resume context if suspended
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    // Get or load audio buffer
    let audioBuffer = this.sampleCache.get(sample.id);
    if (!audioBuffer) {
      await this.preloadSample(sample);
      audioBuffer = this.sampleCache.get(sample.id);
    }

    if (!audioBuffer) {
      throw new Error(`Failed to load sample: ${sample.name}`);
    }

    // Calculate when to play
    let playTime = this.audioContext.currentTime;

    if (syncToBeat) {
      playTime = this.calculateBeatSyncTime(deckId);
    }

    // Create and configure source node
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = audioBuffer;
    gainNode.gain.value = velocity;

    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Track active source for cleanup
    this.activeSources.add(source);

    // Schedule playback
    source.start(playTime);

    // Cleanup when done
    source.onended = () => {
      this.activeSources.delete(source);
    };

    console.log(
      `[SamplePlayer] Playing sample: ${sample.name} at ${playTime.toFixed(3)}s (velocity: ${velocity})`,
    );
  }

  /**
   * Calculate the next beat-synchronized play time
   */
  private calculateBeatSyncTime(deckId: "deckA" | "deckB"): number {
    if (!this.audioContext) return this.audioContext!.currentTime;

    const currentTime = this.audioContext.currentTime;
    const bpm = this.audioEngine.getBPM(deckId);
    const gridOffset = this.audioEngine.getGridOffset(deckId);

    if (bpm === 0) {
      return currentTime; // No sync if no BPM
    }

    // Calculate beat length in seconds
    const beatLength = 60 / bpm;

    // Calculate time since last grid marker
    const timeSinceGrid = currentTime - gridOffset;

    // Calculate current beat position
    const currentBeat = Math.floor(timeSinceGrid / beatLength);

    // Calculate time of next beat
    const nextBeatTime = gridOffset + (currentBeat + 1) * beatLength;

    // Add a small lookahead to account for scheduling latency
    const lookaheadTime = 0.05; // 50ms lookahead

    return Math.max(currentTime, nextBeatTime - lookaheadTime);
  }

  /**
   * Stop all currently playing samples
   */
  stopAllSamples(): void {
    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch (error) {
        // Source might already be stopped
      }
    });
    this.activeSources.clear();
    console.log("[SamplePlayer] Stopped all samples");
  }

  /**
   * Get cached samples
   */
  getCachedSamples(): string[] {
    return Array.from(this.sampleCache.keys());
  }

  /**
   * Clear sample cache
   */
  clearCache(): void {
    this.sampleCache.clear();
    console.log("[SamplePlayer] Cache cleared");
  }

  /**
   * Get sample cache size
   */
  getCacheSize(): number {
    return this.sampleCache.size;
  }

  /**
   * Check if a sample is cached
   */
  isSampleCached(sampleId: string): boolean {
    return this.sampleCache.has(sampleId);
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.stopAllSamples();
    this.sampleCache.clear();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    console.log("[SamplePlayer] Disposed");
  }
}

// Export singleton instance getter
export const getSamplePlayer = () => SamplePlayer.getInstance();
