import * as Tone from 'tone';

// ── Phase 8: Mastering Chain Infrastructure ──────────────────────────────────

/**
 * Soft clipper using cubic waveshaping: y = 1.5x − 0.5x³
 *
 * This third-order polynomial clips gently below 0 dBFS while preserving
 * transient detail — it adds ~3 dB of harmonic gain on small signals and
 * rounds peaks rather than hard-clipping them.  Place before a hard Limiter
 * to reduce the amount of gain reduction the Limiter needs to apply.
 */
export class SoftClipper extends Tone.WaveShaper {
  constructor() {
    super((x: number) => {
      const c = Math.max(-1, Math.min(1, x));
      return 1.5 * c - 0.5 * c * c * c;
    }, 4096);
  }
}

/**
 * MasteringChain: SoftClipper → Limiter(-0.1)
 *
 * This is the foundation for the Phase 8 Production HUD.
 * Signal flow:  sources → softClipper → limiter → destination
 */
export class MasteringChain {
  public readonly softClipper: SoftClipper;
  public readonly limiter: Tone.Limiter;

  constructor() {
    this.softClipper = new SoftClipper();
    this.limiter = new Tone.Limiter(-0.1);
    // Wire: soft-clip → hard limit → speakers
    this.softClipper.connect(this.limiter);
    this.limiter.toDestination();
  }

  /** Entry point — connect upstream nodes here */
  get input(): Tone.ToneAudioNode {
    return this.softClipper;
  }

