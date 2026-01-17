/**
 * AutomixEngine.ts - AI-Driven Automix Engine Service
 *
 * Phase X: Service for managing intelligent automated mixing sequences
 *
 * Features:
 * - Automated crossfading with constant-power transitions
 * - Phase-locked sync automation
 * - Intelligent track sequencing
 * - Real-time compatibility analysis
 */

import { getAudioEngine } from "../engine/AudioEngine";
import { getBeatGridService } from "../engine/BeatGridService";
import { getKeyService } from "../engine/rt/analysis/KeyService";
import {
  type TrackMetadata,
  calculateCompatibilityScore,
  rankCompatibleTracks,
  findNextCompatibleTrack,
  calculateConstantPowerCrossfade,
  calculatePhaseAlignment,
} from "../utils/automix";

export interface AutomixState {
  isActive: boolean;
  masterDeck: "deckA" | "deckB" | null;
  nextTrack: TrackMetadata | null;
  transitionProgress: number; // 0-1
  transitionDuration: number; // seconds
  isTransitioning: boolean;
}

export interface AutomixSettings {
  transitionDuration: number; // seconds
  vibeMatching: boolean;
  autoStartNext: boolean;
  crossfadeCurve: "linear" | "constant-power";
}

/**
 * AutomixEngine - Service for managing automated mixing sequences
 */
class AutomixEngine {
  private static instance: AutomixEngine | null = null;

  private audioEngine = getAudioEngine();
  private beatGridService = getBeatGridService();
  private keyService = getKeyService();

  private state: AutomixState = {
    isActive: false,
    masterDeck: null,
    nextTrack: null,
    transitionProgress: 0,
    transitionDuration: 8, // 8 seconds default
    isTransitioning: false,
  };

  private settings: AutomixSettings = {
    transitionDuration: 8,
    vibeMatching: true,
    autoStartNext: true,
    crossfadeCurve: "constant-power",
  };

  private transitionTimer: NodeJS.Timeout | null = null;
  private libraryTracks: TrackMetadata[] = [];

