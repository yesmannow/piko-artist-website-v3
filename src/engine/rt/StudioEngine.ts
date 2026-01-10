/**
 * StudioEngine.ts - High-Level Studio Audio Engine
 *
 * Phase 4: Complete real-time audio engine with dual decks
 *
 * Architecture:
 * - Owns RealtimeAudioSystem (AudioContext, mixer worklet)
 * - Owns DeckGraph A and B (audio node chains)
 * - Owns ControlBus (SharedArrayBuffer control plane)
 * - Provides high-level API for UI
 *
 * Constraints:
 * - Singleton pattern
 * - Must be initialized after user gesture
 * - Strict TypeScript
 */

import { getRealtimeAudioSystem } from './RealtimeAudioSystem';
import { DeckGraph, type DeckState } from './DeckGraph';
import type { ControlBus } from './control/ControlBus';
import type { DeckId, EQBand } from './control/ControlLayout';
import { TransportCommand } from './control/ControlLayout';
import { SyncController } from './sync/SyncController';

export type StudioEngineState = 'uninitialized' | 'initializing' | 'ready' | 'error';

/**
 * StudioEngine - High-level audio engine API
 *
 * Singleton that manages the complete audio graph:
 * - DeckA (AudioBuffer -> Rate -> EQ -> Gain) -> MixerWorklet[0]
 * - DeckB (AudioBuffer -> Rate -> EQ -> Gain) -> MixerWorklet[1]
 * - MixerWorklet -> AudioContext.destination
 * - ControlBus (SharedArrayBuffer) for high-frequency UI updates
 */
class StudioEngine {
  private static instance: StudioEngine | null = null;

  private engineState: StudioEngineState = 'uninitialized';
  private deckA: DeckGraph | null = null;
  private deckB: DeckGraph | null = null;
  private controlBusInstance: ControlBus | null = null;
  private syncController: SyncController;

  // Track URLs for cache key generation
  private deckUrls: Map<DeckId, string> = new Map();

  // Private constructor enforces singleton
  private constructor() {
    this.syncController = new SyncController();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): StudioEngine {
    if (!StudioEngine.instance) {
      StudioEngine.instance = new StudioEngine();
    }
    return StudioEngine.instance;
  }

  /**
   * Initialize the studio engine
   * Must be called after user gesture
   *
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    if (this.engineState === 'ready') {
      console.warn('[StudioEngine] Already initialized');
      return;
    }

    if (this.engineState === 'initializing') {
      console.warn('[StudioEngine] Initialization already in progress');
      return;
    }

    try {
      this.engineState = 'initializing';
      console.log('[StudioEngine] Initializing...');

      // Initialize real-time audio system
      const rtAudio = getRealtimeAudioSystem();
      await rtAudio.initialize({
        latencyHint: 'interactive',
        sampleRate: 44100,
        workletModules: ['/worklets/mixer-processor.js'],
      });

      // Get control bus
      this.controlBusInstance = rtAudio.controlBus;

      // Get mixer node (should be created by RealtimeAudioSystem)
      const mixerNode = rtAudio.mixerNode;
      if (!mixerNode) {
        throw new Error('Mixer worklet node not created');
      }

      // Create deck graphs
      // Note: Mixer inputs are handled internally by the worklet
      // We just need to connect each deck to the mixer node
      this.deckA = new DeckGraph(rtAudio.context, mixerNode, 0);
      this.deckB = new DeckGraph(rtAudio.context, mixerNode, 1);

      // Register deck graphs with sync controller
      this.syncController.setDeckGraph('A', this.deckA);
      this.syncController.setDeckGraph('B', this.deckB);

      this.engineState = 'ready';
      console.log('[StudioEngine] ✅ Initialization complete');

    } catch (error) {
      this.engineState = 'error';
      console.error('[StudioEngine] ❌ Initialization failed:', error);
      throw error;
    }
  }

  // ==========================================================================
  // TRACK LOADING
  // ==========================================================================

  /**
   * Load track into deck
   *
   * @param deck - 'A' or 'B'
   * @param url - URL to audio file
   */
  async loadTrack(deck: DeckId, url: string): Promise<void> {
    this.ensureReady();
    const deckGraph = this.getDeck(deck);
    await deckGraph.loadTrack(url);

    // Store URL for cache key generation
    this.deckUrls.set(deck, url);

    // Set cache key in sync controller (use URL as cache key)
    this.syncController.setDeckCacheKey(deck, url);
  }

