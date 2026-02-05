import * as Tone from 'tone';

/**
 * LoopEngine - Loop Management for Performance Pads
 *
 * Manages loop regions with Tone.js integration.
 * Supports auto-looping, quantized loops, and beat-based loop lengths.
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - Performance Pads System
 */
export class LoopEngine {
  private player: Tone.Player | null = null;
  private loopStart = 0;
  private loopEnd = 0;
  private isLooping = false;
  private bpm = 120; // Default BPM for beat calculations

  /**
   * Set the Tone.js Player instance
   */
  setPlayer(player: Tone.Player | null): void {
    this.player = player;
    if (player) {
      player.loop = this.isLooping;
      if (this.isLooping) {
        player.loopStart = this.loopStart;
        player.loopEnd = this.loopEnd;
      }
    }
  }

  /**
   * Set the BPM for beat-based loop calculations
   */
  setBPM(bpm: number): void {
    this.bpm = bpm;
  }

  /**
   * Set a loop region
   * @param startTime - Loop start in seconds
   * @param endTime - Loop end in seconds
   */
  setLoop(startTime: number, endTime: number): void {
    if (startTime >= endTime) {
      throw new Error('Loop start must be before loop end');
    }

    this.loopStart = startTime;
    this.loopEnd = endTime;

    if (this.player) {
      this.player.loopStart = startTime;
      this.player.loopEnd = endTime;
    }
  }

  /**
   * Create a loop from current position with beat length
   * @param beats - Number of beats (e.g., 4, 8, 16, 32)
   * @returns The created loop region { start, end }
   */
  createBeatLoop(beats: number): { start: number; end: number } {
    const currentTime = this.getCurrentTime();
    const beatDuration = 60 / this.bpm; // Duration of one beat in seconds
    const loopDuration = beatDuration * beats;

    // Quantize start to nearest beat
    const quantizedStart = Math.floor(currentTime / beatDuration) * beatDuration;
    const loopEnd = quantizedStart + loopDuration;

    this.setLoop(quantizedStart, loopEnd);
    this.enableLoop();

    return { start: quantizedStart, end: loopEnd };
  }

  /**
   * Enable looping
   */
  enableLoop(): void {
    this.isLooping = true;
    if (this.player) {
      this.player.loop = true;
      this.player.loopStart = this.loopStart;
      this.player.loopEnd = this.loopEnd;
    }
  }

  /**
   * Disable looping
   */
  disableLoop(): void {
    this.isLooping = false;
    if (this.player) {
      this.player.loop = false;
    }
  }

  /**
   * Toggle loop on/off
   */
  toggleLoop(): boolean {
    if (this.isLooping) {
      this.disableLoop();
    } else {
      this.enableLoop();
    }
    return this.isLooping;
  }

  /**
   * Jump to loop start
   */
  jumpToLoopStart(): void {
    if (this.player) {
      this.player.seek(this.loopStart);
    }
  }

  /**
   * Get loop state
   */
  getLoopState(): { start: number; end: number; enabled: boolean } {
    return {
      start: this.loopStart,
      end: this.loopEnd,
      enabled: this.isLooping,
    };
  }

  /**
   * Clear the current loop
   */
  clearLoop(): void {
    this.loopStart = 0;
    this.loopEnd = 0;
    this.disableLoop();
  }

  /**
   * Get the current playback position
   */
  private getCurrentTime(): number {
    if (!this.player) return 0;
    const progress = this.player.toSeconds(this.player.immediate());
    return progress;
  }
}

