/**
 * StemService - Manages Demucs worker and stem separation
 *
 * Handles:
 * - Worker instantiation and lifecycle
 * - Model download progress
 * - Stem conversion to AudioBuffer
 * - Cancellation on track change
 */

import { AudioContextManager } from '../../audio-engine/lib/AudioContextManager';

export interface StemSeparationProgress {
  progress: number; // 0-1
  stage: 'loading' | 'processing' | 'complete';
}

export interface StemSeparationResult {
  stems: Map<string, AudioBuffer>;
}

export class StemService {
  private worker: Worker | null = null;
  private isProcessing = false;
  private onProgressCallback?: (progress: StemSeparationProgress) => void;

  /**
   * Initialize the worker
   */
  async initialize(modelUrl: string = '/models/htdemucs_6s.onnx'): Promise<void> {
    if (this.worker) {
      return; // Already initialized
    }

    this.worker = new Worker(new URL('../../workers/demucs.worker.ts', import.meta.url), {
      type: 'module',
    });

    // Handle worker messages
    this.worker.onmessage = (e) => {
      const { type, value, error } = e.data;

      if (type === 'progress') {
        this.onProgressCallback?.({
          progress: value,
          stage: value < 1.0 ? 'processing' : 'complete',
        });
      } else if (type === 'result') {
        this.onProgressCallback?.({
          progress: 1.0,
          stage: 'complete',
        });
      } else if (type === 'error') {
        console.error('[StemService] Worker error:', error);
        this.onProgressCallback?.({
          progress: 0,
          stage: 'loading',
        });
      }
    };

    // Load the model
    this.worker.postMessage({ type: 'load', data: { modelUrl } });
  }

  /**
   * Separate audio into stems
   */
  async separateStems(
    audioBuffer: AudioBuffer,
    onProgress?: (progress: StemSeparationProgress) => void
  ): Promise<StemSeparationResult> {
    if (!this.worker) {
      throw new Error('StemService not initialized. Call initialize() first.');
    }

    if (this.isProcessing) {
      throw new Error('Separation already in progress');
    }

    this.isProcessing = true;
    this.onProgressCallback = onProgress;

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      // Handle result
      const resultHandler = (e: MessageEvent) => {
        if (e.data.type === 'result') {
          this.worker?.removeEventListener('message', resultHandler);
          this.isProcessing = false;

          // Convert Float32Array stems to AudioBuffer
          const manager = AudioContextManager.getInstance();
          const audioContext = manager.getContext();

          if (!audioContext) {
            reject(new Error('AudioContext not available'));
            return;
          }

          const stemBuffers = new Map<string, AudioBuffer>();

          // Convert each stem
          e.data.stems.forEach((stemData: Float32Array, name: string) => {
            const buffer = audioContext.createBuffer(
              1, // Mono
              stemData.length,
              audioContext.sampleRate
            );
            buffer.copyToChannel(new Float32Array(stemData), 0);
            stemBuffers.set(name, buffer);
          });

          resolve({ stems: stemBuffers });
        } else if (e.data.type === 'error') {
          this.worker?.removeEventListener('message', resultHandler);
          this.isProcessing = false;
          reject(new Error(e.data.error));
        }
      };

      this.worker.addEventListener('message', resultHandler);

      // Extract audio data from buffer
      const channelData = audioBuffer.getChannelData(0); // Use first channel
      const audioData = new Float32Array(channelData);

      // Send separation request
      this.worker.postMessage({
        type: 'separate',
        data: { audioData },
      });
    });
  }

  /**
   * Cancel ongoing separation
   */
  cancel(): void {
    if (this.worker && this.isProcessing) {
      this.worker.postMessage({ type: 'cancel' });
      this.isProcessing = false;
    }
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    this.cancel();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
