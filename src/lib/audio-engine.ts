/**
 * Professional Audio Engine for ProSequencer
 *
 * Features:
 * - AudioBuffer caching for zero-latency playback
 * - Lookahead scheduler using Web Audio API clock for drift-free timing
 * - Proper gain staging with master effects chain
 */

export interface AudioEngineConfig {
  lookahead: number;      // How far ahead to schedule (seconds)
  scheduleInterval: number; // How often to call scheduler (ms)
}

const DEFAULT_CONFIG: AudioEngineConfig = {
  lookahead: 0.1,        // 100ms lookahead
  scheduleInterval: 25,   // Check every 25ms
};

export class AudioBufferManager {
  private audioContext: AudioContext;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private loadingPromises: Map<string, Promise<AudioBuffer>> = new Map();

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Load an audio file and decode it into an AudioBuffer
   * Results are cached - subsequent calls return cached buffer instantly
   */
  async loadBuffer(url: string): Promise<AudioBuffer> {
    // Return cached buffer if available
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }

    // Return existing promise if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    // Start new load
    const loadPromise = this.fetchAndDecode(url);
    this.loadingPromises.set(url, loadPromise);

    try {
      const buffer = await loadPromise;
      this.bufferCache.set(url, buffer);
      return buffer;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  private async fetchAndDecode(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${url}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  /**
   * Preload multiple audio files in parallel
   */
  async preloadBuffers(urls: string[]): Promise<void> {
    await Promise.all(urls.map(url => this.loadBuffer(url)));
  }

  /**
   * Check if a buffer is already cached
   */
  hasBuffer(url: string): boolean {
    return this.bufferCache.has(url);
  }

  /**
   * Get a cached buffer (returns undefined if not cached)
   */
  getBuffer(url: string): AudioBuffer | undefined {
    return this.bufferCache.get(url);
  }

  /**
   * Clear all cached buffers
   */
  clearCache(): void {
    this.bufferCache.clear();
  }
}

export interface SchedulerCallbacks {
  onStep: (stepIndex: number, time: number) => void;
  onStepVisual: (stepIndex: number) => void;
}

/**
 * Lookahead Scheduler for rock-solid timing
 *
 * Uses Web Audio API's currentTime for scheduling, which is handled
 * by the browser's audio subsystem and won't drift even if the UI lags.
 */
export class LookaheadScheduler {
  private audioContext: AudioContext;
  private config: AudioEngineConfig;
  private callbacks: SchedulerCallbacks;

  private isRunning = false;
  private currentStep = 0;
  private totalSteps = 16;
  private bpm = 120;

  private nextStepTime = 0;
  private timerID: number | null = null;

  constructor(
    audioContext: AudioContext,
    callbacks: SchedulerCallbacks,
    config: Partial<AudioEngineConfig> = {}
  ) {
    this.audioContext = audioContext;
    this.callbacks = callbacks;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the duration of one step (16th note) in seconds
   */
  private getStepDuration(): number {
    // BPM is quarter notes per minute
    // 16th notes = 4 per quarter note
    return 60 / (this.bpm * 4);
  }

  /**
   * The core scheduler loop
   * Schedules notes that fall within the lookahead window
   */
  private scheduler = () => {
    const currentTime = this.audioContext.currentTime;

    // Schedule all steps that fall within our lookahead window
    while (this.nextStepTime < currentTime + this.config.lookahead) {
      // Schedule the audio callback with precise timing
      this.callbacks.onStep(this.currentStep, this.nextStepTime);

      // Schedule the visual callback (runs immediately for UI feedback)
      // We use setTimeout to sync visual with audio (accounting for lookahead)
      const timeUntilStep = (this.nextStepTime - currentTime) * 1000;
      const stepToShow = this.currentStep;

      if (timeUntilStep > 0) {
        setTimeout(() => {
          if (this.isRunning) {
            this.callbacks.onStepVisual(stepToShow);
          }
        }, timeUntilStep);
      } else {
        this.callbacks.onStepVisual(stepToShow);
      }

      // Advance to next step
      this.nextStepTime += this.getStepDuration();
      this.currentStep = (this.currentStep + 1) % this.totalSteps;
    }
  };

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.nextStepTime = this.audioContext.currentTime + 0.05; // Small initial delay

    // Use setInterval just to call the scheduler regularly
    // The actual timing is handled by audioContext.currentTime
    this.timerID = window.setInterval(this.scheduler, this.config.scheduleInterval);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.timerID !== null) {
      clearInterval(this.timerID);
      this.timerID = null;
    }
  }

  /**
   * Reset to step 0
   */
  reset(): void {
    this.currentStep = 0;
    if (this.isRunning) {
      this.nextStepTime = this.audioContext.currentTime + 0.05;
    }
  }

  /**
   * Update BPM (can be called while running)
   */
  setBpm(bpm: number): void {
    this.bpm = bpm;
  }

  /**
   * Update total steps
   */
  setTotalSteps(steps: number): void {
    this.totalSteps = steps;
    if (this.currentStep >= steps) {
      this.currentStep = 0;
    }
  }

  /**
   * Get current step (for UI)
   */
  getCurrentStep(): number {
    return this.currentStep;
  }

  /**
   * Check if scheduler is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
}

/**
 * Create and play a BufferSourceNode with optional effects
 * Returns the source node for potential cancellation
 */
export function playBuffer(
  audioContext: AudioContext,
  buffer: AudioBuffer,
  destination: AudioNode,
  options: {
    time?: number;        // When to start (audioContext.currentTime)
    playbackRate?: number;
    gain?: number;
  } = {}
): AudioBufferSourceNode {
  const { time = 0, playbackRate = 1.0, gain = 1.0 } = options;

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = playbackRate;

  if (gain !== 1.0) {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = gain;
    source.connect(gainNode);
    gainNode.connect(destination);
  } else {
    source.connect(destination);
  }

  source.start(time);
  return source;
}

/**
 * Create distortion curve for "grit" effect
 */
export function createDistortionCurve(amount: number): Float32Array {
  const samples = 44100;
  const buffer = new ArrayBuffer(samples * Float32Array.BYTES_PER_ELEMENT);
  const curve = new Float32Array(buffer);
  const normalizedAmount = amount / 100; // 0 to 1

  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    // Soft clipping with bit-crush effect
    const k = (2 * normalizedAmount) / (1 - normalizedAmount + 0.001);
    let y = ((1 + k) * x) / (1 + k * Math.abs(x));

    // Add bit-crushing for extra grit
    if (normalizedAmount > 0) {
      const bits = Math.max(1, 16 - Math.floor(normalizedAmount * 14));
      const step = Math.pow(2, bits);
      y = Math.floor(y * step) / step;
    }

    curve[i] = y;
  }

  return curve;
}

/**
 * Audio Engine - combines buffer manager and scheduler
 */
export class AudioEngine {
  public audioContext: AudioContext;
  public bufferManager: AudioBufferManager;
  public scheduler: LookaheadScheduler | null = null;

