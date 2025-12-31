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

/**
 * Calculate constant-power gain values for dual-console mixing
 *
 * Console A (Artist): Route through artistMasterGain
 * Console B (Vault): Processed via Worker and routed through vaultMasterGain
 *
 * @param crossfaderPosition - Position from 0.0 (Console A full) to 1.0 (Console B full)
 * @returns Object with gainA and gainB values (0.0 to 1.0)
 */
export function calculateConstantPowerGains(crossfaderPosition: number): {
  gainA: number;
  gainB: number;
} {
  // Clamp to valid range
  const x = Math.max(0, Math.min(1, crossfaderPosition));

  // Constant-power curve using cosine/sine
  // When x = 0: gainA = cos(0) = 1.0, gainB = sin(0) = 0.0 (Console A full)
  // When x = 0.5: gainA = cos(π/4) = 0.707, gainB = sin(π/4) = 0.707 (Equal power)
  // When x = 1.0: gainA = cos(π/2) = 0.0, gainB = sin(π/2) = 1.0 (Console B full)
  const gainA = Math.cos(x * Math.PI / 2);
  const gainB = Math.sin(x * Math.PI / 2);

  return { gainA, gainB };
}

/**
 * Apply constant-power gains to GainNode instances
 *
 * @param gainNodeA - GainNode for Deck A
 * @param gainNodeB - GainNode for Deck B
 * @param crossfaderPosition - Position from 0.0 to 1.0
 * @param audioContext - AudioContext for scheduling
 * @param rampTime - Optional ramp time in seconds (default: 0.01 for smooth transitions)
 */
export function applyConstantPowerGains(
  gainNodeA: GainNode,
  gainNodeB: GainNode,
  crossfaderPosition: number,
  audioContext: AudioContext,
  rampTime: number = 0.01
): void {
  const { gainA, gainB } = calculateConstantPowerGains(crossfaderPosition);
  const currentTime = audioContext.currentTime;

  // Apply gains with smooth ramping to prevent clicks/pops
  gainNodeA.gain.setTargetAtTime(gainA, currentTime, rampTime);
  gainNodeB.gain.setTargetAtTime(gainB, currentTime, rampTime);
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
  masterDestination: AudioNode
): {
  gainNodeA: GainNode;
  gainNodeB: GainNode;
} {
  // Create gain nodes for each deck
  const gainNodeA = audioContext.createGain();
  const gainNodeB = audioContext.createGain();

  // Initialize to center position (equal power)
  gainNodeA.gain.value = Math.cos(0.5 * Math.PI / 2); // cos(π/4) ≈ 0.707
  gainNodeB.gain.value = Math.sin(0.5 * Math.PI / 2); // sin(π/4) ≈ 0.707

  // Connect both to master destination
  gainNodeA.connect(masterDestination);
  gainNodeB.connect(masterDestination);

  return { gainNodeA, gainNodeB };
}

