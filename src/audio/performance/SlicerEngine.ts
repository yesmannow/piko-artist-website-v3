import * as Tone from 'tone';

/**
 * SlicerEngine - Beat Slicing for Performance Pads
 *
 * Divides the current beat/bar into slices and triggers them via pads.
 * Each pad triggers a slice of the beat for rhythmic effects.
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - Performance Pads System
 */
export class SlicerEngine {
  private player: Tone.Player | null = null;
  private bpm = 120;
  private sliceCount = 8; // Number of slices (8 pads)
  private sliceRegion: { start: number; end: number } = { start: 0, end: 0 };

  /**
   * Set the Tone.js Player instance
   */
  setPlayer(player: Tone.Player | null): void {
    this.player = player;
  }

  /**
   * Set the BPM for beat calculations
   */
  setBPM(bpm: number): void {
    this.bpm = bpm;
  }

  /**
   * Set the number of slices (typically 8 for 8 pads)
   */
  setSliceCount(count: number): void {
    this.sliceCount = count;
  }

  /**
   * Define the region to slice (e.g., 1 bar, 2 bars)
   * @param beats - Number of beats to slice (e.g., 4 for 1 bar, 8 for 2 bars)
   */
  setSliceRegion(beats: number): void {
    const currentTime = this.getCurrentTime();
    const beatDuration = 60 / this.bpm;

    // Quantize to nearest beat
    const quantizedStart = Math.floor(currentTime / beatDuration) * beatDuration;
    const regionDuration = beatDuration * beats;

    this.sliceRegion = {
      start: quantizedStart,
      end: quantizedStart + regionDuration,
    };
  }

  /**
   * Trigger a specific slice
   * @param sliceNumber - Slice index (0 to sliceCount-1)
   */
  triggerSlice(sliceNumber: number): void {
    if (!this.player || sliceNumber < 0 || sliceNumber >= this.sliceCount) {
      return;
    }

    const regionDuration = this.sliceRegion.end - this.sliceRegion.start;
    const sliceDuration = regionDuration / this.sliceCount;
    const sliceStart = this.sliceRegion.start + (sliceNumber * sliceDuration);

    // Jump to the slice start
    this.player.seek(sliceStart);

    // Note: For a true "slicer" effect, you'd schedule a stop after sliceDuration
    // or use a separate Player instance for one-shot playback.
    // This implementation provides basic slice triggering.
  }

  /**
   * Get slice info for a given slice number
   * @param sliceNumber - Slice index (0 to sliceCount-1)
   * @returns Slice start and end times
   */
  getSliceInfo(sliceNumber: number): { start: number; end: number } | null {
    if (sliceNumber < 0 || sliceNumber >= this.sliceCount) {
      return null;
    }

    const regionDuration = this.sliceRegion.end - this.sliceRegion.start;
    const sliceDuration = regionDuration / this.sliceCount;
    const sliceStart = this.sliceRegion.start + (sliceNumber * sliceDuration);
    const sliceEnd = sliceStart + sliceDuration;

    return { start: sliceStart, end: sliceEnd };
  }

  /**
   * Get the current slice region
   */
  getSliceRegion(): { start: number; end: number } {
    return { ...this.sliceRegion };
  }

  /**
   * Auto-set slice region to current bar
   * @param beatsPerBar - Beats per bar (default 4)
   */
  autoSetRegion(beatsPerBar = 4): void {
    this.setSliceRegion(beatsPerBar);
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

