/**
 * FX Utilities
 * Helper functions for creating audio effects
 */

/**
 * Create a flanger effect using delay and LFO
 */
export function createFlanger(
  audioContext: AudioContext,
  rate: number = 0.5, // LFO rate in Hz
  depth: number = 0.5, // Modulation depth (0-1)
  delay: number = 0.003, // Base delay in seconds
  feedback: number = 0.3, // Feedback amount (0-1)
): {
  delayNode: DelayNode;
  gainNode: GainNode;
  oscillator: OscillatorNode;
  lfoGain: GainNode;
} {
  // Create delay node
  const delayNode = audioContext.createDelay(0.02); // Max 20ms delay
  delayNode.delayTime.value = delay;

  // Create feedback gain
  const feedbackGain = audioContext.createGain();
  feedbackGain.gain.value = feedback;

  // Create LFO for modulation
  const oscillator = audioContext.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = rate;

  // LFO gain controls modulation depth
  const lfoGain = audioContext.createGain();
  lfoGain.gain.value = depth * 0.01; // Scale to 0-10ms modulation

  // Connect LFO to delay time
  oscillator.connect(lfoGain);
  lfoGain.connect(delayNode.delayTime);

  // Connect feedback loop
  delayNode.connect(feedbackGain);
  feedbackGain.connect(delayNode);

  // Output gain
  const outputGain = audioContext.createGain();
  delayNode.connect(outputGain);

  // Start LFO
  oscillator.start();

  return {
    delayNode,
    gainNode: outputGain,
    oscillator,
    lfoGain,
  };
}

/**
 * Create a phaser effect using allpass filters
 */
export function createPhaser(
  audioContext: AudioContext,
  rate: number = 0.5, // LFO rate in Hz
  depth: number = 0.5, // Modulation depth (0-1)
  stages: number = 4, // Number of allpass filter stages
): {
  filters: BiquadFilterNode[];
  oscillator: OscillatorNode;
  lfoGain: GainNode;
} {
  const filters: BiquadFilterNode[] = [];
  const baseFreq = 350; // Base frequency in Hz

  // Create allpass filters
  for (let i = 0; i < stages; i++) {
    const filter = audioContext.createBiquadFilter();
    filter.type = "allpass";
    filter.frequency.value = baseFreq + i * 100;
    filter.Q.value = 1;
    filters.push(filter);
  }

  // Create LFO
  const oscillator = audioContext.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = rate;

  const lfoGain = audioContext.createGain();
  lfoGain.gain.value = depth * 1000; // Scale modulation

  // Connect LFO to all filters
  oscillator.connect(lfoGain);
  filters.forEach((filter) => {
    lfoGain.connect(filter.frequency);
  });

  oscillator.start();

  return { filters, oscillator, lfoGain };
}

/**
 * Create a chorus effect using delay and LFO
 */
export function createChorus(
  audioContext: AudioContext,
  rate: number = 1.5, // LFO rate in Hz
  depth: number = 0.5, // Modulation depth (0-1)
  delay: number = 0.02, // Base delay in seconds
  feedback: number = 0.2, // Feedback amount (0-1)
): {
  delayNode: DelayNode;
  gainNode: GainNode;
  oscillator: OscillatorNode;
  lfoGain: GainNode;
  feedbackGain: GainNode;
} {
  // Create delay node
  const delayNode = audioContext.createDelay(0.05); // Max 50ms delay
  delayNode.delayTime.value = delay;

  // Create feedback gain
  const feedbackGain = audioContext.createGain();
  feedbackGain.gain.value = feedback;

  // Create LFO
  const oscillator = audioContext.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = rate;

  // LFO gain
  const lfoGain = audioContext.createGain();
  lfoGain.gain.value = depth * 0.02; // Scale to 0-20ms modulation

  // Connect LFO to delay time
  oscillator.connect(lfoGain);
  lfoGain.connect(delayNode.delayTime);

  // Connect feedback
  delayNode.connect(feedbackGain);
  feedbackGain.connect(delayNode);

  // Output gain
  const outputGain = audioContext.createGain();
  delayNode.connect(outputGain);

  oscillator.start();

  return {
    delayNode,
    gainNode: outputGain,
    oscillator,
    lfoGain,
    feedbackGain,
  };
}

/**
 * Create an echo effect (multi-tap delay)
 */
export function createEcho(
  audioContext: AudioContext,
  delayTime: number = 0.25, // Delay time in seconds
  feedback: number = 0.3, // Feedback amount (0-1)
  taps: number = 3, // Number of echo taps
): { delayNodes: DelayNode[]; gainNodes: GainNode[]; feedbackGain: GainNode } {
  const delayNodes: DelayNode[] = [];
  const gainNodes: GainNode[] = [];

  // Create feedback gain
  const feedbackGain = audioContext.createGain();
  feedbackGain.gain.value = feedback;

  // Create multiple delay taps
  for (let i = 0; i < taps; i++) {
    const delay = audioContext.createDelay(2.0); // Max 2 second delay
    delay.delayTime.value = delayTime * (i + 1); // Each tap is progressively longer

    const gain = audioContext.createGain();
    gain.gain.value = Math.pow(feedback, i + 1); // Each tap gets quieter

    delayNodes.push(delay);
    gainNodes.push(gain);

    // Connect delay to gain
    delay.connect(gain);
  }

  // Connect feedback from last tap
  if (delayNodes.length > 0) {
    delayNodes[delayNodes.length - 1].connect(feedbackGain);
    feedbackGain.connect(delayNodes[0]);
  }

  return { delayNodes, gainNodes, feedbackGain };
}
