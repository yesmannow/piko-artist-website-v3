/**
 * FXChain.ts - Custom hip-hop effects (Tape Stop logic)
 * 
 * Specialized effects for hip-hop production including the signature "Tape Stop" effect.
 * 
 * Phase II: Core Architecture
 */

import * as Tone from 'tone';

/**
 * FXChain
 * Manages audio effects for a single deck
 */
export class FXChain {
  private filter: Tone.Filter;
  private delay: Tone.FeedbackDelay;
  private distortion: Tone.Distortion;
  private player: Tone.Player | null = null;
  private tapeStopActive = false;

  constructor() {
    // Initialize effects
    this.filter = new Tone.Filter({
      frequency: 20000,
      type: 'lowpass',
      rolloff: -24,
    });

    this.delay = new Tone.FeedbackDelay({
      delayTime: 0.25,
      feedback: 0.5,
      wet: 0,
    });

    this.distortion = new Tone.Distortion({
      distortion: 0,
      wet: 0,
    });

    // Chain: Filter -> Delay -> Distortion
    this.filter.connect(this.delay);
    this.delay.connect(this.distortion);
  }

  /**
   * Get the input node for connecting audio sources
   */
  public getInput(): Tone.Filter {
    return this.filter;
  }

  /**
   * Get the output node for connecting to destination
   */
  public getOutput(): Tone.Distortion {
    return this.distortion;
  }

  /**
   * Set filter frequency (20Hz to 20kHz)
   */
  public setFilterFrequency(freq: number): void {
    this.filter.frequency.rampTo(freq, 0.05);
  }

  /**
   * Enable/disable delay effect
   */
  public setDelayEnabled(enabled: boolean, mix = 0.5): void {
    this.delay.wet.rampTo(enabled ? mix : 0, 0.1);
  }

  /**
   * Set delay time
   */
  public setDelayTime(time: Tone.Unit.Time): void {
    this.delay.delayTime.value = time;
  }

  /**
   * Set delay feedback
   */
  public setDelayFeedback(feedback: number): void {
    this.delay.feedback.value = feedback;
  }

  /**
   * Enable/disable distortion effect
   */
  public setDistortionEnabled(enabled: boolean, amount = 0.5): void {
    this.distortion.wet.rampTo(enabled ? 1 : 0, 0.1);
    this.distortion.distortion = amount;
  }

  /**
   * Execute the signature "Tape Stop" effect
   * Ramps down playback rate to 0 over specified duration
   */
  public async tapeStop(duration = 0.5): Promise<void> {
    if (this.tapeStopActive || !this.player) {
      return;
    }

    this.tapeStopActive = true;

    try {
      // Ramp playback rate down to 0
      this.player.playbackRate = 1;
      
      // Use exponential ramp for more natural tape stop effect
      // Start at current rate, ramp to near-zero (0.01) to avoid audio glitches
      const rampTarget = 0.01;
      
      // Schedule the ramp
      if (this.player.state === 'started') {
        // For Tone.js, we need to manually ramp the playback rate
        // This is a simplified version - production would use a custom curve
        const steps = 20;
        const stepDuration = duration / steps;
        
        for (let i = 1; i <= steps; i++) {
          const progress = i / steps;
          const rate = 1 - Math.pow(progress, 2); // Quadratic ease-out
          setTimeout(() => {
            if (this.player && this.player.state === 'started') {
              this.player.playbackRate = Math.max(rate, rampTarget);
            }
          }, stepDuration * i * 1000);
        }

        // Stop the player after the effect completes
        setTimeout(() => {
          if (this.player) {
            this.player.stop();
            this.player.playbackRate = 1; // Reset for next play
          }
          this.tapeStopActive = false;
        }, duration * 1000);
      }
    } catch (error) {
      console.error('Tape stop effect failed:', error);
      this.tapeStopActive = false;
    }
  }

  /**
   * Attach a player to enable tape stop effect
   */
  public attachPlayer(player: Tone.Player): void {
    this.player = player;
  }

  /**
   * Cleanup and dispose of all nodes
   */
  public dispose(): void {
    this.filter.dispose();
    this.delay.dispose();
    this.distortion.dispose();
    this.player = null;
  }
}
