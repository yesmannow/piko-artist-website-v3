/**
 * MasterBus - Master Audio Bus with Dynamics Compressor
 *
 * All channel strips route through the Master Bus before reaching the destination.
 * The Master Bus includes:
 * - Master GainNode (overall volume control)
 * - DynamicsCompressorNode (safety limiter to prevent digital clipping)
 *
 * This is a singleton to ensure all channels share the same master bus.
 */

import { AudioContextManager } from './AudioContextManager';

export class MasterBus {
  private static instance: MasterBus | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private inputNode: GainNode | null = null; // Summing node for all channels

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance of MasterBus
   */
  static getInstance(): MasterBus {
    if (!MasterBus.instance) {
      MasterBus.instance = new MasterBus();
    }
    return MasterBus.instance;
  }

  /**
   * Initialize the Master Bus
   *
   * Creates the audio graph:
   * Input (Summing) → Master Gain → Compressor → Destination
   */
  initialize(audioContext: AudioContext): void {
    if (this.masterGain) {
      return; // Already initialized
    }

    // 1. Input summing node (all channels connect here)
    this.inputNode = audioContext.createGain();
    this.inputNode.gain.value = 1.0;

    // 2. Master Gain (overall volume control)
    this.masterGain = audioContext.createGain();
    this.masterGain.gain.value = 1.0; // Default: unity gain

    // 3. Dynamics Compressor (safety limiter)
    // Settings: Threshold -3dB, Ratio 4:1, Attack 3ms, Release 100ms
    this.compressor = audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -3; // dB
    this.compressor.knee.value = 30; // Soft knee
    this.compressor.ratio.value = 4; // 4:1 compression ratio
    this.compressor.attack.value = 0.003; // 3ms attack
    this.compressor.release.value = 0.1; // 100ms release

    // Connect the chain: Input → Master Gain → Compressor → Destination
    this.inputNode.connect(this.masterGain);
    this.masterGain.connect(this.compressor);
    this.compressor.connect(audioContext.destination);
  }

  /**
   * Get the input node (where channels should connect)
   */
  getInput(): GainNode | null {
    return this.inputNode;
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(value: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  /**
   * Get current master volume
   */
  getVolume(): number {
    return this.masterGain?.gain.value || 1.0;
  }

  /**
   * Cleanup (disconnect all nodes)
   */
  disconnect(): void {
    if (this.inputNode) {
      this.inputNode.disconnect();
      this.inputNode = null;
    }
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    if (this.compressor) {
      this.compressor.disconnect();
      this.compressor = null;
    }
  }
}
