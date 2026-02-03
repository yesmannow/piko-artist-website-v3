/**
 * DeckFXChain - Per-Deck Effects Chain
 *
 * Provides isolated FX processing for each deck (A & B)
 * ensuring true hardware-style separation.
 *
 * Signal Flow:
 * Input -> Filter -> Reverb -> Delay -> Distortion -> Output
 */

/**
 * FX Chain State Interface
 */
export interface DeckFXState {
  filter: number;        // 0-1 (bipolar high-pass/low-pass)
  reverb: number;        // 0-1 (dry/wet mix)
  reverbDecay: number;   // 0-1 (decay time)
  delay: number;         // 0-1 (dry/wet mix)
  delayFeedback: number; // 0-1 (feedback amount)
  delayTime: number;     // 0-1 (delay time)
  distortion: number;    // 0-1 (drive amount)
}

/**
 * Default FX State (all off)
 */
export const DEFAULT_FX_STATE: DeckFXState = {
  filter: 0.5,        // Center (neutral)
  reverb: 0,          // Dry
  reverbDecay: 0.4,   // Medium decay
  delay: 0,           // Dry
  delayFeedback: 0.35, // Moderate feedback
  delayTime: 0.375,   // Dotted eighth note
  distortion: 0,      // Clean
};

/**
 * Create a simple reverb using convolver + gain
 * For production, replace with impulse response
 */
function createSimpleReverb(audioContext: AudioContext): {
  input: GainNode;
  output: GainNode;
  wetGain: GainNode;
  dryGain: GainNode;
  convolver: ConvolverNode;
} {
  const input = audioContext.createGain();
  const output = audioContext.createGain();
  const wetGain = audioContext.createGain();
  const dryGain = audioContext.createGain();
  const convolver = audioContext.createConvolver();

  // Create a simple impulse response (replace with real IR for production)
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * 2; // 2 second reverb
  const impulse = audioContext.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // Exponential decay with some randomness
      const decay = Math.exp(-i / (sampleRate * 0.4));
      channelData[i] = (Math.random() * 2 - 1) * decay;
    }
  }

  convolver.buffer = impulse;

  // Routing: input -> [dry, wet->convolver] -> output
  input.connect(dryGain);
  input.connect(convolver);
  convolver.connect(wetGain);
  dryGain.connect(output);
  wetGain.connect(output);

  // Default: 100% dry, 0% wet
  dryGain.gain.value = 1;
  wetGain.gain.value = 0;

  return { input, output, wetGain, dryGain, convolver };
}

/**
 * Create stereo feedback delay
 */
function createStereoDelay(audioContext: AudioContext, bpm: number = 128): {
  input: GainNode;
  output: GainNode;
  wetGain: GainNode;
  dryGain: GainNode;
  delayL: DelayNode;
  delayR: DelayNode;
  feedbackL: GainNode;
  feedbackR: GainNode;
} {
  const input = audioContext.createGain();
  const output = audioContext.createGain();
  const wetGain = audioContext.createGain();
  const dryGain = audioContext.createGain();

  const delayL = audioContext.createDelay(2.0);
  const delayR = audioContext.createDelay(2.0);
  const feedbackL = audioContext.createGain();
  const feedbackR = audioContext.createGain();

  // Calculate delay time based on BPM (dotted eighth = 0.375 beats)
  const quarterNoteTime = 60 / bpm;
  const delayTime = quarterNoteTime * 0.375;

  delayL.delayTime.value = delayTime;
  delayR.delayTime.value = delayTime * 1.05; // Slight stereo offset
  feedbackL.gain.value = 0.35;
  feedbackR.gain.value = 0.35;

  // Routing: input -> [dry, delay->feedback->delay] -> output
  input.connect(dryGain);
  input.connect(delayL);
  input.connect(delayR);

  delayL.connect(feedbackL);
  delayR.connect(feedbackR);
  feedbackL.connect(delayL);
  feedbackR.connect(delayR);

  delayL.connect(wetGain);
  delayR.connect(wetGain);

  dryGain.connect(output);
  wetGain.connect(output);

  // Default: 100% dry, 0% wet
  dryGain.gain.value = 1;
  wetGain.gain.value = 0;

  return { input, output, wetGain, dryGain, delayL, delayR, feedbackL, feedbackR };
}

/**
 * Create distortion curve
 */
function createDistortionCurve(amount: number): Float32Array {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const k = amount * 100; // 0-100 range

  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + k) * x) / (Math.PI + k * Math.abs(x));
  }

  return curve;
}

/**
 * Per-Deck FX Chain
 *
 * Provides complete isolation between Deck A and Deck B effects
 */
export class DeckFXChain {
  private audioContext: AudioContext;
  private deckId: 'A' | 'B';

  // Public nodes for external connection
  public input: GainNode;
  public output: GainNode;

  // FX Nodes
  private filterNode: BiquadFilterNode;
  private reverb: ReturnType<typeof createSimpleReverb>;
  private delay: ReturnType<typeof createStereoDelay>;
  private distortionNode: WaveShaperNode;
  private distortionGain: GainNode;

  // Internal state
  private currentState: DeckFXState;

