/**
 * StemService.ts - Stem Separation Service
 *
 * Phase 8A: Foundation for AI-powered stem separation
 *
 * Architecture:
 * - Singleton pattern (like StudioEngine)
 * - Manages Web Worker for stem separation
 * - Handles typed messages and progress tracking
 * - Uses Transferables for efficient buffer transfer
 * - Provides cancellation support
 *
 * Constraints:
 * - Must be initialized after user gesture
 * - Strict TypeScript
 * - Zero-copy buffer transfer using Transferables
 */

import { getRealtimeAudioSystem } from './rt/RealtimeAudioSystem';

export type StemType = 'vocals' | 'drums' | 'bass' | 'other';

export interface SeparatedStems {
  vocals: AudioBuffer | null;
  drums: AudioBuffer | null;
  bass: AudioBuffer | null;
  other: AudioBuffer | null;
}

export type StemServiceState = 'uninitialized' | 'initializing' | 'ready' | 'processing' | 'error';

export interface SeparationProgress {
  progress: number; // 0-100
  stage: string; // e.g., "Loading model", "Processing audio", "Finalizing"
}

export type ProgressCallback = (progress: SeparationProgress) => void;

/**
 * StemService - Singleton service for stem separation
 *
 * Manages the Web Worker that performs AI-powered stem separation
 * using neural networks (e.g., Demucs via Sherpa-ONNX).
 */
class StemService {
  private static instance: StemService | null = null;

  private serviceState: StemServiceState = 'uninitialized';
  private worker: Worker | null = null;
  private currentRequestId: string | null = null;
  private progressCallback: ProgressCallback | null = null;
  private cancellationToken: AbortController | null = null;

  // Cache for separated stems (keyed by audio buffer hash or URL)
  private stemCache: Map<string, SeparatedStems> = new Map();

