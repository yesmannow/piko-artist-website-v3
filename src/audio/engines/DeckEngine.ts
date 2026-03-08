/**
 * DeckEngine - Core audio playback engine for a single deck
 *
 * Phase 1.1: Engine-First Architecture Refactor
 *
 * Responsibilities:
 * - Track loading (AudioBuffer management)
 * - Playback control (play/pause/stop/seek)
 * - Pitch control (with optional key lock)
 * - Hot cue system (8 slots)
 * - Loop system (quantized to beat grid)
 * - Sync logic (phase-lock to master BPM)
 * - Per-deck audio routing (EQ, filter, FX sends)
 *
 * Architecture:
 * - Pure TypeScript class (no React dependencies)
 * - Uses Tone.js for Web Audio abstraction
 * - Emits events for UI updates (React subscribes)
 * - Singleton refs per deck (A/B) managed by useAudioEngine
 *
 * Non-Negotiables (from copilot-instructions.md):
 * - Tone.js is the ONLY audio engine
 * - No alternate playback engines
 * - All audio routing must remain in Tone.js
 */

import * as Tone from 'tone';

export interface DeckConfig {
  deckId: 'A' | 'B';
  context: Tone.BaseContext;
}

export interface HotCue {
  slot: number;        // 0-7 (8 slots)
  timeSec: number;
  label?: string;
  color?: string;
}

export interface LoopPoints {
  startSec: number;
  endSec: number;
  enabled: boolean;
  quantized: boolean;
}

export interface DeckState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bpm: number;
  pitch: number;       // Playback rate multiplier (0.5 - 2.0)
  keyLockEnabled: boolean;
  hotCues: HotCue[];
  loop: LoopPoints | null;
  trackUrl: string | null;
}

export type DeckEventType =
  | 'stateChange'
  | 'trackLoaded'
  | 'playbackStart'
  | 'playbackStop'
  | 'hotCueSet'
  | 'loopSet'
  | 'error';

export interface DeckEvent {
  type: DeckEventType;
  data: Partial<DeckState> | { error?: Error };
}

type StemPlayers = {
  vocals: Tone.Player | null;
  drums: Tone.Player | null;
  bass: Tone.Player | null;
  other: Tone.Player | null;
};

type StemGains = {
  vocals: Tone.Gain | null;
  drums: Tone.Gain | null;
  bass: Tone.Gain | null;
  other: Tone.Gain | null;
};

type StemSource = string | AudioBuffer;
type StemSourceMap = {
  vocals: StemSource | null;
  drums: StemSource | null;
  bass: StemSource | null;
  other: StemSource | null;
};

/**
 * DeckEngine - Single deck audio engine
 *
 * Handles all audio processing for one deck (A or B)
 */
export class DeckEngine {
  private deckId: 'A' | 'B';
  private context: Tone.BaseContext;

  // Audio nodes (signal chain)
  private player: Tone.Player | null = null;
  private stemPlayers: StemPlayers = {
    vocals: null,
    drums: null,
    bass: null,
    other: null
  };

  private stemGains: StemGains = {
    vocals: null,
    drums: null,
    bass: null,
    other: null
  };

  private stemMutes = {
    vocals: false,
    drums: false,
    bass: false,
    other: false,
  };

  private channel: Tone.Channel | null = null;
  private eq: Tone.EQ3 | null = null;
  private filter: Tone.Filter | null = null;
  private pitchShift: Tone.PitchShift | null = null;
  private outputNode: Tone.Gain | null = null;

