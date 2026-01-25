/**
 * Engine.ts - Tone.js Singleton wrapper
 * 
 * This is the core audio engine that manages the AudioContext and Tone.js initialization.
 * It acts as the "Engine Room" - pure logic with no React dependencies.
 * 
 * Phase II: Core Architecture
 */

import * as Tone from 'tone';

/**
 * AudioEngine Singleton
 * Manages the global Tone.js context and ensures single initialization
 */
class AudioEngine {
  private static instance: AudioEngine;
  private context: Tone.Context | null = null;
  private initialized = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initialize the audio engine
   * Must be called in response to user interaction due to browser autoplay policies
   */
  public async init(): Promise<void> {
    if (this.initialized) {
      console.warn('AudioEngine already initialized');
      return;
    }

    try {
      await Tone.start();
      this.context = Tone.getContext();
      this.initialized = true;
      console.log('AudioEngine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AudioEngine:', error);
      throw error;
    }
  }

  /**
   * Get the Tone.js context
   */
  public getContext(): Tone.Context {
    if (!this.context) {
      throw new Error('AudioEngine not initialized. Call init() first.');
    }
    return this.context;
  }

  /**
   * Check if engine is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Cleanup and dispose of audio resources
   */
  public dispose(): void {
    if (this.context) {
      this.context.dispose();
      this.context = null;
      this.initialized = false;
    }
  }
}

export default AudioEngine;
