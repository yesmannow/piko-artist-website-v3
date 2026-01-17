/**
 * ControlLayout.ts - SharedArrayBuffer Memory Layout
 *
 * Phase 4: Control plane memory layout for SAB-backed real-time controls
 *
 * This defines the exact memory layout for control data shared between
 * the UI thread and AudioWorklet processor via SharedArrayBuffer.
 *
 * Memory Layout:
 * - Int32Array section: Transport state, commands (atomic operations)
 * - Float32Array section: Continuous controls (crossfader, gains, EQ)
 *
 * Constraints:
 * - No allocations in worklet process loop
 * - All offsets are constants for compile-time optimization
 * - Atomic operations for transport commands
 */

// ============================================================================
// INT32 SECTION - Atomic transport controls
// ============================================================================

/**
 * Transport commands (atomic int operations)
 * 0 = stop, 1 = play, 2 = pause
 */
export const enum TransportCommand {
  STOP = 0,
  PLAY = 1,
  PAUSE = 2,
}

/**
 * Int32 array offsets
 */
export const INT32_OFFSET = {
  // Deck A transport
  DECK_A_TRANSPORT: 0, // TransportCommand
  DECK_A_RESERVED_1: 1, // Reserved for future use
  DECK_A_RESERVED_2: 2, // Reserved for future use

  // Deck B transport
  DECK_B_TRANSPORT: 3, // TransportCommand
  DECK_B_RESERVED_1: 4, // Reserved for future use
  DECK_B_RESERVED_2: 5, // Reserved for future use

  // Reserved for expansion
  RESERVED_START: 6,
  RESERVED_END: 15,
} as const;

/**
 * Total Int32 elements needed
 */
export const INT32_ELEMENT_COUNT = 16;

// ============================================================================
// FLOAT32 SECTION - Continuous controls
// ============================================================================

/**
 * Float32 array offsets
 */
export const FLOAT32_OFFSET = {
  // Master crossfader (0.0 = full A, 1.0 = full B)
  CROSSFADER: 0,

  // Deck A controls
  DECK_A_GAIN: 1, // Master gain (0.0 to 1.0)
  DECK_A_RATE: 2, // Playback rate (0.5 to 2.0, 1.0 = normal)
  DECK_A_EQ_LOW: 3, // EQ low band (-12dB to +12dB, stored as linear 0.0 to 2.0)
  DECK_A_EQ_MID: 4, // EQ mid band
  DECK_A_EQ_HIGH: 5, // EQ high band
  DECK_A_RESERVED_1: 6, // Reserved for future use
  DECK_A_RESERVED_2: 7, // Reserved for future use

  // Deck B controls
  DECK_B_GAIN: 8, // Master gain (0.0 to 1.0)
  DECK_B_RATE: 9, // Playback rate (0.5 to 2.0, 1.0 = normal)
  DECK_B_EQ_LOW: 10, // EQ low band
  DECK_B_EQ_MID: 11, // EQ mid band
  DECK_B_EQ_HIGH: 12, // EQ high band
  DECK_B_RESERVED_1: 13, // Reserved for future use
  DECK_B_RESERVED_2: 14, // Reserved for future use

  // Reserved for expansion
  RESERVED_START: 15,
  RESERVED_END: 31,
} as const;

/**
 * Total Float32 elements needed
 */
export const FLOAT32_ELEMENT_COUNT = 32;

// ============================================================================
// TOTAL MEMORY LAYOUT
// ============================================================================

/**
 * Total SharedArrayBuffer size in bytes
 *
 * Layout:
 * [Int32Array section: 16 elements * 4 bytes = 64 bytes]
 * [Float32Array section: 32 elements * 4 bytes = 128 bytes]
 * Total: 192 bytes
 */
export const TOTAL_SAB_BYTES =
  INT32_ELEMENT_COUNT * Int32Array.BYTES_PER_ELEMENT +
  FLOAT32_ELEMENT_COUNT * Float32Array.BYTES_PER_ELEMENT;

/**
 * Byte offset where Float32 section starts
 */
export const FLOAT32_BYTE_OFFSET =
  INT32_ELEMENT_COUNT * Int32Array.BYTES_PER_ELEMENT;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Deck identifier
 */
export type DeckId = "A" | "B";

/**
 * EQ band identifier
 */
export type EQBand = "low" | "mid" | "high";

/**
 * Control block views
 */
export interface ControlBlockViews {
  sab: SharedArrayBuffer;
  ints: Int32Array;
  floats: Float32Array;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Default control values (for initialization)
 */
export const DEFAULT_CONTROLS = {
  crossfader: 0.5, // Center position
  deckGain: 0.8, // 80% volume
  deckRate: 1.0, // Normal speed
  eqGain: 1.0, // Unity gain (0dB)
  transport: TransportCommand.STOP,
} as const;
