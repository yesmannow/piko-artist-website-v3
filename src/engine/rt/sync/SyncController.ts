/**
 * SyncController.ts - PLL Phase-Locked Loop Sync Controller
 *
 * Phase 9B: Synchronizes slave deck to master deck using tempo and phase matching
 *
 * Architecture:
 * - Uses AudioContext.currentTime for timing (no setTimeout/setInterval)
 * - PLL algorithm: computes phase error and adjusts playbackRate
 * - Bounded corrections to prevent warble
 * - EMA smoothing for stable rate changes
 *
 * Algorithm:
 * 1. Calculate baseRate = masterBPM / slaveBPM
 * 2. Find nearest master beat at current time
 * 3. Predict slave beat position based on current playbackRate
 * 4. Compute phaseError = masterBeat - slaveBeat
 * 5. Apply correction: correctedRate = baseRate + Kp * phaseError
 * 6. Clamp and smooth the corrected rate
 * 7. Apply to DeckGraph.setRate()
 */

import type { DeckId } from "../control/ControlLayout";
import {
  getBeatGridService,
  type BeatGridData,
} from "@/engine/BeatGridService";
import type { DeckGraph } from "../DeckGraph";

export interface SyncParams {
  Kp: number; // Proportional gain (phase correction strength)
  Ki: number; // Integral gain (accumulated error correction)
  maxRateDelta: number; // Maximum rate deviation from baseRate
  smoothing: number; // EMA smoothing factor (0-1, higher = smoother)
  beatNudgeThreshold: number; // Phase error threshold for beat-boundary nudge (seconds)
  integralDecay: number; // Decay factor for integral term (0-1, prevents windup)
}

export interface SyncState {
  enabled: boolean;
  slaveDeck: DeckId | null;
  masterDeck: DeckId | null;
  slaveBeatGrid: BeatGridData | null;
  masterBeatGrid: BeatGridData | null;
  baseRate: number;
  currentRate: number;
  phaseError: number;
}

/**
 * SyncController - PLL-based phase sync for dual decks
 */
export class SyncController {
  private enabled: boolean = false;
  private slaveDeck: DeckId | null = null;
  private masterDeck: DeckId | null = null;
  private slaveBeatGrid: BeatGridData | null = null;
  private masterBeatGrid: BeatGridData | null = null;

  // PLL parameters
  private params: SyncParams = {
    Kp: 0.1, // Proportional gain (tune for responsiveness)
    Ki: 0.01, // Integral gain (accumulated error correction)
    maxRateDelta: 0.08, // Max ±8% rate deviation
    smoothing: 0.95, // EMA smoothing (95% previous, 5% new)
    beatNudgeThreshold: 0.08, // 80ms threshold for beat nudge
    integralDecay: 0.99, // Decay integral term to prevent windup
  };

  // Internal state
  private smoothedRate: number = 1.0;
  private integral: number = 0; // Integral term for PI controller
  private lastTickTime: number = 0; // Last tick time for dt calculation
  private lastSlaveBeatTime: number = 0; // Track time of last slave beat
  private lastMasterBeatTime: number = 0; // Track time of last master beat

  // Deck graph references (set by StudioEngine)
  private deckGraphs: Map<DeckId, DeckGraph> = new Map();

  // Cache keys for beat grids (set by StudioEngine)
  private deckCacheKeys: Map<DeckId, string> = new Map();

  /**
   * Set deck graph references (called by StudioEngine)
   */
  setDeckGraph(deck: DeckId, graph: DeckGraph): void {
    this.deckGraphs.set(deck, graph);
  }

  /**
   * Set cache key for deck (used to retrieve beat grid)
   */
  setDeckCacheKey(deck: DeckId, cacheKey: string): void {
    this.deckCacheKeys.set(deck, cacheKey);
  }

  /**
   * Enable sync between slave and master decks
   *
   * @param deckSlave - Deck to sync (will have its rate adjusted)
   * @param deckMaster - Master deck (reference, rate stays fixed)
   */
  enable(deckSlave: DeckId, deckMaster: DeckId): void {
    if (this.enabled) {
      console.warn("[SyncController] Sync already enabled, disabling first");
      this.disable();
    }

    // Get beat grids from cache
    const beatGridService = getBeatGridService();
    const slaveCacheKey = this.deckCacheKeys.get(deckSlave);
    const masterCacheKey = this.deckCacheKeys.get(deckMaster);

    if (!slaveCacheKey || !masterCacheKey) {
      throw new Error(
        "[SyncController] Cache keys not set for decks. Ensure tracks are loaded with cache keys.",
      );
    }

    const slaveBeatGrid = beatGridService.getCached(slaveCacheKey);
    const masterBeatGrid = beatGridService.getCached(masterCacheKey);

    if (!slaveBeatGrid || !masterBeatGrid) {
      throw new Error(
        "[SyncController] Beat grids not available. Analyze beat grids before enabling sync.",
      );
    }

    // Validate beat grids have data
    if (
      slaveBeatGrid.beatTimestamps.length === 0 ||
      masterBeatGrid.beatTimestamps.length === 0
    ) {
      throw new Error("[SyncController] Beat grids are empty. Cannot sync.");
    }

    this.slaveDeck = deckSlave;
    this.masterDeck = deckMaster;
    this.slaveBeatGrid = slaveBeatGrid;
    this.masterBeatGrid = masterBeatGrid;

    // Calculate base rate (tempo ratio)
    const baseRate = masterBeatGrid.bpm / slaveBeatGrid.bpm;
    this.smoothedRate = baseRate;

    // Initialize beat tracking and PI controller state
    this.lastSlaveBeatTime = 0;
    this.lastMasterBeatTime = 0;
    this.integral = 0;
    this.lastTickTime = 0;

    this.enabled = true;

    console.log(
      `[SyncController] ✅ Sync enabled: ${deckSlave} -> ${deckMaster} (baseRate: ${baseRate.toFixed(3)})`,
    );
  }