  // ==========================================================================
  // TRANSPORT CONTROLS
  // ==========================================================================

  /**
   * Play deck
   *
   * @param deck - 'A' or 'B'
   * @param atContextTime - Optional context time for sample-accurate start
   */
  play(deck: DeckId, atContextTime?: number): void {
    this.ensureReady();
    const deckGraph = this.getDeck(deck);

    deckGraph.play(atContextTime);

    // Update control bus (for mixer worklet visibility)
    if (this.controlBusInstance) {
      this.controlBusInstance.setTransport(deck, TransportCommand.PLAY);
    }
  }

  /**
   * Pause deck
   */
  pause(deck: DeckId): void {
    this.ensureReady();
    const deckGraph = this.getDeck(deck);

    deckGraph.pause();

    // Update control bus
    if (this.controlBusInstance) {
      this.controlBusInstance.setTransport(deck, TransportCommand.PAUSE);
    }
  }

  /**
   * Stop deck
   */
  stop(deck: DeckId): void {
    this.ensureReady();
    const deckGraph = this.getDeck(deck);

    deckGraph.stop();

    // Update control bus
    if (this.controlBusInstance) {
      this.controlBusInstance.setTransport(deck, TransportCommand.STOP);
    }
  }

  /**
   * Seek to a specific time in the track
   *
   * @param deck - 'A' or 'B'
   * @param trackTime - Target position in track time (seconds)
   */
  seek(deck: DeckId, trackTime: number): void {
    this.ensureReady();
    const deckGraph = this.getDeck(deck);

    deckGraph.seek(trackTime);
  }

  // ==========================================================================
  // DECK CONTROLS
  // ==========================================================================

  /**
   * Set deck playback rate
   *
   * @param deck - 'A' or 'B'
   * @param rate - Playback speed (0.5 to 2.0)
   */
  setRate(deck: DeckId, rate: number): void {
    this.ensureReady();
    const deckGraph = this.getDeck(deck);

    deckGraph.setRate(rate);

    // Update control bus
    if (this.controlBusInstance) {
      this.controlBusInstance.setDeckRate(deck, rate);
    }
  }

  /**
   * Alias for setRate - for API consistency
   */
  setPlaybackRate(deck: DeckId, rate: number): void {
    this.setRate(deck, rate);
  }

  /**
   * Set deck master gain
   *
   * @param deck - 'A' or 'B'
   * @param gain - Linear gain (0.0 to 1.0)
   */
  setGain(deck: DeckId, gain: number): void {
    this.ensureReady();
    const deckGraph = this.getDeck(deck);

    deckGraph.setGain(gain);

    // Update control bus
    if (this.controlBusInstance) {
      this.controlBusInstance.setDeckGain(deck, gain);
    }
  }

  /**
   * Set deck EQ band gain
   *
   * @param deck - 'A' or 'B'
   * @param band - 'low', 'mid', or 'high'
   * @param gainDb - Gain in dB (-12 to +12)
   */
  setEQ(deck: DeckId, band: EQBand, gainDb: number): void {
    this.ensureReady();
    const deckGraph = this.getDeck(deck);

    deckGraph.setEQ(band, gainDb);

    // Update control bus (convert dB to linear for consistency)
    // Note: Control bus expects linear, but we apply dB at the node level
    if (this.controlBusInstance) {
      const linearGain = Math.pow(10, gainDb / 20); // dB to linear
      this.controlBusInstance.setEQ(deck, band, linearGain);
    }
  }

  // ==========================================================================
  // MIXER CONTROLS
  // ==========================================================================

  /**
   * Set crossfader position
   *
   * @param value - 0.0 = full A, 1.0 = full B
   */
  setCrossfader(value: number): void {
    this.ensureReady();

    if (this.controlBusInstance) {
      this.controlBusInstance.setCrossfader(value);
    }
  }

  // ==========================================================================
  // STATE QUERIES
  // ==========================================================================

  /**
   * Get deck state
   */
  getDeckState(deck: DeckId): DeckState {
    this.ensureReady();
    const deckGraph = this.getDeck(deck);
    return deckGraph.state;
  }

