/**
 * mixer-processor.js - Audio Worklet Mixer Processor
 *
 * Phase 4: Real-time dual-deck mixer with SharedArrayBuffer control plane
 *
 * Features:
 * - Equal-power crossfader (cos/sin curve)
 * - Dual input mixing: input[0]=DeckA, input[1]=DeckB
 * - Per-deck gain multipliers
 * - Zero allocations in process() loop
 *
 * Memory Layout (see ControlLayout.ts):
 * - Int32Array: Transport commands (atomic)
 * - Float32Array: Continuous controls (crossfader, gains, EQ)
 */

// Memory layout constants (must match ControlLayout.ts exactly)
const INT32_OFFSET = {
  DECK_A_TRANSPORT: 0,
  DECK_B_TRANSPORT: 3,
};

const FLOAT32_OFFSET = {
  CROSSFADER: 0,
  DECK_A_GAIN: 1,
  DECK_A_RATE: 2,
  DECK_A_EQ_LOW: 3,
  DECK_A_EQ_MID: 4,
  DECK_A_EQ_HIGH: 5,
  DECK_B_GAIN: 8,
  DECK_B_RATE: 9,
  DECK_B_EQ_LOW: 10,
  DECK_B_EQ_MID: 11,
  DECK_B_EQ_HIGH: 12,
};

const INT32_ELEMENT_COUNT = 16;
const FLOAT32_BYTE_OFFSET = INT32_ELEMENT_COUNT * 4; // 64 bytes

// Mathematical constants (pre-computed for performance)
const HALF_PI = Math.PI * 0.5;

class MixerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // Control block views (null until INIT received)
    this.sab = null;
    this.ints = null;
    this.floats = null;
    this.initialized = false;

    // Pre-allocated state (zero allocations in process loop)
    this.lastCrossfader = 0.5;
    this.lastDeckAGain = 0.8;
    this.lastDeckBGain = 0.8;

    // Pre-computed gain curves (updated per-frame, not per-sample)
    this.gainA = 0.707; // cos(45°) for center position
    this.gainB = 0.707; // sin(45°) for center position

    // Listen for initialization message
    this.port.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    console.log("[MixerProcessor] Created, waiting for INIT message...");
  }

  /**
   * Handle messages from main thread
   * Only INIT message is expected (one-time)
   */
  handleMessage(msg) {
    if (msg.kind === "INIT") {
      try {
        if (!(msg.sab instanceof SharedArrayBuffer)) {
          throw new Error("Invalid SharedArrayBuffer in INIT message");
        }

        // Create typed array views over SharedArrayBuffer
        this.sab = msg.sab;
        this.ints = new Int32Array(this.sab, 0, INT32_ELEMENT_COUNT);
        this.floats = new Float32Array(this.sab, FLOAT32_BYTE_OFFSET);
        this.initialized = true;

        console.log(
          "[MixerProcessor] ✓ Initialized with SharedArrayBuffer control block",
        );

        // Send ready acknowledgment
        this.port.postMessage({
          kind: "READY",
          success: true,
        });
      } catch (error) {
        console.error("[MixerProcessor] ❌ Initialization failed:", error);
        this.port.postMessage({
          kind: "ERROR",
          error: error.message || String(error),
          timestamp: currentTime,
        });
      }
    }
  }

  /**
   * Compute equal-power crossfader gains
   *
   * Equal-power law ensures constant perceived loudness:
   * - gainA = cos(crossfader * π/2)
   * - gainB = sin(crossfader * π/2)
   *
   * At center (0.5): both = 0.707 (-3dB)
   * At full A (0.0): gainA=1.0, gainB=0.0
   * At full B (1.0): gainA=0.0, gainB=1.0
   *
   * @param {number} crossfader - 0.0 to 1.0
   */
  updateCrossfaderGains(crossfader) {
    // Clamp to valid range
    const x = Math.max(0.0, Math.min(1.0, crossfader));

    // Equal-power law
    this.gainA = Math.cos(x * HALF_PI);
    this.gainB = Math.sin(x * HALF_PI);
  }

  /**
   * Audio processing loop
   *
   * CRITICAL: Zero allocations here!
   * - No new arrays, objects, or closures
   * - All state pre-allocated in constructor
   * - Read controls from SharedArrayBuffer (zero-copy)
   *
   * @param {Float32Array[][]} inputs - [DeckA, DeckB] with [L, R] channels each
   * @param {Float32Array[][]} outputs - Stereo output [L, R]
   * @param {Object} parameters - Unused (we use SAB instead)
   * @returns {boolean} - true to keep processor alive
   */
  process(inputs, outputs, parameters) {
    // Defensive: If not initialized, output silence
    if (!this.initialized) {
      return true; // Keep alive, waiting for INIT
    }

    // Get output buffer (should be stereo)
    const output = outputs[0];
    if (!output || output.length < 2) {
      return true; // No output configured yet
    }

    const outputLeft = output[0];
    const outputRight = output[1];
    const frameCount = outputLeft.length;

    // Read control values from SharedArrayBuffer (zero-copy, lock-free)
    const crossfader = this.floats[FLOAT32_OFFSET.CROSSFADER];
    const deckAGain = this.floats[FLOAT32_OFFSET.DECK_A_GAIN];
    const deckBGain = this.floats[FLOAT32_OFFSET.DECK_B_GAIN];

    // Update crossfader gains if changed (per-frame, not per-sample)
    if (crossfader !== this.lastCrossfader) {
      this.updateCrossfaderGains(crossfader);
      this.lastCrossfader = crossfader;
    }

    // Cache deck gains
    this.lastDeckAGain = deckAGain;
    this.lastDeckBGain = deckBGain;

    // Final gain multipliers
    const finalGainA = this.gainA * deckAGain;
    const finalGainB = this.gainB * deckBGain;

    // Get input buffers
    const deckA = inputs[0]; // Deck A input
    const deckB = inputs[1]; // Deck B input

    // Mix decks with crossfader
    // Handle cases where inputs might not be ready
    const hasA = deckA && deckA.length >= 2;
    const hasB = deckB && deckB.length >= 2;

    if (hasA && hasB) {
      // Both decks available - full mix
      const deckALeft = deckA[0];
      const deckARight = deckA[1];
      const deckBLeft = deckB[0];
      const deckBRight = deckB[1];

      // Per-sample mixing (zero allocations)
      for (let i = 0; i < frameCount; ++i) {
        outputLeft[i] = deckALeft[i] * finalGainA + deckBLeft[i] * finalGainB;
        outputRight[i] =
          deckARight[i] * finalGainA + deckBRight[i] * finalGainB;
      }
    } else if (hasA) {
      // Only Deck A available
      const deckALeft = deckA[0];
      const deckARight = deckA[1];

      for (let i = 0; i < frameCount; ++i) {
        outputLeft[i] = deckALeft[i] * finalGainA;
        outputRight[i] = deckARight[i] * finalGainA;
      }
    } else if (hasB) {
      // Only Deck B available
      const deckBLeft = deckB[0];
      const deckBRight = deckB[1];

      for (let i = 0; i < frameCount; ++i) {
        outputLeft[i] = deckBLeft[i] * finalGainB;
        outputRight[i] = deckBRight[i] * finalGainB;
      }
    } else {
      // No inputs - output silence
      for (let i = 0; i < frameCount; ++i) {
        outputLeft[i] = 0;
        outputRight[i] = 0;
      }
    }

    return true; // Keep processor alive
  }
}

// Register the processor
registerProcessor("mixer-processor", MixerProcessor);
