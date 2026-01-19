/**
 * AudioContextManager - Singleton AudioContext Manager
 *
 * Manages a single AudioContext instance across the application to prevent
 * audio glitches and ensure proper resource management.
 *
 * The AudioContext starts in 'suspended' state due to browser autoplay policies
 * and must be resumed via user interaction.
 */

import { MasterBus } from './MasterBus';

export class AudioContextManager {
  private static instance: AudioContextManager | null = null;
  private audioContext: AudioContext | null = null;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance of AudioContextManager
   */
  static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  /**
   * Get or create the AudioContext
   *
   * @returns The active AudioContext, or null if not available in this environment
   */
  getContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null; // Server-side rendering
    }

    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) {
        console.warn('[AudioContextManager] AudioContext not supported in this browser');
        return null;
      }

      this.audioContext = new AudioContextClass({
        sampleRate: 44100, // Standard sample rate
        latencyHint: 'interactive', // Low latency for real-time processing
      });

      // Initialize Master Bus when context is created
      const masterBus = MasterBus.getInstance();
      masterBus.initialize(this.audioContext);
    }

    return this.audioContext;
  }

  /**
   * Resume the AudioContext (required for autoplay policy compliance)
   *
   * This must be called from a user interaction context (button click, etc.)
   *
   * @returns Promise that resolves when the context is resumed
   */
  async resume(): Promise<void> {
    const context = this.getContext();
    if (!context) {
      throw new Error('AudioContext not available');
    }

    if (context.state === 'suspended') {
      await context.resume();
    }
  }

  /**
   * Get the current state of the AudioContext
   */
  getState(): AudioContextState | null {
    return this.audioContext?.state || null;
  }

  /**
   * Check if the AudioContext is ready (running state)
   */
  isReady(): boolean {
    return this.audioContext?.state === 'running' || false;
  }
}