  // Private constructor enforces singleton
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): StemService {
    if (!StemService.instance) {
      StemService.instance = new StemService();
    }
    return StemService.instance;
  }

  /**
   * Initialize the stem service
   * Must be called after user gesture
   *
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    if (this.serviceState === 'ready') {
      console.warn('[StemService] Already initialized');
      return;
    }

    if (this.serviceState === 'initializing') {
      console.warn('[StemService] Initialization already in progress');
      return;
    }

    if (typeof window === 'undefined') {
      throw new Error('[StemService] Cannot initialize on server');
    }

    try {
      this.serviceState = 'initializing';
      console.log('[StemService] Initializing...');

      // Create Web Worker
      // Note: Worker is served from public/workers/
      this.worker = new Worker('/workers/stemSeparator.worker.js', { type: 'classic' });

      // Wait for worker ready signal (worker auto-initializes on load)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('[StemService] Worker initialization timeout'));
        }, 10000);

        const handleReady = (event: MessageEvent) => {
          if (event.data.type === 'READY') {
            clearTimeout(timeout);
            this.worker?.removeEventListener('message', handleReady);

            // Set up main message handler after ready
            this.worker!.onmessage = this.handleWorkerMessage.bind(this);

            resolve();
          } else if (event.data.type === 'ERROR') {
            clearTimeout(timeout);
            this.worker?.removeEventListener('message', handleReady);
            reject(new Error(event.data.message || 'Worker initialization failed'));
          }
        };

        this.worker?.addEventListener('message', handleReady);

        this.worker.onerror = (error) => {
          console.error('[StemService] Worker error:', error);
          this.serviceState = 'error';
          clearTimeout(timeout);
          reject(error);
        };
      });

      this.serviceState = 'ready';
      console.log('[StemService] ✅ Initialization complete');

    } catch (error) {
      this.serviceState = 'error';
      console.error('[StemService] ❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Separate audio buffer into stems
   *
   * @param audioBuffer - The audio buffer to separate
   * @param onProgress - Optional callback for progress updates
   * @param cacheKey - Optional cache key for caching results
   * @returns Promise that resolves with separated stems
   */
  async separate(
    audioBuffer: AudioBuffer,
    onProgress?: ProgressCallback,
    cacheKey?: string
  ): Promise<SeparatedStems> {
    this.ensureReady();

    // Check cache
    if (cacheKey && this.stemCache.has(cacheKey)) {
      console.log('[StemService] Using cached stems');
      return this.stemCache.get(cacheKey)!;
    }

    // Cancel any existing separation
    if (this.serviceState === 'processing') {
      await this.cancel();
    }

    this.serviceState = 'processing';
    this.progressCallback = onProgress || null;
    this.cancellationToken = new AbortController();
    const requestId = this.generateRequestId();
    this.currentRequestId = requestId;

    try {
      // Extract channel data for transfer
      const numberOfChannels = audioBuffer.numberOfChannels;
      const length = audioBuffer.length;
      const sampleRate = audioBuffer.sampleRate;

      // Prepare channel data arrays for transfer
      const channelBuffers: ArrayBuffer[] = [];
      const channelArrays: Float32Array[] = [];

      for (let i = 0; i < numberOfChannels; i++) {
        const channelData = audioBuffer.getChannelData(i);
        // Create a new Float32Array with its own buffer for transfer
        const transferArray = new Float32Array(channelData.length);
        transferArray.set(channelData);
        channelArrays.push(transferArray);
        channelBuffers.push(transferArray.buffer);
      }

      // Send separation request to worker with transferables
      this.worker!.postMessage(
        {
          type: 'SEPARATE',
          requestId,
          data: {
            numberOfChannels,
            length,
            sampleRate,
            channelBuffers,
          },
        },
        channelBuffers // Transfer list: moves ownership, zero-copy
      );

      // Wait for completion
      const result = await new Promise<SeparatedStems>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('[StemService] Separation timeout'));
        }, 300000); // 5 minute timeout

        const handleComplete = (event: MessageEvent) => {
          if (event.data.type === 'SEPARATE_COMPLETE' && event.data.requestId === requestId) {
            clearTimeout(timeout);
            this.worker?.removeEventListener('message', handleComplete);

            // Convert ArrayBuffers back to AudioBuffers
            const rtAudio = getRealtimeAudioSystem();
            const context = rtAudio.context;

            const stems: SeparatedStems = {
              vocals: this.arrayBufferToAudioBuffer(
                context,
                event.data.stems.vocals,
                sampleRate,
                1 // Mono for stub
              ),
              drums: this.arrayBufferToAudioBuffer(
                context,
                event.data.stems.drums,
                sampleRate,
                1 // Mono for stub
              ),
              bass: this.arrayBufferToAudioBuffer(
                context,
                event.data.stems.bass,
                sampleRate,
                1 // Mono for stub
              ),
              other: this.arrayBufferToAudioBuffer(
                context,
                event.data.stems.other,
                sampleRate,
                1 // Mono for stub
              ),
            };

            // Cache result
            if (cacheKey) {
              this.stemCache.set(cacheKey, stems);
            }

            resolve(stems);
          } else if (event.data.type === 'SEPARATE_ERROR' && event.data.requestId === requestId) {
            clearTimeout(timeout);
            this.worker?.removeEventListener('message', handleComplete);
            reject(new Error(event.data.message || 'Separation failed'));
          }
        };

        this.worker?.addEventListener('message', handleComplete);
      });

      this.serviceState = 'ready';
      this.currentRequestId = null;
      this.progressCallback = null;
      this.cancellationToken = null;

      return result;

    } catch (error) {
      this.serviceState = 'ready';
      this.currentRequestId = null;
      this.progressCallback = null;
      this.cancellationToken = null;

      if (error instanceof Error && error.message === 'Cancelled') {
        throw error;
      }

      this.serviceState = 'error';
      console.error('[StemService] ❌ Separation failed:', error);
      throw error;
    }
  }

  /**
   * Cancel current separation
   */
  async cancel(): Promise<void> {
    if (this.serviceState !== 'processing' || !this.currentRequestId) {
      return;
    }

    if (this.cancellationToken) {
      this.cancellationToken.abort();
    }

    if (this.worker && this.currentRequestId) {
      this.worker.postMessage({
        type: 'CANCEL',
        requestId: this.currentRequestId,
      });
    }

    this.serviceState = 'ready';
    this.currentRequestId = null;
    this.progressCallback = null;
    this.cancellationToken = null;

    console.log('[StemService] Cancellation requested');
  }

  /**
   * Clear stem cache
   */
  clearCache(): void {
    this.stemCache.clear();
    console.log('[StemService] Cache cleared');
  }

  /**
   * Get service state
   */
  get state(): StemServiceState {
    return this.serviceState;
  }

  /**
   * Check if service is processing
   */
  get isProcessing(): boolean {
    return this.serviceState === 'processing';
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private handleWorkerMessage(event: MessageEvent): void {
    const { type, requestId } = event.data;

    // Handle progress updates
    if (type === 'PROGRESS' && requestId === this.currentRequestId) {
      if (this.progressCallback) {
        this.progressCallback({
          progress: event.data.progress || 0,
          stage: event.data.stage || 'Processing',
        });
      }
      return;
    }

    // Handle errors
    if (type === 'ERROR') {
      console.error('[StemService] Worker error:', event.data.message);
      if (this.serviceState === 'processing') {
        this.serviceState = 'error';
      }
      return;
    }
  }

  private arrayBufferToAudioBuffer(
    context: AudioContext,
    arrayBuffer: ArrayBuffer | null,
    sampleRate: number,
    numberOfChannels: number = 1
  ): AudioBuffer | null {
    if (!arrayBuffer) {
      return null;
    }

    const float32Array = new Float32Array(arrayBuffer);
    const audioBuffer = context.createBuffer(
      numberOfChannels,
      float32Array.length,
      sampleRate
    );

    // For mono, set the single channel
    if (numberOfChannels === 1) {
      audioBuffer.getChannelData(0).set(float32Array);
    } else {
      // For stereo, duplicate to both channels (stub mode)
      audioBuffer.getChannelData(0).set(float32Array);
      if (numberOfChannels > 1) {
        audioBuffer.getChannelData(1).set(float32Array);
      }
    }

    return audioBuffer;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private ensureReady(): void {
    if (this.serviceState !== 'ready') {
      throw new Error(`[StemService] Service not ready. Current state: ${this.serviceState}`);
    }
  }

  /**
   * Cleanup and dispose service
   */
  dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.stemCache.clear();
    this.currentRequestId = null;
    this.progressCallback = null;
    this.cancellationToken = null;
    this.serviceState = 'uninitialized';

    console.log('[StemService] Disposed');
  }
}

// Export singleton instance getter
export const getStemService = () => StemService.getInstance();