  /** Final output node — connect side-chain taps (analyser, recorder) here */
  get output(): Tone.Limiter {
    return this.limiter;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export class SlipModeManager {
  private ghostStartTime: number = 0;
  private isSlipActive: boolean = false;

  public get isActive() { return this.isSlipActive; }
  public set isActive(val: boolean) { this.isSlipActive = val; }

  // Called when Play is pressed or Slip is engaged
  public startGhost(currentTime: number, currentPosition: number) {
    this.ghostStartTime = currentTime - currentPosition;
  }

  // Returns where the track "should" be right now
  public getGhostPosition(currentTime: number, playbackRate: number): number {
    return (currentTime - this.ghostStartTime) * playbackRate;
  }
}

export class AudioEngine {
  private static instance: AudioEngine;
  public context: AudioContext;
  public masterAnalyser: AnalyserNode;
  /** Phase 8 mastering chain (SoftClipper → Limiter). Use `masterOut` for backward-compat tap. */
  public masteringChain: MasteringChain;
  /** Backward-compatible alias: the final Limiter(-0.1) inside the mastering chain. */
  public get masterOut(): Tone.Limiter { return this.masteringChain.limiter; }
  public stereoWidener: Tone.StereoWidener;
  public masterStreamNode: MediaStreamAudioDestinationNode;

  // SE-1 Build-up macro chain (master HPF + delay send)
  private macroHPF: BiquadFilterNode;
  private macroDelayNode: DelayNode;
  private macroDelayGain: GainNode;   // wet send
  private macroDryGain: GainNode;     // dry path
  private macroFeedbackGain: GainNode; // delay feedback loop
  private macroOutput: GainNode;      // summed output to stereoWidener
  
  // Stems routing (Phase 8 Multi-track)
  public stems: Record<string, MediaStreamAudioDestinationNode>;

  private constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    Tone.setContext(this.context);

    // ── Mastering Chain: SoftClipper → Limiter(-0.1) → destination ──
    this.masteringChain = new MasteringChain();

    // Compressor
    const masterCompressor = new Tone.Compressor({
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.25
    });

    // Pseudo-Stereo Imager / Mid-Side processing would be complex here, using a widening EQ trick
    this.stereoWidener = new Tone.StereoWidener(0.5); // Tone has a StereoWidener!

    // Connect Chain: Widener -> Compressor -> SoftClipper -> Limiter(-0.1) -> Destination
    this.stereoWidener.connect(masterCompressor);
    masterCompressor.connect(this.masteringChain.input);

    // Create stream destination for recording
    this.masterStreamNode = this.context.createMediaStreamDestination();
    Tone.connect(this.masterOut, this.masterStreamNode as any);
    
    this.masterAnalyser = this.context.createAnalyser();
    this.masterAnalyser.fftSize = 2048; 
    
    // Master analyser takes the final output signal before speaker destination
    Tone.connect(this.masterOut, this.masterAnalyser as any);

    // ── SE-1 Build-up Macro Chain ──────────────────────────────────────
    // Signal path: macroHPF -> macroDryGain \
    //                       -> macroDelayGain -> macroDelayNode -> macroFeedbackGain (loop back) -> macroOutput -> stereoWidener
    this.macroHPF = this.context.createBiquadFilter();
    this.macroHPF.type = 'highpass';
    this.macroHPF.frequency.value = 20; // Start fully open (20 Hz = flat)
    this.macroHPF.Q.value = 0.7;

    this.macroDryGain = this.context.createGain();
    this.macroDryGain.gain.value = 1;

    this.macroDelayGain = this.context.createGain();
    this.macroDelayGain.gain.value = 0; // Start dry

    this.macroDelayNode = this.context.createDelay(2.0);
    this.macroDelayNode.delayTime.value = 0.375; // Dotted eighth at 120 BPM

    this.macroFeedbackGain = this.context.createGain();
    this.macroFeedbackGain.gain.value = 0.35;

    this.macroOutput = this.context.createGain();
    this.macroOutput.gain.value = 1;

    // Wire macro chain
    this.macroHPF.connect(this.macroDryGain);
    this.macroDryGain.connect(this.macroOutput);

    this.macroHPF.connect(this.macroDelayGain);
    this.macroDelayGain.connect(this.macroDelayNode);
    this.macroDelayNode.connect(this.macroFeedbackGain);
    this.macroFeedbackGain.connect(this.macroDelayNode); // feedback loop
    this.macroDelayNode.connect(this.macroOutput);

    // macroOutput feeds into stereoWidener
    Tone.connect(this.macroOutput as unknown as any, this.stereoWidener);
    
    // Initialize Stems
    this.stems = {
      vocals: this.context.createMediaStreamDestination(),
      drums: this.context.createMediaStreamDestination(),
      bass: this.context.createMediaStreamDestination(),
      melody: this.context.createMediaStreamDestination(),
    };
  }

  // To easily route tracks to the mastering chain instead of context.destination
  // Routes through the SE-1 macro HPF chain before stereoWidener
  public connectToMaster(node: AudioNode | Tone.ToneAudioNode) {
    if (node instanceof AudioNode) {
      node.connect(this.macroHPF);
    } else {
      Tone.connect(node, this.macroHPF as unknown as any);
    }
  }

  // ── SE-1 Macro Controls ──────────────────────────────────────────────

  /**
   * Set HPF cutoff for Build-up macro sweep.
   * @param normalized 0–1 where 0 = 20 Hz (open) and 1 = 20000 Hz (fully swept)
   */
  public setMacroFilter(normalized: number): void {
    const clamped = Math.max(0, Math.min(1, normalized));
    // Exponential mapping: 20 Hz → 20000 Hz
    const freq = 20 * Math.pow(1000, clamped);
    this.macroHPF.frequency.setTargetAtTime(freq, this.context.currentTime, 0.05);
  }

  /**
   * Set delay send mix and feedback for Build-up macro.
   * @param mix       0–1 wet send amount
   * @param feedback  0–1 feedback fraction (clamped to 0.95 for safety)
   */
  public setMacroDelay(mix: number, feedback: number): void {
    const clampedMix = Math.max(0, Math.min(1, mix));
    const clampedFb  = Math.max(0, Math.min(0.95, feedback));
    this.macroDelayGain.gain.setTargetAtTime(clampedMix, this.context.currentTime, 0.05);
    this.macroFeedbackGain.gain.setTargetAtTime(clampedFb, this.context.currentTime, 0.05);
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async resume() {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  public async loadBuffer(file: File | Blob | string): Promise<AudioBuffer> {
    let arrayBuffer: ArrayBuffer;
    if (typeof file === 'string') {
      const response = await fetch(file);
      arrayBuffer = await response.arrayBuffer();
    } else {
      arrayBuffer = await file.arrayBuffer();
    }
    return await this.context.decodeAudioData(arrayBuffer);
  }

  public createEQChain() {
    const low = this.context.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.value = 250;

    const mid = this.context.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1000;
    mid.Q.value = 1;

    const high = this.context.createBiquadFilter();
    high.type = 'highshelf';
    high.frequency.value = 4000;

    // Connect chain: input -> low -> mid -> high -> output
    low.connect(mid);
    mid.connect(high);

    return {
      input: low,
      output: high,
      low,
      mid,
      high
    };
  }

  public getLogarithmicGain(linearValue: number): number {
    return Math.pow(Math.max(0, Math.min(1, linearValue)), 2);
  }

  public getEqualPowerGains(crossfaderValue: number, reversed: boolean = false): { gainA: number; gainB: number } {
    // crossfaderValue ranges from -1 (Deck A) to 1 (Deck B)
    const effectiveValue = reversed ? -crossfaderValue : crossfaderValue;
    // Convert to 0 to 1 range
    const x = (effectiveValue + 1) / 2;
    
    // Equal power curve: cos(x * pi/2) for A, sin(x * pi/2) for B
    const gainA = Math.cos(x * 0.5 * Math.PI);
    const gainB = Math.sin(x * 0.5 * Math.PI);
    
    return { gainA, gainB };
  }

  // FX Factory
  public createFxNode(type: 'saturator' | 'filter' | 'reverb', params: any): Tone.ToneAudioNode {
    switch(type) {
      case 'saturator':
        return new Tone.Chebyshev(params.drive ? params.drive * 50 : 1);
      case 'filter':
        return new Tone.Filter({
           type: 'lowpass',
           rolloff: -48, // 8-pole
           frequency: params.cutoff ? params.cutoff * 20000 : 20000,
           Q: params.resonance ? params.resonance * 10 : 0
        });
      case 'reverb':
        return new Tone.Reverb({
           decay: params.decay ? params.decay * 10 : 1.5,
           wet: params.mix || 0.5
        });
      default:
        // Fallback pass-through
        return new Tone.Gain(1);
    }
  }
}