  /**
   * Get complete deck information
   */
  getDeckInfo(deck: DeckId) {
    this.ensureReady();
    const deckGraph = this.getDeck(deck);
    return {
      state: deckGraph.state,
      currentTime: deckGraph.currentTime,
      duration: deckGraph.duration,
      isLoaded: deckGraph.isLoaded,
    };
  }

  /**
   * Get deck current time
   */
  getCurrentTime(deck: DeckId): number {
    this.ensureReady();
    const deckGraph = this.getDeck(deck);
    return deckGraph.currentTime;
  }

  /**
   * Get deck duration
   */
  getDuration(deck: DeckId): number {
    this.ensureReady();
    const deckGraph = this.getDeck(deck);
    return deckGraph.duration;
  }

  /**
   * Check if deck has a track loaded
   */
  isLoaded(deck: DeckId): boolean {
    this.ensureReady();
    const deckGraph = this.getDeck(deck);
    return deckGraph.isLoaded;
  }

  /**
   * Get engine state
   */
  get state(): StudioEngineState {
    return this.engineState;
  }

  /**
   * Get control bus (for direct access if needed)
   */
  get controlBus(): ControlBus | null {
    return this.controlBusInstance;
  }

  // ==========================================================================
  // SYNC CONTROLS
  // ==========================================================================

  /**
   * Enable sync for a deck (slave) relative to another deck (master)
   *
   * @param deckId - Deck to sync (slave)
   * @param enabled - Whether to enable sync
   * @param masterDeckId - Master deck (defaults to the other deck)
   * @param mode - Sync mode: 'tempo-only' or 'tempo+phase' (default: 'tempo+phase')
   */
  setSyncEnabled(
    deckId: DeckId,
    enabled: boolean,
    masterDeckId?: DeckId,
    mode: 'tempo-only' | 'tempo+phase' = 'tempo+phase'
  ): void {
    this.ensureReady();

    if (!enabled) {
      this.syncController.disable();
      return;
    }

    // Determine master deck
    const master = masterDeckId || (deckId === 'A' ? 'B' : 'A');

    // Ensure both decks have tracks loaded
    if (!this.isLoaded(deckId) || !this.isLoaded(master)) {
      throw new Error('[StudioEngine] Both decks must have tracks loaded to enable sync');
    }

    try {
      this.syncController.enable(deckId, master);

      // Configure sync mode
      if (mode === 'tempo-only') {
        // Disable phase correction (set Ki to 0, increase smoothing)
        this.syncController.setParams({
          Ki: 0, // No integral term
          Kp: 0, // No proportional term (tempo-only = base rate only)
          smoothing: 0.99, // Very smooth (minimal rate changes)
        });
      } else {
        // Full PLL mode (default params)
        this.syncController.setParams({
          Kp: 0.1,
          Ki: 0.01,
          smoothing: 0.95,
        });
      }
    } catch (error) {
      console.error('[StudioEngine] Failed to enable sync:', error);
      throw error;
    }
  }

  /**
   * Get current sync state
   */
  getSyncState() {
    return this.syncController.getState();
  }

  /**
   * Get sync controller (for direct access if needed, e.g., for tick())
   */
  get sync(): SyncController {
    return this.syncController;
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private getDeck(deck: DeckId): DeckGraph {
    const deckGraph = deck === 'A' ? this.deckA : this.deckB;
    if (!deckGraph) {
      throw new Error(`[StudioEngine] Deck ${deck} not initialized`);
    }
    return deckGraph;
  }

  private ensureReady(): void {
    if (this.engineState !== 'ready') {
      throw new Error(`[StudioEngine] Engine not ready. Current state: ${this.engineState}`);
    }
  }

  /**
   * Cleanup and dispose engine
   */
  dispose(): void {
    if (this.deckA) {
      this.deckA.dispose();
      this.deckA = null;
    }

    if (this.deckB) {
      this.deckB.dispose();
      this.deckB = null;
    }

    this.controlBusInstance = null;
    this.engineState = 'uninitialized';

    console.log('[StudioEngine] Disposed');
  }
}

// Export singleton instance getter
export const getStudioEngine = () => StudioEngine.getInstance();
