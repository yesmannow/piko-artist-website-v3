/**
 * MasterBus.ts - Limiter/Compressor chain logic
 * 
 * Manages the mastering chain for the final output.
 * Essential for hip-hop production where heavy 808 bass lines can easily clip.
 * 
 * Phase II: Core Architecture
 */

import * as Tone from 'tone';

/**
 * MasterBus
 * High-quality mastering chain with Compressor and Limiter
 */
export class MasterBus {
  private limiter: Tone.Limiter;
  private compressor: Tone.Compressor;
  private masterGain: Tone.Gain;
  private analyser: Tone.Analyser;

  constructor() {
    // Create the master chain: Input -> Compressor -> Limiter -> Gain -> Destination
    this.compressor = new Tone.Compressor({
      threshold: -20,
      ratio: 4,
      attack: 0.003,
      release: 0.25,
    });

    this.limiter = new Tone.Limiter(-0.5); // Prevent clipping at -0.5dB
    this.masterGain = new Tone.Gain(1);
    this.analyser = new Tone.Analyser('waveform', 1024);

    // Chain the nodes
    this.compressor.connect(this.limiter);
    this.limiter.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.toDestination();
  }

  /**
   * Get the input node for connecting audio sources
   */
  public getInput(): Tone.Compressor {
    return this.compressor;
  }

  /**
   * Set master volume in dB
   */
  public setVolume(db: number): void {
    this.masterGain.gain.rampTo(Tone.dbToGain(db), 0.1);
  }

  /**
   * Get the current gain reduction from the compressor (for visual meters)
   */
  public getGainReduction(): number {
    // This would need to be implemented with a custom meter or AudioWorklet
    // For now, return 0 as placeholder
    return 0;
  }

  /**
   * Get analyser for visualization
   */
  public getAnalyser(): Tone.Analyser {
    return this.analyser;
  }

  /**
   * Cleanup and dispose of all nodes
   */
  public dispose(): void {
    this.compressor.dispose();
    this.limiter.dispose();
    this.masterGain.dispose();
    this.analyser.dispose();
  }
}