  // Effects chain nodes
  public masterGain: GainNode;
  public filterNode: BiquadFilterNode;
  public waveShaperNode: WaveShaperNode;

  private initialized = false;

  constructor() {
    // Create AudioContext (will be in suspended state until user interaction)
    const AudioContextClass = window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new AudioContextClass();

    this.bufferManager = new AudioBufferManager(this.audioContext);

    // Create effects chain
    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.type = "lowpass";
    this.filterNode.frequency.value = 22050;

    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 1.0;

    this.waveShaperNode = this.audioContext.createWaveShaper();
    this.waveShaperNode.curve = createDistortionCurve(0) as Float32Array<ArrayBuffer>;
    this.waveShaperNode.oversample = "4x";

    // Connect: filter -> masterGain -> waveShaper -> destination
    this.filterNode.connect(this.masterGain);
    this.masterGain.connect(this.waveShaperNode);
    this.waveShaperNode.connect(this.audioContext.destination);

    this.initialized = true;
  }

  /**
   * Resume audio context (must be called from user interaction)
   */
  async resume(): Promise<void> {
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  /**
   * Create scheduler with callbacks
   */
  createScheduler(callbacks: SchedulerCallbacks): LookaheadScheduler {
    this.scheduler = new LookaheadScheduler(this.audioContext, callbacks);
    return this.scheduler;
  }

  /**
   * Play a buffer immediately or at scheduled time
   */
  playBuffer(
    buffer: AudioBuffer,
    options: {
      time?: number;
      playbackRate?: number;
      gain?: number;
    } = {}
  ): AudioBufferSourceNode {
    return playBuffer(this.audioContext, buffer, this.filterNode, options);
  }

  /**
   * Set filter frequency (0-100 maps to 200Hz-22000Hz)
   */
  setFilter(value: number): void {
    const minFreq = 200;
    const maxFreq = 22000;
    const normalized = value / 100;
    const frequency = minFreq * Math.pow(maxFreq / minFreq, normalized);
    this.filterNode.frequency.value = frequency;
  }

  /**
   * Set grit/distortion amount (0-100)
   */
  setGrit(value: number): void {
    this.waveShaperNode.curve = createDistortionCurve(value) as Float32Array<ArrayBuffer>;
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(value: number): void {
    this.masterGain.gain.value = value;
  }

  /**
   * Get the input node for the effects chain
   */
  getInputNode(): AudioNode {
    return this.filterNode;
  }

  /**
   * Check if engine is ready
   */
  isReady(): boolean {
    return this.initialized && this.audioContext.state === "running";
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.scheduler) {
      this.scheduler.stop();
    }
    this.bufferManager.clearCache();
    if (this.audioContext.state !== "closed") {
      this.audioContext.close();
    }
  }
}

// Singleton instance
let audioEngineInstance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine();
  }
  return audioEngineInstance;
}

export function disposeAudioEngine(): void {
  if (audioEngineInstance) {
    audioEngineInstance.dispose();
    audioEngineInstance = null;
  }
}

