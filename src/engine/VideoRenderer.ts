/**
 * VideoRenderer.ts - GPU-accelerated video rendering with visualizer overlay
 *
 * Phase X: Service for rendering video with 3D visualizer overlays onto audio tracks
 * for social media sharing and high-quality exports.
 */

export interface RenderOptions {
  audioBlob: Blob;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  frameRate: number;
  bitRate: number; // Mbps
  format: 'webm' | 'mp4';
  duration?: number; // seconds, auto-detected from audio if not provided
  onProgress?: (progress: number) => void;
  onComplete?: (videoBlob: Blob) => void;
  onError?: (error: Error) => void;
}

export interface RenderProgress {
  frame: number;
  totalFrames: number;
  time: number; // seconds
  percentage: number;
}

/**
 * VideoRenderer - GPU-accelerated video rendering service
 */
class VideoRenderer {
  private static instance: VideoRenderer | null = null;

  private isRendering = false;
  private abortController: AbortController | null = null;

  // Private constructor enforces singleton
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): VideoRenderer {
    if (!VideoRenderer.instance) {
      VideoRenderer.instance = new VideoRenderer();
    }
    return VideoRenderer.instance;
  }

  /**
   * Render video with visualizer overlay
   */
  async renderVideo(options: RenderOptions): Promise<Blob> {
    if (this.isRendering) {
      throw new Error('Rendering already in progress');
    }

    this.isRendering = true;
    this.abortController = new AbortController();

    try {
      const {
        audioBlob,
        canvas,
        width,
        height,
        frameRate,
        bitRate,
        format,
        duration,
        onProgress,
        onComplete,
        onError,
      } = options;

      // Create audio context and buffer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await this.loadAudioBuffer(audioBlob, audioContext);

      // Determine duration
      const audioDuration = duration || audioBuffer.duration;
      const totalFrames = Math.ceil(audioDuration * frameRate);

      console.log(`[VideoRenderer] Starting render: ${totalFrames} frames, ${audioDuration.toFixed(1)}s`);

      // Set up canvas for rendering
      const originalWidth = canvas.width;
      const originalHeight = canvas.height;
      canvas.width = width;
      canvas.height = height;

      // Create video stream from canvas
      const videoStream = canvas.captureStream(frameRate);

      // Create audio stream
      const audioDestination = audioContext.createMediaStreamDestination();
      const audioSource = audioContext.createBufferSource();
      audioSource.buffer = audioBuffer;
      audioSource.connect(audioDestination);

      // Combine streams
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks(),
      ]);

      // Set up MediaRecorder
      const mimeType = this.getMimeType(format);
      const recorderOptions: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: bitRate * 1000000, // Convert Mbps to bps
        audioBitsPerSecond: 320000, // 320kbps audio
      };

      const mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
      const recordedChunks: Blob[] = [];

      return new Promise((resolve, reject) => {
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(recordedChunks, { type: mimeType });
          this.cleanup(canvas, originalWidth, originalHeight, audioContext);

          onComplete?.(videoBlob);
          resolve(videoBlob);
        };

        mediaRecorder.onerror = (event) => {
          const error = new Error('Video rendering failed');
          this.cleanup(canvas, originalWidth, originalHeight, audioContext);

          onError?.(error);
          reject(error);
        };

        // Start recording and audio playback
        mediaRecorder.start(100); // Collect data every 100ms
        audioSource.start(0);

        // Render frames
        this.renderFrames({
          canvas,
          audioBuffer,
          frameRate,
          totalFrames,
          onProgress,
          signal: this.abortController.signal,
        }).catch((error) => {
          mediaRecorder.stop();
          reject(error);
        });
      });

    } catch (error) {
      this.cleanup();
      onError?.(error as Error);
      throw error;
    } finally {
      this.isRendering = false;
      this.abortController = null;
    }
  }

  /**
   * Cancel current rendering
   */
  cancelRender(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isRendering = false;
  }

  /**
   * Check if currently rendering
   */
  isCurrentlyRendering(): boolean {
    return this.isRendering;
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private async loadAudioBuffer(blob: Blob, audioContext: AudioContext): Promise<AudioBuffer> {
    const arrayBuffer = await blob.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  }

  private getMimeType(format: 'webm' | 'mp4'): string {
    switch (format) {
      case 'webm':
        return MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm;codecs=vp8';
      case 'mp4':
        return MediaRecorder.isTypeSupported('video/mp4')
          ? 'video/mp4'
          : 'video/webm;codecs=vp8';
      default:
        return 'video/webm;codecs=vp8';
    }
  }

  private async renderFrames(options: {
    canvas: HTMLCanvasElement;
    audioBuffer: AudioBuffer;
    frameRate: number;
    totalFrames: number;
    onProgress?: (progress: number) => void;
    signal: AbortSignal;
  }): Promise<void> {
    const { canvas, audioBuffer, frameRate, totalFrames, onProgress, signal } = options;

    for (let frame = 0; frame < totalFrames; frame++) {
      // Check for cancellation
      if (signal.aborted) {
        throw new Error('Rendering cancelled');
      }

      const time = frame / frameRate;

      // Update canvas with visualizer state at this time
      await this.renderFrameAtTime(canvas, audioBuffer, time);

      // Report progress
      const progress = (frame + 1) / totalFrames;
      onProgress?.(progress);

      // Small delay to allow UI updates and prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  private async renderFrameAtTime(
    canvas: HTMLCanvasElement,
    audioBuffer: AudioBuffer,
    time: number
  ): Promise<void> {
    // Get audio data at this time point
    const sampleRate = audioBuffer.sampleRate;
    const frameSample = Math.floor(time * sampleRate);
    const samplesToAnalyze = Math.floor(sampleRate * 0.1); // Analyze 100ms of audio

    // Get frequency data (this would need to be implemented based on your visualizer)
    // For now, we'll create a placeholder that triggers a canvas render
    const frequencyData = this.getFrequencyDataAtTime(audioBuffer, frameSample, samplesToAnalyze);

    // Trigger canvas render with this audio data
    // This assumes your visualizer has a method to render at a specific time
    this.updateVisualizerForFrame(canvas, frequencyData, time);
  }

  private getFrequencyDataAtTime(
    audioBuffer: AudioBuffer,
    startSample: number,
    samplesToAnalyze: number
  ): Uint8Array {
    // Create analyzer node for frequency analysis
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const bufferLength = analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);

    // Create a temporary source to analyze the audio
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    // Connect through analyser
    source.connect(analyser);

    // Start playback from the desired position
    const startTime = startSample / audioBuffer.sampleRate;
    source.start(0, startTime, samplesToAnalyze / audioBuffer.sampleRate);

    // Get frequency data
    analyser.getByteFrequencyData(frequencyData);

    // Clean up
    source.stop();

    return frequencyData;
  }

  private updateVisualizerForFrame(
    canvas: HTMLCanvasElement,
    frequencyData: Uint8Array,
    time: number
  ): void {
    // This is a placeholder - you would need to integrate with your specific visualizer
    // The visualizer should have a method to render based on frequency data and time

    // For example, if using Three.js or a custom visualizer:
    // visualizer.updateFrequencyData(frequencyData);
    // visualizer.setTime(time);
    // visualizer.render();

    // For now, we'll just trigger a canvas render
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Simple visualization placeholder
    ctx.fillStyle = '#00ff00';
    for (let i = 0; i < frequencyData.length; i++) {
      const barHeight = (frequencyData[i] / 255) * canvas.height * 0.5;
      ctx.fillRect(
        (i / frequencyData.length) * canvas.width,
        canvas.height - barHeight,
        (canvas.width / frequencyData.length) - 1,
        barHeight
      );
    }

    // Add time overlay
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px monospace';
    ctx.fillText(`Time: ${time.toFixed(1)}s`, 10, 30);
  }

  private cleanup(
    canvas?: HTMLCanvasElement,
    originalWidth?: number,
    originalHeight?: number,
    audioContext?: AudioContext
  ): void {
    // Restore canvas size
    if (canvas && originalWidth && originalHeight) {
      canvas.width = originalWidth;
      canvas.height = originalHeight;
    }

    // Close audio context
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  dispose(): void {
    this.cancelRender();
    console.log('[VideoRenderer] Disposed');
  }
}

// Export singleton instance getter
export const getVideoRenderer = () => VideoRenderer.getInstance();