  constructor(audioContext: AudioContext, deckId: 'A' | 'B', bpm: number = 128) {
    this.audioContext = audioContext;
    this.deckId = deckId;
    this.currentState = { ...DEFAULT_FX_STATE };

    // Create input/output nodes
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();

    // Create FX chain nodes
    this.filterNode = audioContext.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 22050;
    this.filterNode.Q.value = 1.0;

    this.reverb = createSimpleReverb(audioContext);
    this.delay = createStereoDelay(audioContext, bpm);

    this.distortionNode = audioContext.createWaveShaper();
    // @ts-expect-error - Float32Array generic type mismatch between ArrayBufferLike and ArrayBuffer
    this.distortionNode.curve = createDistortionCurve(0);
    this.distortionNode.oversample = '4x';

    this.distortionGain = audioContext.createGain();
    this.distortionGain.gain.value = 1;    // Signal routing: input -> filter -> reverb -> delay -> distortion -> output
    this.input.connect(this.filterNode);
    this.filterNode.connect(this.reverb.input);
    this.reverb.output.connect(this.delay.input);
    this.delay.output.connect(this.distortionNode);
    this.distortionNode.connect(this.distortionGain);
    this.distortionGain.connect(this.output);
  }

  /**
   * Update filter (bipolar: 0 = high-pass, 0.5 = neutral, 1 = low-pass)
   */
  setFilter(value: number): void {
    this.currentState.filter = Math.max(0, Math.min(1, value));

    if (value < 0.5) {
      // High-pass mode (0 to 0.5)
      this.filterNode.type = 'highpass';
      const normalized = value * 2; // 0 to 1
      const minFreq = 20;
      const maxFreq = 2000;
      const freq = minFreq * Math.pow(maxFreq / minFreq, 1 - normalized);
      this.filterNode.frequency.value = freq;
    } else {
      // Low-pass mode (0.5 to 1)
      this.filterNode.type = 'lowpass';
      const normalized = (value - 0.5) * 2; // 0 to 1
      const minFreq = 500;
      const maxFreq = 22050;
      const freq = minFreq * Math.pow(maxFreq / minFreq, normalized);
      this.filterNode.frequency.value = freq;
    }
  }

  /**
   * Update reverb mix (0 = dry, 1 = wet)
   */
  setReverb(mix: number, decay?: number): void {
    this.currentState.reverb = Math.max(0, Math.min(1, mix));
    if (decay !== undefined) {
      this.currentState.reverbDecay = Math.max(0, Math.min(1, decay));
      // Decay affects the convolver buffer (would need regeneration)
      // For now, we just store it
    }

    this.reverb.dryGain.gain.value = 1 - mix;
    this.reverb.wetGain.gain.value = mix;
  }

  /**
   * Update delay mix and parameters
   */
  setDelay(mix: number, feedback?: number, time?: number): void {
    this.currentState.delay = Math.max(0, Math.min(1, mix));

    if (feedback !== undefined) {
      this.currentState.delayFeedback = Math.max(0, Math.min(1, feedback));
      this.delay.feedbackL.gain.value = feedback;
      this.delay.feedbackR.gain.value = feedback;
    }

    if (time !== undefined) {
      this.currentState.delayTime = Math.max(0, Math.min(1, time));
      // Convert time to actual delay value (0-2 seconds)
      const delaySeconds = time * 2;
      this.delay.delayL.delayTime.value = delaySeconds;
      this.delay.delayR.delayTime.value = delaySeconds * 1.05;
    }

    this.delay.dryGain.gain.value = 1 - mix;
    this.delay.wetGain.gain.value = mix;
  }

  /**
   * Update distortion amount
   */
  setDistortion(amount: number): void {
    this.currentState.distortion = Math.max(0, Math.min(1, amount));
    // @ts-expect-error - Float32Array generic type mismatch between ArrayBufferLike and ArrayBuffer
    this.distortionNode.curve = createDistortionCurve(amount);

    // Compensate for gain increase from distortion
    const compensation = 1 / (1 + amount * 0.5);
    this.distortionGain.gain.value = compensation;
  }  /**
   * Update BPM (affects delay time calculation)
   */
  setBpm(bpm: number): void {
    const quarterNoteTime = 60 / bpm;
    const baseTime = quarterNoteTime * 0.375; // Dotted eighth
    this.delay.delayL.delayTime.value = baseTime * this.currentState.delayTime;
    this.delay.delayR.delayTime.value = baseTime * this.currentState.delayTime * 1.05;
  }

  /**
   * Get current FX state
   */
  getState(): Readonly<DeckFXState> {
    return { ...this.currentState };
  }

  /**
   * Reset all FX to default (dry)
   */
  reset(): void {
    this.setFilter(DEFAULT_FX_STATE.filter);
    this.setReverb(DEFAULT_FX_STATE.reverb, DEFAULT_FX_STATE.reverbDecay);
    this.setDelay(DEFAULT_FX_STATE.delay, DEFAULT_FX_STATE.delayFeedback, DEFAULT_FX_STATE.delayTime);
    this.setDistortion(DEFAULT_FX_STATE.distortion);
  }

  /**
   * Disconnect and cleanup
   */
  dispose(): void {
    this.input.disconnect();
    this.filterNode.disconnect();
    this.reverb.input.disconnect();
    this.reverb.output.disconnect();
    this.delay.input.disconnect();
    this.delay.output.disconnect();
    this.distortionNode.disconnect();
    this.distortionGain.disconnect();
    this.output.disconnect();
  }
}
