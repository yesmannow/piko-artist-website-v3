import * as Tone from 'tone';

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
  public masterOut: Tone.Limiter;
  public stereoWidener: Tone.StereoWidener;
  public masterStreamNode: MediaStreamAudioDestinationNode;
  
  // Stems routing (Phase 8 Multi-track)
  public stems: Record<string, MediaStreamAudioDestinationNode>;

  private constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    Tone.setContext(this.context);
    
    // Create Mastering Chain
    this.masterOut = new Tone.Limiter(-0.1).toDestination();
    
    // Compressor
    const masterCompressor = new Tone.Compressor({
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.25
    });

    // Pseudo-Stereo Imager / Mid-Side processing would be complex here, using a widening EQ trick
    this.stereoWidener = new Tone.StereoWidener(0.5); // Tone has a StereoWidener!

    // Connect Chain: Widener -> Compressor -> Limiter -> Destination
    this.stereoWidener.connect(masterCompressor);
    masterCompressor.connect(this.masterOut);

    // Create stream destination for recording
    this.masterStreamNode = this.context.createMediaStreamDestination();
    Tone.connect(this.masterOut, this.masterStreamNode as any);
    
    this.masterAnalyser = this.context.createAnalyser();
    this.masterAnalyser.fftSize = 2048; 
    
    // Master analyser takes the final output signal before speaker destination
    Tone.connect(this.masterOut, this.masterAnalyser as any);
    
    // Initialize Stems
    this.stems = {
      vocals: this.context.createMediaStreamDestination(),
      drums: this.context.createMediaStreamDestination(),
      bass: this.context.createMediaStreamDestination(),
      melody: this.context.createMediaStreamDestination(),
    };
  }

  // To easily route tracks to the mastering chain instead of context.destination
  public connectToMaster(node: AudioNode | Tone.ToneAudioNode) {
    if (node instanceof AudioNode) {
      Tone.connect(node as unknown as any, this.stereoWidener);
    } else {
      node.connect(this.stereoWidener);
    }
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