  /**
   * Disable sync
   */
  disable(): void {
    if (!this.enabled) {
      return;
    }

    // Reset slave deck rate to 1.0
    if (this.slaveDeck) {
      const slaveGraph = this.deckGraphs.get(this.slaveDeck);
      if (slaveGraph) {
        slaveGraph.setRate(1.0);
      }
    }

    this.enabled = false;
    this.slaveDeck = null;
    this.masterDeck = null;
    this.slaveBeatGrid = null;
    this.masterBeatGrid = null;
    this.smoothedRate = 1.0;
    this.integral = 0;
    this.lastTickTime = 0;

    console.log("[SyncController] Sync disabled");
  }

  /**
   * Update sync (called from rAF loop)
   *
   * @param nowAudioTimeSec - Current AudioContext.currentTime in seconds
   */
  tick(nowAudioTimeSec: number): void {
    if (!this.enabled || !this.slaveDeck || !this.masterDeck) {
      return;
    }

    if (!this.slaveBeatGrid || !this.masterBeatGrid) {
      return;
    }

    const slaveGraph = this.deckGraphs.get(this.slaveDeck);
    const masterGraph = this.deckGraphs.get(this.masterDeck);

    if (!slaveGraph || !masterGraph) {
      return;
    }

    // Both decks must be playing
    if (slaveGraph.state !== "playing" || masterGraph.state !== "playing") {
      return;
    }

    // Calculate dt (time since last tick) for integral term
    const dt =
      this.lastTickTime > 0 ? nowAudioTimeSec - this.lastTickTime : 0.016; // Default to ~60fps
    this.lastTickTime = nowAudioTimeSec;

    // Get current track positions
    const slaveTrackTime = slaveGraph.currentTime;
    const masterTrackTime = masterGraph.currentTime;

    // Find nearest beats at current positions
    const nearestMasterBeat = this.findNearestBeat(
      masterTrackTime,
      this.masterBeatGrid.beatTimestamps,
    );
    const nearestSlaveBeat = this.findNearestBeat(
      slaveTrackTime,
      this.slaveBeatGrid.beatTimestamps,
    );

    // Calculate base rate (tempo ratio)
    const baseRate = this.masterBeatGrid.bpm / this.slaveBeatGrid.bpm;

    // Calculate phase error:
    // We want slave beats to align with master beats in real time
    //
    // At current positions:
    // - Master is at track time M, nearest beat is at M_beat
    // - Slave is at track time S, nearest beat is at S_beat
    //
    // To align beats in real time:
    // - Master beat occurs at: M_beat / 1.0 (since master rate = 1.0)
    // - Slave beat occurs at: S_beat / slaveRate
    // - We want: S_beat / slaveRate = M_beat / 1.0
    // - So: slaveRate = S_beat / M_beat
    //
    // But we're working with offsets from current position:
    // - masterOffset = M - M_beat (time until next/from last master beat)
    // - slaveOffset = S - S_beat (time until next/from last slave beat)
    //
    // Phase error: difference between slave offset and where it should be
    // to align with master. We normalize by accounting for tempo:
    const masterBeatInterval = 60 / this.masterBeatGrid.bpm; // seconds per beat
    const slaveBeatInterval = 60 / this.slaveBeatGrid.bpm; // seconds per beat

    // Offset from current track time to nearest beat
    // Positive = past the beat, negative = before the beat
    const masterOffset = masterTrackTime - nearestMasterBeat;
    const slaveOffset = slaveTrackTime - nearestSlaveBeat;

    // Phase error: difference in beat alignment
    // To align beats, slaveOffset should equal masterOffset (in their respective tempo spaces)
    // But we need to account for tempo difference:
    // - Convert master offset to slave tempo: masterOffset * (slaveBPM / masterBPM) = masterOffset / baseRate
    // - Error = slaveOffset - (masterOffset / baseRate)
    // - Normalize by slave beat interval to get error in seconds
    const phaseErrorSec =
      (slaveOffset - masterOffset / baseRate) * slaveBeatInterval;

    // PI Controller: P term + I term
    // P term: proportional to current error
    const pTerm = this.params.Kp * phaseErrorSec;

    // I term: integral of error over time (accumulated error)
    // Apply decay to prevent integral windup
    this.integral =
      this.integral * this.params.integralDecay + phaseErrorSec * dt;
    const iTerm = this.params.Ki * this.integral;

    // Total correction
    const correction = pTerm + iTerm;
    const correctedRate = baseRate + correction;

    // Clamp to prevent excessive rate changes (bounded correction)
    const clampedRate = Math.max(
      baseRate - this.params.maxRateDelta,
      Math.min(baseRate + this.params.maxRateDelta, correctedRate),
    );

    // Apply EMA smoothing to prevent warble (smooth rate transitions)
    this.smoothedRate =
      this.params.smoothing * this.smoothedRate +
      (1 - this.params.smoothing) * clampedRate;

    // Apply to slave deck
    slaveGraph.setRate(this.smoothedRate);

    // Beat-boundary nudge if phase error exceeds threshold
    if (Math.abs(phaseErrorSec) > this.params.beatNudgeThreshold) {
      this.performBeatNudge(
        slaveGraph,
        masterGraph,
        phaseErrorSec,
        slaveBeatInterval,
      );
    }
  }

