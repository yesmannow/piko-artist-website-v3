import * as Tone from 'tone';

/**
 * CueEngine - Hot Cue Point Management
 *
 * Manages up to 8 hot cue points per deck with Tone.js integration.
 * Cue points are stored in-memory for playback control, while persistence
 * is handled by the useHotCues hook via Dexie.
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - Performance Pads System
 */
export class CueEngine {
  private cues: Map<number, number> = new Map(); // cueNumber (1-8) -> time (seconds)
  private player: Tone.Player | null = null;

  /**
   * Set the Tone.js Player instance
   */
  setPlayer(player: Tone.Player | null): void {
    this.player = player;
  }

  /**
   * Set a cue point at the specified time
   * @param cueNumber - Cue slot (1-8)
   * @param time - Time in seconds
   */
  setCue(cueNumber: number, time: number): void {
    if (cueNumber < 1 || cueNumber > 8) {
      throw new Error('Cue number must be between 1 and 8');
    }
    this.cues.set(cueNumber, time);
  }

  /**
   * Get the time for a specific cue point
   * @param cueNumber - Cue slot (1-8)
   * @returns Time in seconds, or undefined if not set
   */
  getCue(cueNumber: number): number | undefined {
    return this.cues.get(cueNumber);
  }

  /**
   * Jump to a cue point (instant seek)
   * @param cueNumber - Cue slot (1-8)
   * @returns true if jumped, false if cue doesn't exist
   */
  jumpToCue(cueNumber: number): boolean {
    const time = this.cues.get(cueNumber);
    if (time === undefined || !this.player) {
      return false;
    }

    // Seek to the cue point
    this.player.seek(time);
    return true;
  }

  /**
   * Delete a cue point
   * @param cueNumber - Cue slot (1-8)
   */
  deleteCue(cueNumber: number): void {
    this.cues.delete(cueNumber);
  }

  /**
   * Get all cue points
   * @returns Map of cue numbers to times
   */
  getAllCues(): Map<number, number> {
    return new Map(this.cues);
  }

  /**
   * Clear all cue points
   */
  clearAll(): void {
    this.cues.clear();
  }

  /**
   * Check if a cue exists
   * @param cueNumber - Cue slot (1-8)
   */
  hasCue(cueNumber: number): boolean {
    return this.cues.has(cueNumber);
  }

  /**
   * Get the current playback position
   * @returns Current time in seconds, or 0 if no player
   */
  getCurrentTime(): number {
    if (!this.player) return 0;

    // Tone.Player uses immediate() to get current playback position
    const progress = this.player.toSeconds(this.player.immediate());
    return progress;
  }
}
