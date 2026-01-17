/**
 * ControlBus.ts - SharedArrayBuffer Control Bus
 *
 * Phase 4: High-frequency control communication via SharedArrayBuffer
 *
 * Provides a clean TypeScript API for UI code to update audio controls
 * without postMessage spam. Uses SharedArrayBuffer + Atomics for
 * lock-free, high-frequency updates (60fps+).
 *
 * Constraints:
 * - Requires crossOriginIsolated=true
 * - Zero allocations in audio thread
 * - Thread-safe via Atomics for transport commands
 */

import {
  ControlBlockViews,
  DeckId,
  EQBand,
  TransportCommand,
  TOTAL_SAB_BYTES,
  FLOAT32_BYTE_OFFSET,
  INT32_OFFSET,
  FLOAT32_OFFSET,
  INT32_ELEMENT_COUNT,
  FLOAT32_ELEMENT_COUNT,
  DEFAULT_CONTROLS,
} from "./ControlLayout";

/**
 * Create a shared control block with initialized default values
 *
 * @throws Error if SharedArrayBuffer is not available or crossOriginIsolated is false
 * @returns ControlBlockViews with sab, ints, and floats typed arrays
 */
export function createSharedControlBlock(): ControlBlockViews {
  // Check for SharedArrayBuffer support
  if (typeof SharedArrayBuffer === "undefined") {
    throw new Error(
      "[ControlBus] SharedArrayBuffer is not available in this browser. " +
        "Please use a modern browser that supports SharedArrayBuffer.",
    );
  }

  // CRITICAL: Check for crossOriginIsolated
  if (typeof crossOriginIsolated !== "undefined" && !crossOriginIsolated) {
    throw new Error(
      "[ControlBus] SharedArrayBuffer requires crossOriginIsolated=true. " +
        "Ensure COOP and COEP headers are set correctly:\n" +
        "  Cross-Origin-Opener-Policy: same-origin\n" +
        "  Cross-Origin-Embedder-Policy: require-corp",
    );
  }

  // Allocate SharedArrayBuffer
  const sab = new SharedArrayBuffer(TOTAL_SAB_BYTES);

  // Create typed array views
  const ints = new Int32Array(sab, 0, INT32_ELEMENT_COUNT);
  const floats = new Float32Array(
    sab,
    FLOAT32_BYTE_OFFSET,
    FLOAT32_ELEMENT_COUNT,
  );

  // Initialize with default values
  initializeControlBlock(ints, floats);

  console.log(
    `[ControlBus] Created SharedArrayBuffer control block (${TOTAL_SAB_BYTES} bytes)`,
  );

  return { sab, ints, floats };
}

/**
 * Initialize control block with default values
 */
function initializeControlBlock(ints: Int32Array, floats: Float32Array): void {
  // Initialize transport states
  Atomics.store(
    ints,
    INT32_OFFSET.DECK_A_TRANSPORT,
    DEFAULT_CONTROLS.transport,
  );
  Atomics.store(
    ints,
    INT32_OFFSET.DECK_B_TRANSPORT,
    DEFAULT_CONTROLS.transport,
  );

  // Initialize float controls
  floats[FLOAT32_OFFSET.CROSSFADER] = DEFAULT_CONTROLS.crossfader;

  // Deck A
  floats[FLOAT32_OFFSET.DECK_A_GAIN] = DEFAULT_CONTROLS.deckGain;
  floats[FLOAT32_OFFSET.DECK_A_RATE] = DEFAULT_CONTROLS.deckRate;
  floats[FLOAT32_OFFSET.DECK_A_EQ_LOW] = DEFAULT_CONTROLS.eqGain;
  floats[FLOAT32_OFFSET.DECK_A_EQ_MID] = DEFAULT_CONTROLS.eqGain;
  floats[FLOAT32_OFFSET.DECK_A_EQ_HIGH] = DEFAULT_CONTROLS.eqGain;

  // Deck B
  floats[FLOAT32_OFFSET.DECK_B_GAIN] = DEFAULT_CONTROLS.deckGain;
  floats[FLOAT32_OFFSET.DECK_B_RATE] = DEFAULT_CONTROLS.deckRate;
  floats[FLOAT32_OFFSET.DECK_B_EQ_LOW] = DEFAULT_CONTROLS.eqGain;
  floats[FLOAT32_OFFSET.DECK_B_EQ_MID] = DEFAULT_CONTROLS.eqGain;
  floats[FLOAT32_OFFSET.DECK_B_EQ_HIGH] = DEFAULT_CONTROLS.eqGain;
}

/**
 * ControlBus - High-level API for updating controls
 *
 * Wraps typed array access with a clean, type-safe API.
 * All methods are designed for high-frequency updates (60fps+).
 */
export class ControlBus {
  private ints: Int32Array;
  private floats: Float32Array;

  constructor(views: ControlBlockViews) {
    this.ints = views.ints;
    this.floats = views.floats;
  }

  // ==========================================================================
  // CROSSFADER
  // ==========================================================================

  /**
   * Set crossfader position
   * @param value - 0.0 = full deck A, 1.0 = full deck B
   */
  setCrossfader(value: number): void {
    this.floats[FLOAT32_OFFSET.CROSSFADER] = Math.max(0, Math.min(1, value));
  }

  /**
   * Get current crossfader position
   */
  getCrossfader(): number {
    return this.floats[FLOAT32_OFFSET.CROSSFADER];
  }

  // ==========================================================================
  // DECK GAIN
  // ==========================================================================