  /**
   * Set PLL parameters
   */
  setParams(params: Partial<SyncParams>): void {
    this.params = { ...this.params, ...params };
    console.log("[SyncController] Parameters updated:", this.params);
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    const baseRate =
      this.masterBeatGrid && this.slaveBeatGrid
        ? this.masterBeatGrid.bpm / this.slaveBeatGrid.bpm
        : 1.0;

    return {
      enabled: this.enabled,
      slaveDeck: this.slaveDeck,
      masterDeck: this.masterDeck,
      slaveBeatGrid: this.slaveBeatGrid,
      masterBeatGrid: this.masterBeatGrid,
      baseRate,
      currentRate: this.smoothedRate,
      phaseError: 0, // Would need to compute this in getState() if needed
    };
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  /**
   * Perform beat-boundary nudge to align slave with master
   *
   * When phase error is too large (>threshold), this nudges the slave deck
   * to the nearest beat that aligns with the master beat.
   */
  private performBeatNudge(
    slaveGraph: DeckGraph,
    masterGraph: DeckGraph,
    phaseErrorSec: number,
    slaveBeatInterval: number,
  ): void {
    // Find the target slave beat that should align with current master beat
    const masterTrackTime = masterGraph.currentTime;
    const slaveTrackTime = slaveGraph.currentTime;

    // Calculate how many beats to nudge
    const beatsToNudge = Math.round(phaseErrorSec / slaveBeatInterval);

    if (Math.abs(beatsToNudge) === 0) {
      return; // No nudge needed
    }

    // Find target slave beat
    const currentSlaveBeat = this.findNearestBeat(
      slaveTrackTime,
      this.slaveBeatGrid!.beatTimestamps,
    );

    const targetSlaveBeat = currentSlaveBeat + beatsToNudge * slaveBeatInterval;

    // Clamp to valid range
    const beatTimestamps = this.slaveBeatGrid!.beatTimestamps;
    if (beatTimestamps.length === 0) {
      return;
    }

    const clampedBeat = Math.max(
      beatTimestamps[0],
      Math.min(beatTimestamps[beatTimestamps.length - 1], targetSlaveBeat),
    );

    // Perform actual beat-boundary nudge
    console.log(
      `[SyncController] Beat nudge: ${beatsToNudge > 0 ? "+" : ""}${beatsToNudge} beats ` +
        `(${phaseErrorSec.toFixed(3)}s error)`,
    );

    // Use DeckGraph.seek() to nudge to target beat
    try {
      slaveGraph.seek(clampedBeat);
      console.log(
        `[SyncController] ✅ Nudged to beat ${clampedBeat.toFixed(3)}s`,
      );
    } catch (error) {
      console.warn("[SyncController] Nudge failed:", error);
    }

    // Reset integral to prevent windup after nudge
    this.integral = 0;
  }

  /**
   * Find nearest beat to a given track time
   */
  private findNearestBeat(trackTime: number, beatTimestamps: number[]): number {
    if (beatTimestamps.length === 0) {
      return trackTime;
    }

    // Binary search for nearest beat
    let left = 0;
    let right = beatTimestamps.length - 1;
    let nearest = beatTimestamps[0];

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midBeat = beatTimestamps[mid];

      if (Math.abs(midBeat - trackTime) < Math.abs(nearest - trackTime)) {
        nearest = midBeat;
      }

      if (midBeat < trackTime) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return nearest;
  }
}