  // State
  private state: DeckState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    bpm: 128,
    pitch: 1.0,
    keyLockEnabled: false,
    hotCues: [],
    loop: null,
    trackUrl: null,
  };

  private lastRate = 1.0;

  // Event listeners
  private listeners: Map<DeckEventType, Set<(event: DeckEvent) => void>> = new Map();

  // Position tracking
  private positionUpdateInterval: number | null = null;
  private rafId: number | null = null;

  constructor(config: DeckConfig) {
    this.deckId = config.deckId;
    this.context = config.context;
    this.initAudioGraph();
  }

  /**
   * Initialize audio graph:
   *
   * Main Player → EQ → Filter → PitchShift → Channel → Output
   * Stem Players → Stem Gains → (merge) → EQ → ...
   *
   * Signal flow follows Tone.js best practices
   */
  private initAudioGraph(): void {
    // Create output chain (right to left in signal flow)
    this.outputNode = new Tone.Gain({ context: this.context, gain: 1.0 });
    this.channel = new Tone.Channel({ context: this.context, volume: 0, pan: 0 });
    this.pitchShift = new Tone.PitchShift({ context: this.context, pitch: 0 });
    this.filter = new Tone.Filter({ context: this.context, frequency: 20000, type: 'lowpass' });
    this.eq = new Tone.EQ3({ context: this.context, low: 0, mid: 0, high: 0 });

    // Connect chain
    this.eq.connect(this.filter);
    this.filter.connect(this.pitchShift);
    this.pitchShift.connect(this.channel);
    this.channel.connect(this.outputNode);

    console.log(`[DeckEngine ${this.deckId}] Audio graph initialized`);
  }

  /**
   * Load a track into this deck
   *
   * @param url - Track URL or AudioBuffer
   * @param bpm - Track BPM (for sync/quantization)
   */
  async loadTrack(url: string, bpm: number): Promise<void> {
    try {
      console.log(`[DeckEngine ${this.deckId}] Loading track: ${url.substring(0, 50)}...`);

      // Dispose old player if exists
      if (this.player) {
        this.player.dispose();
        this.player = null;
      }

      // Dispose old stem players
      this.disposeStems();

      // Create new player
      const buffer = await new Promise<Tone.ToneAudioBuffer>((resolve, reject) => {
        const b = new Tone.ToneAudioBuffer(
          url,
          () => resolve(b),
          (err) => reject(err as Error)
        );
      });

      console.log(`[DeckEngine ${this.deckId}] Buffer loaded, duration: ${buffer.duration.toFixed(2)}s`);
      
      this.player = new Tone.Player(buffer);
      this.player.loop = false;
      
      this.state.duration = buffer.duration;
      this.state.bpm = bpm;
      this.state.trackUrl = url;

      this.emit('trackLoaded', {
        duration: this.state.duration,
        bpm,
        trackUrl: url,
      });

      // Connect to audio graph
      this.player.connect(this.eq!);

    } catch (error) {
      console.error(`[DeckEngine ${this.deckId}] Failed to load track:`, error);
      this.emit('error', { error: error as Error });
      throw error;
    }
  }

  /**
   * Load stems for this track
   * Stems will be mixed together and routed through same FX chain
   */
  async loadStems(stems: StemSourceMap): Promise<void> {
    console.log(`[DeckEngine ${this.deckId}] Loading stems...`);

    // Dispose old stem players
    this.disposeStems();

    // Disable main player (stems replace it)
    if (this.player) {
      this.player.disconnect();
    }

    // Create new stem players + gain nodes
    const stemEntries = Object.entries(stems) as [keyof StemSourceMap, StemSource | null][];

    for (const [stemType, source] of stemEntries) {
      if (!source) continue;

      const player = new Tone.Player({
        url: source as string,
        loop: false
      });

      const gain = new Tone.Gain(1.0);

      // Connect: Player → Gain → EQ (start of main chain)
      player.connect(gain);
      gain.connect(this.eq!);

      this.stemPlayers[stemType] = player;
      this.stemGains[stemType] = gain;

      console.log(`[DeckEngine ${this.deckId}] Loaded stem: ${stemType}`);
    }

    await Tone.loaded();
    console.log(`[DeckEngine ${this.deckId}] All stems loaded`);
  }

  /**
   * Dispose all stem players and gains
   */
  private disposeStems(): void {
    Object.values(this.stemPlayers).forEach(p => p?.dispose());
    Object.values(this.stemGains).forEach(g => g?.dispose());

    this.stemPlayers = { vocals: null, drums: null, bass: null, other: null };
    this.stemGains = { vocals: null, drums: null, bass: null, other: null };
  }

  /**
   * Start playback
   */
  play(): void {
    // Check for player OR stems OR duration (if loaded but player somehow lost)
    if (!this.player && !this.hasStems() && this.state.duration <= 0) {
      console.warn(`[DeckEngine ${this.deckId}] No track loaded (player=${!!this.player}, stems=${this.hasStems()}, dur=${this.state.duration})`);
      return;
    }

    // Re-create player if duration is known but player is missing (e.g. after faulty dispose)
    if (!this.player && !this.hasStems() && this.state.trackUrl) {
      console.warn(`[DeckEngine ${this.deckId}] Player lost but trackUrl exists. Attempting recovery...`);
      this.loadTrack(this.state.trackUrl, this.state.bpm).then(() => this.play());
      return;
    }

    const now = Tone.now();
    const playbackOffset = this.state.currentTime;

    // Start main player or stems
    if (this.player && !this.hasStems()) {
      this.player.start(now, playbackOffset);
    } else {
      Object.values(this.stemPlayers).forEach(p => {
        if (p) p.start(now, playbackOffset);
      });
    }

    this.state.isPlaying = true;
    this.startPositionTracking();
    this.emit('playbackStart', { isPlaying: true });

    console.log(`[DeckEngine ${this.deckId}] Playback started at ${playbackOffset.toFixed(2)}s (now=${now.toFixed(2)})`);
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.player && !this.hasStems()) return;

    // Stop main player or stems
    if (this.player && !this.hasStems()) {
      this.player.stop();
    } else {
      Object.values(this.stemPlayers).forEach(p => p?.stop());
    }

    this.state.isPlaying = false;
    this.stopPositionTracking();
    this.emit('playbackStop', { isPlaying: false });

    console.log(`[DeckEngine ${this.deckId}] Playback paused`);
  }

  /**
   * Stop playback and reset to start
   */
  stop(): void {
    this.pause();
    this.seekTo(0);
  }

  /**
   * Seek to time (seconds)
   *
   * Note: Tone.js Player doesn't support true seeking while playing,
   * so we restart the player at the new offset
   */
  seekTo(timeSec: number): void {
    if (!this.player && !this.hasStems()) return;

    const clampedTime = Math.max(0, Math.min(timeSec, this.state.duration));
    const now = Tone.now();

    if (this.state.isPlaying) {
      // Stop and restart at new position
      if (this.player && !this.hasStems()) {
        this.player.stop(now);
        this.player.start(now, clampedTime);
      } else {
        Object.values(this.stemPlayers).forEach(p => {
          if (!p) return;
          p.stop(now);
          p.start(now, clampedTime);
        });
      }
    } else {
      // Seek while paused (stop immediately after starting)
      if (this.player && !this.hasStems()) {
        this.player.stop(now);
        this.player.start(now, clampedTime);
        this.player.stop(now + 0.001); // Stop almost immediately
      } else {
        Object.values(this.stemPlayers).forEach(p => {
          if (!p) return;
          p.stop(now);
          p.start(now, clampedTime);
          p.stop(now + 0.001);
        });
      }
    }

    this.state.currentTime = clampedTime;
    this.emit('stateChange', { currentTime: clampedTime });

    // FIX: Restart position tracking from the new offset if already playing
    if (this.state.isPlaying) {
      this.stopPositionTracking();
      this.startPositionTracking();
    }
  }

  /**
   * Set hot cue at slot (0-7)
   */
  setHotCue(slot: number, timeSec?: number, label?: string, color?: string): void {
    if (slot < 0 || slot > 7) {
      console.warn(`[DeckEngine ${this.deckId}] Invalid hot cue slot: ${slot}`);
      return;
    }

    const time = timeSec ?? this.state.currentTime;
    const cue: HotCue = { slot, timeSec: time, label, color };

    // Update or add cue
    const existingIndex = this.state.hotCues.findIndex(c => c.slot === slot);
    if (existingIndex >= 0) {
      this.state.hotCues[existingIndex] = cue;
    } else {
      this.state.hotCues.push(cue);
      this.state.hotCues.sort((a, b) => a.slot - b.slot); // Keep sorted
    }

    console.log(`[DeckEngine ${this.deckId}] Hot cue ${slot} set at ${time.toFixed(2)}s`);
    this.emit('hotCueSet', { hotCues: [...this.state.hotCues] });
  }

  /**
   * Jump to hot cue slot
   */
  jumpToHotCue(slot: number): void {
    const cue = this.state.hotCues.find(c => c.slot === slot);
    if (!cue) {
      console.warn(`[DeckEngine ${this.deckId}] No hot cue at slot ${slot}`);
      return;
    }

    console.log(`[DeckEngine ${this.deckId}] Jumping to hot cue ${slot} (${cue.timeSec.toFixed(2)}s)`);
    this.seekTo(cue.timeSec);
  }

  /**
   * Clear hot cue at slot
   */
  clearHotCue(slot: number): void {
    this.state.hotCues = this.state.hotCues.filter(c => c.slot !== slot);
    console.log(`[DeckEngine ${this.deckId}] Hot cue ${slot} cleared`);
    this.emit('hotCueSet', { hotCues: [...this.state.hotCues] });
  }

  /**
   * Set loop points (will be quantized in Phase 2)
   */
  setLoopPoints(startSec: number, endSec: number, quantized = false): void {
    this.state.loop = {
      startSec: Math.max(0, startSec),
      endSec: Math.min(endSec, this.state.duration),
      enabled: false,
      quantized,
    };

    console.log(`[DeckEngine ${this.deckId}] Loop points set: ${startSec.toFixed(2)}s - ${endSec.toFixed(2)}s`);
    this.emit('loopSet', { loop: this.state.loop });
  }

  /**
   * Enable/disable loop
   */
  enableLoop(enabled: boolean): void {
    if (!this.state.loop) {
      console.warn(`[DeckEngine ${this.deckId}] No loop points set`);
      return;
    }

    this.state.loop.enabled = enabled;

    // Apply to main player or stems
    if (this.player && !this.hasStems()) {
      if (enabled) {
        this.player.loop = true;
        this.player.loopStart = this.state.loop.startSec;
        this.player.loopEnd = this.state.loop.endSec;
      } else {
        this.player.loop = false;
      }
    } else {
      Object.values(this.stemPlayers).forEach(p => {
        if (!p) return;
        if (enabled) {
          p.loop = true;
          p.loopStart = this.state.loop!.startSec;
          p.loopEnd = this.state.loop!.endSec;
        } else {
          p.loop = false;
        }
      });
    }

    console.log(`[DeckEngine ${this.deckId}] Loop ${enabled ? 'enabled' : 'disabled'}`);
    this.emit('loopSet', { loop: this.state.loop });
  }

  /**
   * Clear loop points
   */
  clearLoopPoints(): void {
    this.state.loop = null;

    // Disable loop on players
    if (this.player) this.player.loop = false;
    Object.values(this.stemPlayers).forEach(p => { if (p) p.loop = false; });

    console.log(`[DeckEngine ${this.deckId}] Loop cleared`);
    this.emit('loopSet', { loop: null });
  }

  /**
   * Set EQ values (-Infinity to 0 dB)
   */
  setEQ(eq: { low: number; mid: number; high: number }): void {
    if (!this.eq) return;

    this.eq.low.value = eq.low;
    this.eq.mid.value = eq.mid;
    this.eq.high.value = eq.high;
  }

  /**
   * Set filter frequency (20 - 20000 Hz)
   */
  setFilter(frequency: number): void {
    if (!this.filter) return;
    this.filter.frequency.value = Math.max(20, Math.min(20000, frequency));
  }

  /**
   * Set pitch (playback rate multiplier)
   */
  setPitch(rate: number): void {
    const clampedRate = Math.max(0.5, Math.min(2.0, rate));
    this.lastRate = clampedRate;
    this.state.pitch = clampedRate;

    // Apply to main player or stems
    if (this.player && !this.hasStems()) {
      this.player.playbackRate = clampedRate;
    } else {
      Object.values(this.stemPlayers).forEach(p => {
        if (p) p.playbackRate = clampedRate;
      });
    }

    // Update key lock if enabled
    this.updatePitchShift();
  }

  /**
   * Enable/disable key lock (pitch preservation)
   */
  setKeyLock(enabled: boolean): void {
    this.state.keyLockEnabled = enabled;
    this.updatePitchShift();
    console.log(`[DeckEngine ${this.deckId}] Key lock ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update PitchShift node based on current rate and key lock state
   */
  private updatePitchShift(): void {
    if (!this.pitchShift) return;

    if (this.state.keyLockEnabled) {
      // Calculate semitones needed to counteract pitch change
      // semitones = 12 * log2(1 / rate)
      const semitones = -12 * Math.log2(this.lastRate);
      this.pitchShift.pitch = semitones;
      this.pitchShift.wet.value = 1;
    } else {
      this.pitchShift.pitch = 0;
      this.pitchShift.wet.value = 0;
    }
  }

  /**
   * Set volume (via channel node)
   */
  setVolume(volume: number): void {
    if (!this.channel) return;
    this.channel.volume.value = Tone.gainToDb(Math.max(0, Math.min(1, volume)));
  }

  /**
   * Set stem mute state
   */
  setStemMute(stem: keyof StemGains, isMuted: boolean): void {
    this.stemMutes[stem] = isMuted;

    const gain = this.stemGains[stem];
    if (!gain) return;

    // Smooth ramp to avoid clicks
    const now = Tone.now();
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(isMuted ? 0 : 1, now + 0.05);
  }

  /**
   * Get stem mute state
   */
  getStemMuteState(): { vocals: boolean; drums: boolean; bass: boolean; other: boolean } {
    return { ...this.stemMutes };
  }

  /**
   * Toggle stem mute
   */
  toggleStem(stem: keyof StemGains): void {
    this.setStemMute(stem, !this.stemMutes[stem]);
  }

  /**
   * Check if deck has stems loaded
   */
  private hasStems(): boolean {
    return Object.values(this.stemPlayers).some(p => p !== null);
  }

  /**
   * Get output node for mixer connection
   */
  getOutputNode(): Tone.ToneAudioNode {
    if (!this.outputNode) {
      throw new Error(`[DeckEngine ${this.deckId}] Output node not initialized`);
    }
    return this.outputNode;
  }

  /**
   * Get channel node (for mixer access)
   */
  getChannel(): Tone.Channel | null {
    return this.channel;
  }

  /**
   * Get current state (for UI sync)
   */
  getState(): Readonly<DeckState> {
    return { ...this.state };
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    return this.state.currentTime;
  }

  /**
   * Get track duration
   */
  getDuration(): number {
    return this.state.duration;
  }

  /**
   * Get BPM
   */
  getBPM(): number {
    return this.state.bpm;
  }

  /**
   * Subscribe to events
   */
  on(eventType: DeckEventType, callback: (event: DeckEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(type: DeckEventType, data: Partial<DeckState> | { error?: Error }): void {
    const event: DeckEvent = { type, data };
    this.listeners.get(type)?.forEach(callback => callback(event));
  }

  /**
   * Start position tracking (for UI updates)
   * Uses requestAnimationFrame for smooth 60fps updates
   */
  private startPositionTracking(): void {
    if (this.rafId !== null) return;

    const startTime = Tone.now();
    const startOffset = this.state.currentTime;

    const updatePosition = () => {
      if (!this.state.isPlaying) return;

      const elapsed = Tone.now() - startTime;
      this.state.currentTime = Math.min(startOffset + (elapsed * this.state.pitch), this.state.duration);

      this.emit('stateChange', { currentTime: this.state.currentTime });

      this.rafId = requestAnimationFrame(updatePosition);
    };

    this.rafId = requestAnimationFrame(updatePosition);
  }

  /**
   * Stop position tracking
   */
  private stopPositionTracking(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    console.log(`[DeckEngine ${this.deckId}] Disposing...`);

    this.stopPositionTracking();

    this.player?.dispose();
    this.disposeStems();

    this.channel?.dispose();
    this.eq?.dispose();
    this.filter?.dispose();
    this.pitchShift?.dispose();
    this.outputNode?.dispose();

    this.listeners.clear();

    console.log(`[DeckEngine ${this.deckId}] Disposed`);
  }
}
