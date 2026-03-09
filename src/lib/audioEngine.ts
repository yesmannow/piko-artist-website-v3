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

  private constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
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
}
