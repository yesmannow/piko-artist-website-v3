/**
 * Constant-Power Signal Splitter
 *
 * Professional audio mixing uses constant-power crossfading to prevent
 * volume dips and phase cancellation when blending between two sources.
 *
 * Formula: cos(position * π/2) for Console A, sin(position * π/2) for Console B
 * where position is the crossfader position (0.0 to 1.0)
 *
 * This ensures the total power remains constant regardless of fader position.
 * At the mid-point (0.5), both consoles maintain equal volume.
 */

export type CrossfaderCurve = "linear" | "constant-power" | "sharp" | "smooth";

/**
 * Calculate gain values based on crossfader curve type
 *
 * @param crossfaderPosition - Position from 0.0 (Console A full) to 1.0 (Console B full)
 * @param curve - Crossfader curve type
 * @returns Object with gainA and gainB values (0.0 to 1.0)
 */
export function calculateCrossfaderGains(
  crossfaderPosition: number,
  curve: CrossfaderCurve = "constant-power",
): {
  gainA: number;
  gainB: number;
} {
  // Clamp to valid range
  const x = Math.max(0, Math.min(1, crossfaderPosition));

  switch (curve) {
    case "linear":
      // Simple linear fade (can cause volume dip at center)
      return {
        gainA: 1 - x,
        gainB: x,
      };

    case "constant-power":
      // Equal-power curve using cosine/sine (default, professional standard)
      // When x = 0: gainA = cos(0) = 1.0, gainB = sin(0) = 0.0 (Console A full)
      // When x = 0.5: gainA = cos(π/4) = 0.707, gainB = sin(π/4) = 0.707 (Equal power)
      // When x = 1.0: gainA = cos(π/2) = 0.0, gainB = sin(π/2) = 1.0 (Console B full)
      return {
        gainA: Math.cos((x * Math.PI) / 2),
        gainB: Math.sin((x * Math.PI) / 2),
      };

    case "sharp":
      // Sharp cut (DJ-style) - faster transition near edges
      // Uses exponential curve for aggressive mixing
      const sharpA = Math.pow(1 - x, 2);
      const sharpB = Math.pow(x, 2);
      return {
        gainA: Math.sqrt(sharpA), // Normalize to avoid excessive volume drop
        gainB: Math.sqrt(sharpB),
      };

    case "smooth":
      // Extra smooth transition - slower in the middle
      // Uses S-curve (smoothstep) for very gradual blending
      const smoothX = x * x * (3 - 2 * x); // Smoothstep function
      return {
        gainA: Math.cos((smoothX * Math.PI) / 2),
        gainB: Math.sin((smoothX * Math.PI) / 2),
      };

    default:
      // Fallback to constant-power
      return {
        gainA: Math.cos((x * Math.PI) / 2),
        gainB: Math.sin((x * Math.PI) / 2),
      };
  }
}

/**
 * Calculate constant-power gain values for dual-console mixing
 *
 * Console A (Artist): Route through artistMasterGain
 * Console B (Vault): Processed via Worker and routed through vaultMasterGain
 *
 * @param crossfaderPosition - Position from 0.0 (Console A full) to 1.0 (Console B full)
 * @returns Object with gainA and gainB values (0.0 to 1.0)
 * @deprecated Use calculateCrossfaderGains with 'constant-power' curve instead
 */
export function calculateConstantPowerGains(crossfaderPosition: number): {
  gainA: number;
  gainB: number;
} {
  return calculateCrossfaderGains(crossfaderPosition, "constant-power");
}

/**
 * Apply crossfader gains to GainNode instances with curve selection
 *
 * @param gainNodeA - GainNode for Deck A
 * @param gainNodeB - GainNode for Deck B
 * @param crossfaderPosition - Position from 0.0 to 1.0
 * @param audioContext - AudioContext for scheduling
 * @param curve - Crossfader curve type (default: 'constant-power')
 * @param rampTime - Optional ramp time in seconds (default: 0.02 for smooth transitions)
 */
export function applyCrossfaderGains(
  gainNodeA: GainNode,
  gainNodeB: GainNode,
  crossfaderPosition: number,
  audioContext: AudioContext,
  curve: CrossfaderCurve = "constant-power",
  rampTime: number = 0.02,
): void {
  const { gainA, gainB } = calculateCrossfaderGains(crossfaderPosition, curve);
  const currentTime = audioContext.currentTime;

  // Apply gains with smooth ramping to prevent clicks/pops
  // Using 0.02s rampTime for professional-grade smooth transitions
  gainNodeA.gain.setTargetAtTime(gainA, currentTime, rampTime);
  gainNodeB.gain.setTargetAtTime(gainB, currentTime, rampTime);
}

/**
 * Apply constant-power gains to GainNode instances
 *
 * @param gainNodeA - GainNode for Deck A
 * @param gainNodeB - GainNode for Deck B
 * @param crossfaderPosition - Position from 0.0 to 1.0
 * @param audioContext - AudioContext for scheduling
 * @param rampTime - Optional ramp time in seconds (default: 0.02 for smooth transitions)
 * @deprecated Use applyCrossfaderGains with 'constant-power' curve instead
 */
export function applyConstantPowerGains(
  gainNodeA: GainNode,
  gainNodeB: GainNode,
  crossfaderPosition: number,
  audioContext: AudioContext,
  rampTime: number = 0.02,
): void {
  applyCrossfaderGains(
    gainNodeA,
    gainNodeB,
    crossfaderPosition,
    audioContext,
    "constant-power",
    rampTime,
  );
}

/**
 * Create a constant-power splitter node graph
 *
 * This sets up the routing:
 * Deck A -> GainNode A -> Master
 * Deck B -> GainNode B -> Master
 *
 * The gain nodes are controlled by the constant-power algorithm
 * based on crossfader position.
 *
 * @param audioContext - AudioContext instance
 * @param masterDestination - Destination node (typically masterGain or limiter)
 * @returns Object with gainNodeA and gainNodeB
 */
export function createConstantPowerSplitter(
  audioContext: AudioContext,
  masterDestination: AudioNode,
): {
  gainNodeA: GainNode;
  gainNodeB: GainNode;
} {
  // Create gain nodes for each deck
  const gainNodeA = audioContext.createGain();
  const gainNodeB = audioContext.createGain();

  // Initialize to center position (equal power)
  gainNodeA.gain.value = Math.cos((0.5 * Math.PI) / 2); // cos(π/4) ≈ 0.707
  gainNodeB.gain.value = Math.sin((0.5 * Math.PI) / 2); // sin(π/4) ≈ 0.707

  // Connect both to master destination
  gainNodeA.connect(masterDestination);
  gainNodeB.connect(masterDestination);

  return { gainNodeA, gainNodeB };
}