  // Private constructor enforces singleton
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): AutomixEngine {
    if (!AutomixEngine.instance) {
      AutomixEngine.instance = new AutomixEngine();
    }
    return AutomixEngine.instance;
  }

  /**
   * Initialize the automix engine with track library
   */
  async initialize(libraryTracks: TrackMetadata[]): Promise<void> {
    this.libraryTracks = libraryTracks;

    // Initialize analysis services
    await Promise.all([
      this.beatGridService.initialize(),
      this.keyService.initialize(),
    ]);

    console.log(
      "[AutomixEngine] Initialized with",
      libraryTracks.length,
      "tracks",
    );
  }

  /**
   * Start automix sequence
   */
  async startAutomix(
    masterDeck: "deckA" | "deckB",
    initialTrack: TrackMetadata,
    settings?: Partial<AutomixSettings>,
  ): Promise<boolean> {
    if (this.state.isActive) {
      console.warn("[AutomixEngine] Automix already active");
      return false;
    }

    // Update settings
    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }

    // Analyze initial track if needed
    const analyzedTrack = await this.ensureTrackAnalysis(initialTrack);

    this.state = {
      ...this.state,
      isActive: true,
      masterDeck,
      nextTrack: null,
      transitionProgress: 0,
      isTransitioning: false,
    };

    console.log(
      "[AutomixEngine] Started automix on",
      masterDeck,
      "with track:",
      initialTrack.title,
    );

    // Find first compatible track
    await this.prepareNextTrack(analyzedTrack);

    return true;
  }

  /**
   * Stop automix sequence
   */
  stopAutomix(): void {
    if (!this.state.isActive) return;

    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }

    this.state = {
      ...this.state,
      isActive: false,
      isTransitioning: false,
      transitionProgress: 0,
    };

    console.log("[AutomixEngine] Stopped automix");
  }

  /**
   * Trigger manual transition to next track
   */
  async triggerTransition(): Promise<boolean> {
    if (
      !this.state.isActive ||
      !this.state.nextTrack ||
      this.state.isTransitioning
    ) {
      return false;
    }

    return this.performTransition();
  }

  /**
   * Update automix settings
   */
  updateSettings(settings: Partial<AutomixSettings>): void {
    this.settings = { ...this.settings, ...settings };
    console.log("[AutomixEngine] Settings updated:", settings);
  }

  /**
   * Get current automix state
   */
  getState(): AutomixState {
    return { ...this.state };
  }

  /**
   * Get current settings
   */
  getSettings(): AutomixSettings {
    return { ...this.settings };
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private async ensureTrackAnalysis(
    track: TrackMetadata,
  ): Promise<TrackMetadata> {
    const analyzedTrack = { ...track };

    // Analyze BPM if not present
    if (!analyzedTrack.bpm && analyzedTrack.type === "audio") {
      try {
        const audioBuffer = await this.loadAudioBuffer(analyzedTrack.src);
        if (audioBuffer) {
          const beatGrid = await this.beatGridService.analyze(
            audioBuffer,
            analyzedTrack.id,
          );
          analyzedTrack.bpm = beatGrid.bpm;
          analyzedTrack.duration = audioBuffer.duration;
        }
      } catch (error) {
        console.warn(
          "[AutomixEngine] Failed to analyze BPM for",
          track.title,
          error,
        );
      }
    }

    // Analyze key if not present
    if (!analyzedTrack.camelot && analyzedTrack.type === "audio") {
      try {
        const audioBuffer = await this.loadAudioBuffer(analyzedTrack.src);
        if (audioBuffer) {
          const keyResult = await this.keyService.analyzeKey(
            audioBuffer,
            analyzedTrack.id,
          );
          if (keyResult.available) {
            analyzedTrack.camelot = keyResult.camelot;
          }
        }
      } catch (error) {
        console.warn(
          "[AutomixEngine] Failed to analyze key for",
          track.title,
          error,
        );
      }
    }

    return analyzedTrack;
  }

  private async loadAudioBuffer(src: string): Promise<AudioBuffer | null> {
    try {
      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error("[AutomixEngine] Failed to load audio buffer:", error);
      return null;
    }
  }

  private async prepareNextTrack(currentTrack: TrackMetadata): Promise<void> {
    if (!this.state.isActive) return;

    const nextTrack = findNextCompatibleTrack(
      currentTrack,
      this.libraryTracks,
      this.settings.vibeMatching,
    );

    if (nextTrack) {
      // Pre-analyze next track
      this.state.nextTrack = await this.ensureTrackAnalysis(nextTrack);
      console.log("[AutomixEngine] Next track prepared:", nextTrack.title);
    } else {
      console.warn("[AutomixEngine] No compatible next track found");
      this.state.nextTrack = null;
    }
  }

  private async performTransition(): Promise<boolean> {
    if (!this.state.masterDeck || !this.state.nextTrack) return false;

    const masterDeck = this.state.masterDeck;
    const slaveDeck = masterDeck === "deckA" ? "deckB" : "deckA";
    const nextTrack = this.state.nextTrack;

    this.state.isTransitioning = true;
    this.state.transitionProgress = 0;

    console.log("[AutomixEngine] Starting transition to:", nextTrack.title);

    try {
      // Load next track on slave deck
      await this.audioEngine.loadTrack(slaveDeck, nextTrack.src);

      // Analyze current master track for timing
      const masterTrack = this.libraryTracks.find(
        (t) => t.id === this.getCurrentTrackId(masterDeck),
      );
      if (masterTrack) {
        await this.syncAndTransition(
          masterDeck,
          slaveDeck,
          masterTrack,
          nextTrack,
        );
      }

      // After transition completes
      setTimeout(() => {
        this.completeTransition(masterDeck, slaveDeck, nextTrack);
      }, this.settings.transitionDuration * 1000);

      return true;
    } catch (error) {
      console.error("[AutomixEngine] Transition failed:", error);
      this.state.isTransitioning = false;
      return false;
    }
  }

  private async syncAndTransition(
    masterDeck: "deckA" | "deckB",
    slaveDeck: "deckA" | "deckB",
    masterTrack: TrackMetadata,
    slaveTrack: TrackMetadata,
  ): Promise<void> {
    // Get current timing info
    const masterBPM = this.audioEngine.getBPM(masterDeck);
    const masterGridOffset = this.audioEngine.getGridOffset(masterDeck);
    const masterCurrentTime = this.getCurrentPlaybackTime(masterDeck);

    // Calculate phase alignment for seamless handoff
    const slaveStartTime = calculatePhaseAlignment(
      masterBPM,
      masterCurrentTime,
      masterGridOffset,
      slaveTrack.bpm || 120,
      0, // Assume slave starts at beat 0
    );

    // Start slave deck at calculated time
    this.audioEngine.seek(slaveDeck, Math.max(0, slaveStartTime));

    // Enable sync
    this.audioEngine.sync(slaveDeck, masterDeck);

    // Start crossfade
    this.startCrossfade(masterDeck, slaveDeck);
  }

  private startCrossfade(
    masterDeck: "deckA" | "deckB",
    slaveDeck: "deckA" | "deckB",
  ): void {
    const duration = this.settings.transitionDuration;
    const steps = 60; // 60 FPS updates
    const interval = (duration * 1000) / steps;
    let step = 0;

    const fadeInterval = setInterval(() => {
      step++;
      const progress = step / steps;
      this.state.transitionProgress = progress;

      let masterGain: number;
      let slaveGain: number;

      if (this.settings.crossfadeCurve === "constant-power") {
        const gains = calculateConstantPowerCrossfade(progress);
        masterGain = gains.left; // Master fades out
        slaveGain = gains.right; // Slave fades in
      } else {
        // Linear crossfade
        masterGain = 1 - progress;
        slaveGain = progress;
      }

      // Apply gains
      this.audioEngine.setVolume(masterDeck, masterGain);
      this.audioEngine.setVolume(slaveDeck, slaveGain);

      if (step >= steps) {
        clearInterval(fadeInterval);
      }
    }, interval);
  }

  private completeTransition(
    oldMaster: "deckA" | "deckB",
    newMaster: "deckA" | "deckB",
    newTrack: TrackMetadata,
  ): void {
    // Swap deck roles
    this.state.masterDeck = newMaster;
    this.state.isTransitioning = false;
    this.state.transitionProgress = 0;

    // Reset volumes
    this.audioEngine.setVolume(oldMaster, 0); // Mute old master
    this.audioEngine.setVolume(newMaster, 0.7); // Set new master to normal volume

    // Prepare next track
    this.prepareNextTrack(newTrack);

    console.log("[AutomixEngine] Transition completed. New master:", newMaster);
  }

  private getCurrentTrackId(deck: "deckA" | "deckB"): string | null {
    // This would need to be implemented based on how tracks are tracked in the audio store
    // For now, return null
    return null;
  }

  private getCurrentPlaybackTime(deck: "deckA" | "deckB"): number {
    // This would need to be implemented based on the audio engine's timing
    // For now, return 0
    return 0;
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  dispose(): void {
    this.stopAutomix();
    this.libraryTracks = [];
    console.log("[AutomixEngine] Disposed");
  }
}

// Export singleton instance getter
export const getAutomixEngine = () => AutomixEngine.getInstance();
