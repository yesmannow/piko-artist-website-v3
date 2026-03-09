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

// ─────────────────────────────────────────────────────────────────────────────

// ── Phase 8: Quantum Remix — DSP node type contracts ─────────────────────────

/** All nodes returned by `AudioEngine.createDeckRouting()`. */
export interface DeckRoutingNodes {
  /** Bandpass filter for the VOC (vocal) path — 500 Hz – 8 kHz. */
  vocFilter:   BiquadFilterNode;
  /** Low-pass filter for the DRUM path — ≤ 500 Hz. */
  drumFilter:  BiquadFilterNode;
  /** High-pass filter for the INST path — ≥ 8 kHz. */
  instFilter:  BiquadFilterNode;
  /** Gain node controlling VOC path mute/unmute. */
  vocGain:     GainNode;
  /** Gain node controlling DRUM path mute/unmute. */
  drumGain:    GainNode;
  /** Gain node controlling INST path mute/unmute. */
  instGain:    GainNode;
  /** Echo send gain — opens briefly when VOC is muted (Post-Mute Echo Tail). */
  echoSend:    GainNode;
  /** Delay line for the echo tail. */
  echoDelay:   DelayNode;
  /** Feedback gain node — loops delay output back into input. */
  echoFeedback: GainNode;
  /** Echo return gain — feeds delay output into the summing bus. */
  echoReturn:  GainNode;
  /** Summing output — connect this to the downstream signal chain. */
  output:      GainNode;
}

/** Nodes returned by `AudioEngine.createSibilanceTamer()`. */
export interface SibilanceTamerNodes {
  input:  BiquadFilterNode;
  output: DynamicsCompressorNode;
}

/** Nodes returned by `AudioEngine.createSubGenerator()`. */
export interface SubGeneratorNodes {
  input:  BiquadFilterNode;
  output: GainNode;
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

  // ── Per-deck analysers for VU meters ──────────────────────────────────────
  /** Registry mapping deckId → the AnalyserNode tapped after the deck's GainNode. */
  private deckAnalyserRegistry: Map<string, AnalyserNode> = new Map();
  /** Pre-allocated float buffers for each deck — reused every frame to avoid GC churn. */
  private deckAnalyserBuffers: Map<string, Float32Array<ArrayBuffer>> = new Map();

  // ── Bézier automation ──────────────────────────────────────────────────────
  /** Registry mapping deckId → the GainNode that carries volume automation. */
  private deckGainRegistry: Map<string, GainNode> = new Map();
  /** Singleton Bézier worker — initialised once on first getInstance() call. */
  private bezierWorker: Worker | null = null;

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

