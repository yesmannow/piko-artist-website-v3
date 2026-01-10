/**
 * RealtimeAudioSystem - Real-time Audio Bootstrap Layer
 * 
 * Phase 4: Real-time audio primitives
 * - Initializes AudioContext with latencyHint:'interactive'
 * - Loads AudioWorklet modules
 * - Provides low-level audio infrastructure without UI dependencies
 * 
 * Constraints:
 * - No DSP on main thread
 * - No HTML <audio> elements
 * - Singleton pattern for global audio context
 * - Strict TypeScript
 */

export type AudioSystemState = 'uninitialized' | 'initializing' | 'ready' | 'error';

export interface RealtimeAudioSystemConfig {
  latencyHint?: 'interactive' | 'balanced' | 'playback';
  sampleRate?: number;
  workletModules?: string[];
}

class RealtimeAudioSystem {
  private static instance: RealtimeAudioSystem | null = null;
  
  private audioContext: AudioContext | null = null;
  private audioDestination: AudioDestinationNode | null = null;
  private systemState: AudioSystemState = 'uninitialized';
  private initializationError: Error | null = null;
  
  // Private constructor enforces singleton pattern
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): RealtimeAudioSystem {
    if (!RealtimeAudioSystem.instance) {
      RealtimeAudioSystem.instance = new RealtimeAudioSystem();
    }
    return RealtimeAudioSystem.instance;
  }
  
  /**
   * Initialize the real-time audio system
   * Must be called after user gesture (iOS requirement)
   * 
   * @param config - Configuration options
   * @returns Promise that resolves when initialization is complete
   */
  public async initialize(config: RealtimeAudioSystemConfig = {}): Promise<void> {
    if (this.systemState === 'ready') {
      console.warn('[RealtimeAudioSystem] Already initialized');
      return;
    }
    
    if (this.systemState === 'initializing') {
      console.warn('[RealtimeAudioSystem] Initialization already in progress');
      return;
    }
    
    try {
      this.systemState = 'initializing';
      console.log('[RealtimeAudioSystem] Initializing...');
      
      // Create AudioContext with optimal settings for real-time audio
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      
      if (!AudioContextClass) {
        throw new Error('AudioContext not supported in this browser');
      }
      
      this.audioContext = new AudioContextClass({
        latencyHint: config.latencyHint || 'interactive',
        sampleRate: config.sampleRate || 44100,
      });
      
      console.log(`[RealtimeAudioSystem] AudioContext created: ${this.audioContext.state}, sampleRate: ${this.audioContext.sampleRate}Hz`);
      
      // Store destination reference
      this.audioDestination = this.audioContext.destination;
      
      // Resume if suspended (Safari/iOS requirement)
      if (this.audioContext.state === 'suspended') {
        console.log('[RealtimeAudioSystem] Resuming suspended AudioContext...');
        await this.audioContext.resume();
      }
      
      // Load AudioWorklet modules if specified
      const workletModules = config.workletModules || ['/worklets/mixer-processor.js'];
      
      for (const modulePath of workletModules) {
        try {
          console.log(`[RealtimeAudioSystem] Loading worklet: ${modulePath}`);
          await this.audioContext.audioWorklet.addModule(modulePath);
          console.log(`[RealtimeAudioSystem] ✓ Loaded worklet: ${modulePath}`);
        } catch (workletError) {
          // Log worklet load error but don't fail initialization
          // The worklet file may not exist yet (Phase 4 dependency)
          console.warn(`[RealtimeAudioSystem] ⚠ Failed to load worklet ${modulePath}:`, workletError);
          // Store as warning but continue - this is expected if worklet file doesn't exist yet
        }
      }
      
      this.systemState = 'ready';
      console.log('[RealtimeAudioSystem] ✅ Initialization complete');
      
    } catch (error) {
      this.systemState = 'error';
      this.initializationError = error instanceof Error ? error : new Error(String(error));
      console.error('[RealtimeAudioSystem] ❌ Initialization failed:', error);
      throw this.initializationError;
    }
  }
  
  /**
   * Get the AudioContext instance
   * @throws Error if system is not initialized
   */
  public get context(): AudioContext {
    if (!this.audioContext) {
      throw new Error('[RealtimeAudioSystem] AudioContext not initialized. Call initialize() first.');
    }
    return this.audioContext;
  }
  
  /**
   * Get the audio destination node
   * @throws Error if system is not initialized
   */
  public get destination(): AudioDestinationNode {
    if (!this.audioDestination) {
      throw new Error('[RealtimeAudioSystem] AudioDestination not initialized. Call initialize() first.');
    }
    return this.audioDestination;
  }
  
  /**
   * Get current system state
   */
  public get state(): AudioSystemState {
    return this.systemState;
  }
  
  /**
   * Get initialization error if any
   */
  public get error(): Error | null {
    return this.initializationError;
  }
  
  /**
   * Check if system is ready
   */
  public get isReady(): boolean {
    return this.systemState === 'ready';
  }
  
  /**
   * Resume AudioContext if suspended
   * Useful for handling iOS audio unlock after user gesture
   */
  public async resume(): Promise<void> {
    if (!this.audioContext) {
      console.warn('[RealtimeAudioSystem] Cannot resume: AudioContext not initialized');
      return;
    }
    
    if (this.audioContext.state === 'suspended') {
      console.log('[RealtimeAudioSystem] Resuming AudioContext...');
      await this.audioContext.resume();
      console.log('[RealtimeAudioSystem] AudioContext resumed');
    }
  }
}

// Export singleton instance getter
export const getRealtimeAudioSystem = () => RealtimeAudioSystem.getInstance();