  /**
   * Set deck master gain
   * @param deck - 'A' or 'B'
   * @param gain - 0.0 to 1.0 (linear)
   */
  setDeckGain(deck: DeckId, gain: number): void {
    const offset =
      deck === "A" ? FLOAT32_OFFSET.DECK_A_GAIN : FLOAT32_OFFSET.DECK_B_GAIN;
    this.floats[offset] = Math.max(0, Math.min(1, gain));
  }

  /**
   * Get deck master gain
   */
  getDeckGain(deck: DeckId): number {
    const offset =
      deck === "A" ? FLOAT32_OFFSET.DECK_A_GAIN : FLOAT32_OFFSET.DECK_B_GAIN;
    return this.floats[offset];
  }

  // ==========================================================================
  // DECK RATE (PLAYBACK SPEED)
  // ==========================================================================

  /**
   * Set deck playback rate
   * @param deck - 'A' or 'B'
   * @param rate - 0.5 to 2.0 (1.0 = normal speed)
   */
  setDeckRate(deck: DeckId, rate: number): void {
    const offset =
      deck === "A" ? FLOAT32_OFFSET.DECK_A_RATE : FLOAT32_OFFSET.DECK_B_RATE;
    this.floats[offset] = Math.max(0.5, Math.min(2.0, rate));
  }

  /**
   * Get deck playback rate
   */
  getDeckRate(deck: DeckId): number {
    const offset =
      deck === "A" ? FLOAT32_OFFSET.DECK_A_RATE : FLOAT32_OFFSET.DECK_B_RATE;
    return this.floats[offset];
  }

  // ==========================================================================
  // EQ CONTROLS
  // ==========================================================================

  /**
   * Set EQ band gain
   * @param deck - 'A' or 'B'
   * @param band - 'low', 'mid', or 'high'
   * @param gain - Linear gain (0.0 to 2.0, where 1.0 = 0dB, 0.0 = -inf dB, 2.0 = +6dB)
   */
  setEQ(deck: DeckId, band: EQBand, gain: number): void {
    const baseOffset =
      deck === "A"
        ? FLOAT32_OFFSET.DECK_A_EQ_LOW
        : FLOAT32_OFFSET.DECK_B_EQ_LOW;
    const bandOffset = band === "low" ? 0 : band === "mid" ? 1 : 2;
    const offset = baseOffset + bandOffset;

    this.floats[offset] = Math.max(0, Math.min(2, gain));
  }

  /**
   * Get EQ band gain
   */
  getEQ(deck: DeckId, band: EQBand): number {
    const baseOffset =
      deck === "A"
        ? FLOAT32_OFFSET.DECK_A_EQ_LOW
        : FLOAT32_OFFSET.DECK_B_EQ_LOW;
    const bandOffset = band === "low" ? 0 : band === "mid" ? 1 : 2;
    const offset = baseOffset + bandOffset;

    return this.floats[offset];
  }

  /**
   * Set all EQ bands at once (convenience method)
   */
  setAllEQ(deck: DeckId, low: number, mid: number, high: number): void {
    this.setEQ(deck, "low", low);
    this.setEQ(deck, "mid", mid);
    this.setEQ(deck, "high", high);
  }

  // ==========================================================================
  // TRANSPORT CONTROLS (ATOMIC)
  // ==========================================================================

  /**
   * Set transport command (thread-safe via Atomics)
   * @param deck - 'A' or 'B'
   * @param command - TransportCommand (STOP, PLAY, PAUSE)
   */
  setTransport(deck: DeckId, command: TransportCommand): void {
    const offset =
      deck === "A"
        ? INT32_OFFSET.DECK_A_TRANSPORT
        : INT32_OFFSET.DECK_B_TRANSPORT;
    Atomics.store(this.ints, offset, command);
  }

  /**
   * Get current transport state
   */
  getTransport(deck: DeckId): TransportCommand {
    const offset =
      deck === "A"
        ? INT32_OFFSET.DECK_A_TRANSPORT
        : INT32_OFFSET.DECK_B_TRANSPORT;
    return Atomics.load(this.ints, offset) as TransportCommand;
  }

  /**
   * Play deck (convenience method)
   */
  play(deck: DeckId): void {
    this.setTransport(deck, TransportCommand.PLAY);
  }

  /**
   * Pause deck (convenience method)
   */
  pause(deck: DeckId): void {
    this.setTransport(deck, TransportCommand.PAUSE);
  }

  /**
   * Stop deck (convenience method)
   */
  stop(deck: DeckId): void {
    this.setTransport(deck, TransportCommand.STOP);
  }

  // ==========================================================================
  // BULK OPERATIONS
  // ==========================================================================

  /**
   * Reset all controls to defaults
   */
  reset(): void {
    initializeControlBlock(this.ints, this.floats);
  }

  /**
   * Get a snapshot of all current control values (for debugging)
   */
  snapshot(): Record<string, number> {
    return {
      crossfader: this.getCrossfader(),
      deckA_gain: this.getDeckGain("A"),
      deckA_rate: this.getDeckRate("A"),
      deckA_eq_low: this.getEQ("A", "low"),
      deckA_eq_mid: this.getEQ("A", "mid"),
      deckA_eq_high: this.getEQ("A", "high"),
      deckA_transport: this.getTransport("A"),
      deckB_gain: this.getDeckGain("B"),
      deckB_rate: this.getDeckRate("B"),
      deckB_eq_low: this.getEQ("B", "low"),
      deckB_eq_mid: this.getEQ("B", "mid"),
      deckB_eq_high: this.getEQ("B", "high"),
      deckB_transport: this.getTransport("B"),
    };
  }
}