    // ── Bézier worker (runs once per AudioEngine singleton) ────────────────
    if (typeof window !== 'undefined') {
      this.bezierWorker = new Worker(
        new URL('@/workers/bezier.worker', import.meta.url),
        { type: 'module' },
      );
    }
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
    const now = this.context.currentTime;
    // Cancel any in-flight automation before scheduling a new ramp to
    // prevent zipper noise during rapid knob sweeps.
    this.macroHPF.frequency.cancelScheduledValues(now);
    this.macroHPF.frequency.setValueAtTime(this.macroHPF.frequency.value, now);
    this.macroHPF.frequency.setTargetAtTime(freq, now, 0.05);
  }

  /**
   * Set delay send mix and feedback for Build-up macro.
   * @param mix       0–1 wet send amount
   * @param feedback  0–1 feedback fraction (clamped to 0.95 for safety)
   */
  public setMacroDelay(mix: number, feedback: number): void {
    const clampedMix = Math.max(0, Math.min(1, mix));
    const clampedFb  = Math.max(0, Math.min(0.95, feedback));
    const now = this.context.currentTime;
    // Cancel any in-flight automation before scheduling a new ramp to
    // prevent zipper noise during rapid knob sweeps.
    this.macroDelayGain.gain.cancelScheduledValues(now);
    this.macroDelayGain.gain.setValueAtTime(this.macroDelayGain.gain.value, now);
    this.macroDelayGain.gain.setTargetAtTime(clampedMix, now, 0.05);
    this.macroFeedbackGain.gain.cancelScheduledValues(now);
    this.macroFeedbackGain.gain.setValueAtTime(this.macroFeedbackGain.gain.value, now);
    this.macroFeedbackGain.gain.setTargetAtTime(clampedFb, now, 0.05);
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

  // ── Bézier automation API ─────────────────────────────────────────────────

  /**
   * Register the GainNode that controls volume for a deck so that
   * `applyVolumeAutomation` knows where to route the automation curve.
   * Also creates and taps an AnalyserNode for the deck's VU meter.
   *
   * Call this once when the GainNode is created in `useDeckAudio`.
   */
  public registerDeckGain(deckId: 'A' | 'B', node: GainNode): void {
    this.deckGainRegistry.set(deckId, node);
    // Tap an analyser from this gain node for VU metering (fftSize 256 = light weight).
    if (!this.deckAnalyserRegistry.has(deckId)) {
      const analyser = this.context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0; // raw samples — ballistics applied in UI
      node.connect(analyser);
      this.deckAnalyserRegistry.set(deckId, analyser);
      // Pre-allocate the read buffer once so getDeckLevel never allocates on the hot path.
      this.deckAnalyserBuffers.set(deckId, new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>);
    }
  }

  /**
   * Returns the instantaneous RMS level (0–1) of a deck's output.
   * Reads the time-domain buffer directly — call from a requestAnimationFrame loop.
   * Uses a pre-allocated Float32Array to avoid GC pressure at 60 fps.
   */
  public getDeckLevel(deckId: 'A' | 'B'): number {
    const analyser = this.deckAnalyserRegistry.get(deckId);
    if (!analyser) return 0;
    const buf = this.deckAnalyserBuffers.get(deckId)!;
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    return Math.sqrt(sum / buf.length);
  }

  /**
   * Schedule a volume automation curve on a deck's GainNode using
   * `AudioParam.setValueCurveAtTime` with a 100 ms lookahead to prevent
   * audio artefacts caused by parameter discontinuities.
   *
   * The `curveArray` should already contain gain values (i.e. converted
   * through the `gain = linearValue²` law by the caller / worker).
   *
   * @param deckId     Target deck ('A' or 'B').
   * @param curveArray Pre-sampled Float32Array of gain values (0–1).
   * @param duration   Duration of the automation window in seconds.
   */
  public applyVolumeAutomation(
    deckId: 'A' | 'B',
    curveArray: Float32Array,
    duration: number,
  ): void {
    const gainNode = this.deckGainRegistry.get(deckId);
    if (!gainNode || curveArray.length === 0 || duration <= 0) return;

    const LOOKAHEAD = 0.1; // 100 ms
    const now = this.context.currentTime;
    const startTime = now + LOOKAHEAD;

    // Cancel from now (not from the lookahead point) so any curve that is
    // already playing — but scheduled in the future — is also removed.
    // This prevents overlapping automation curves from causing zipper noise
    // or audible clicks during rapid drawing.
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueCurveAtTime(curveArray, startTime, duration);
  }

  /**
   * Expose the singleton Bézier worker so consumers (e.g. `useAutomationRunner`)
   * can post sampling requests without creating duplicate workers.
   */
  public getBezierWorker(): Worker | null {
    return this.bezierWorker;
  }

  // ── Phase 8: Quantum Remix DSP ────────────────────────────────────────────

  /**
   * Creates 3 parallel phase-locked biquad crossover paths for virtual stems:
   *   VOC  (bandpass  500 Hz – 8 kHz  — vocal presence range)
   *   DRUM (low-pass  ≤ 500 Hz        — kick/snare fundamentals)
   *   INST (high-pass ≥ 8 kHz         — air/presence/instruments)
   *
   * Each path has an independent GainNode for muting and a shared Post-Mute
   * Echo Tail on the VOC path that briefly opens when vocals are silenced.
   *
   * Signal flow (per deck):
   *   input ─┬─ vocFilter  ─ vocGain  ─┐
   *           ├─ drumFilter ─ drumGain ─┤─ output
   *           └─ instFilter ─ instGain ─┘
   *   vocGain ──── echoSend ─ echoDelay ─ echoFeedback (loop) ─ echoReturn ─ output
   */
  public createDeckRouting(): DeckRoutingNodes {
    const ctx = this.context;

    // ── Crossover filters ──────────────────────────────────────────────────
    const vocFilter = ctx.createBiquadFilter();
    vocFilter.type = 'bandpass';
    vocFilter.frequency.value = 2000;  // centre of 500 Hz – 8 kHz
    vocFilter.Q.value = 0.7;           // −3 dB points at ~500 Hz and ~8 kHz

    const drumLpf = ctx.createBiquadFilter();
    drumLpf.type = 'lowpass';
    drumLpf.frequency.value = 500;
    drumLpf.Q.value = 0.7;

    const instHpf = ctx.createBiquadFilter();
    instHpf.type = 'highpass';
    instHpf.frequency.value = 8000;
    instHpf.Q.value = 0.7;

    // ── Per-stem gain nodes ────────────────────────────────────────────────
    const vocGain  = ctx.createGain();
    const drumGain = ctx.createGain();
    const instGain = ctx.createGain();

    // ── Summing output ─────────────────────────────────────────────────────
    const output = ctx.createGain();
    output.gain.value = 1;

    // ── Post-Mute Echo Tail (VOC path only) ───────────────────────────────
    const echoSend     = ctx.createGain();
    echoSend.gain.value = 0;            // closed by default

    const echoDelay    = ctx.createDelay(2.0);
    echoDelay.delayTime.value = 0.375;  // dotted-eighth at 120 BPM

    const echoFeedback = ctx.createGain();
    echoFeedback.gain.value = 0.35;

    const echoReturn   = ctx.createGain();
    echoReturn.gain.value = 0.6;

    // ── Wire signal graph ─────────────────────────────────────────────────
    vocFilter.connect(vocGain);
    drumLpf.connect(drumGain);
    instHpf.connect(instGain);

    vocGain.connect(output);
    drumGain.connect(output);
    instGain.connect(output);

    // Echo tail: voc signal → echoSend → delay → feedback loop → echoReturn → output
    vocGain.connect(echoSend);
    echoSend.connect(echoDelay);
    echoDelay.connect(echoFeedback);
    echoFeedback.connect(echoDelay);    // feedback loop
    echoDelay.connect(echoReturn);
    echoReturn.connect(output);

    return {
      vocFilter,
      drumFilter: drumLpf,
      instFilter: instHpf,
      vocGain,
      drumGain,
      instGain,
      echoSend,
      echoDelay,
      echoFeedback,
      echoReturn,
      output,
    };
  }

  /**
   * Creates a Sibilance Tamer (de-esser / dynamic EQ) for Deck A.
   * Circuit:  input → sibilanceFilter (peaking, 7 kHz) → compressor → output
   * The peaking filter boosts the detector band; the compressor reacts to
   * the boosted signal and reduces gain at that frequency.
   */
  public createSibilanceTamer(): SibilanceTamerNodes {
    const ctx = this.context;

    // Peaking filter centred at 7 kHz — targets harsh sibilance
    const sibilanceFilter = ctx.createBiquadFilter();
    sibilanceFilter.type   = 'peaking';
    sibilanceFilter.frequency.value = 7000;
    sibilanceFilter.Q.value         = 3;
    sibilanceFilter.gain.value      = 0; // flat until activated

    // Dynamic compressor reacts quickly to sibilant transients
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value      = 6;
    compressor.ratio.value     = 8;
    compressor.attack.value    = 0.001;  // 1 ms — catches fast sibilants
    compressor.release.value   = 0.08;   // 80 ms release

    sibilanceFilter.connect(compressor);

    return { input: sibilanceFilter, output: compressor };
  }

  /**
   * Creates a Sub-Generator (low-harmonic exciter) for Deck B.
   * Circuit:  input → subLpf → waveshaper (soft-clip) → subGain → output
   * The LPF isolates the sub-bass; the waveshaper adds low-order harmonics
   * (2nd & 3rd) that are perceived as added body on smaller speakers.
   */
  public createSubGenerator(): SubGeneratorNodes {
    const ctx = this.context;

    // Isolate sub-bass below 120 Hz
    const subLpf = ctx.createBiquadFilter();
    subLpf.type            = 'lowpass';
    subLpf.frequency.value = 120;
    subLpf.Q.value         = 0.7;

    // Waveshaper: soft-clip generates 2nd/3rd harmonics
    // Transfer function: f(x) = (π + k)x / (π + k|x|)  where k = SUB_DRIVE_AMOUNT
    // This is a rational approximation that saturates gently, producing mainly
    // even harmonics (2nd, 4th) that add perceived warmth and sub-bass body.
    // Larger SUB_DRIVE_AMOUNT = more saturation / more harmonics.
    const SUB_DRIVE_AMOUNT = 200;
    const shaper = ctx.createWaveShaper();
    const curve  = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 255 - 1;
      curve[i] = (Math.PI + SUB_DRIVE_AMOUNT) * x / (Math.PI + SUB_DRIVE_AMOUNT * Math.abs(x));
    }
    shaper.curve     = curve;
    shaper.oversample = '2x';

    // Output gain — kept modest so it blends as enrichment
    const subGain = ctx.createGain();
    subGain.gain.value = 0; // inactive until toggled

    subLpf.connect(shaper);
    shaper.connect(subGain);

    return { input: subLpf, output: subGain };
  }
}
