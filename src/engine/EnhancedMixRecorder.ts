/**
 * EnhancedMixRecorder.ts - HD session recording with Pocket Vault integration
 *
 * Phase X: Enhanced recording system with high-quality audio/video capture,
 * automatic metadata generation, and local storage in Pocket Vault.
 */

import { getPocketVault, type RecordingMetadata } from './PocketVault';
import { getTrackHistory, type SessionHistory } from './TrackHistory';

export interface RecordingOptions {
  format?: 'audio/webm' | 'audio/ogg' | 'video/webm';
  bitRate?: number; // kbps (default 320)
  includeVideo?: boolean;
  canvasSelector?: string;
  djName?: string;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface RecordingSession {
  id: string;
  isRecording: boolean;
  startTime: Date | null;
  duration: number; // seconds
  format: string;
  bitRate: number;
  includeVideo: boolean;
}

/**
 * EnhancedMixRecorder - HD recording with Pocket Vault storage
 */
class EnhancedMixRecorder {
  private static instance: EnhancedMixRecorder | null = null;

  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private audioDestination: MediaStreamAudioDestinationNode | null = null;
  private videoStream: MediaStream | null = null;
  private currentSession: RecordingSession | null = null;
  private pocketVault = getPocketVault();
  private trackHistory = getTrackHistory();

  // Private constructor enforces singleton
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): EnhancedMixRecorder {
    if (!EnhancedMixRecorder.instance) {
      EnhancedMixRecorder.instance = new EnhancedMixRecorder();
    }
    return EnhancedMixRecorder.instance;
  }

  /**
   * Initialize the recorder
   */
  async initialize(): Promise<void> {
    await this.pocketVault.initialize();
    console.log('[EnhancedMixRecorder] Initialized');
  }

  /**
   * Start HD recording session
   */
  async startRecording(
    audioContext: AudioContext,
    masterNode: AudioNode,
    options: RecordingOptions = {}
  ): Promise<string> {
    const {
      format = 'audio/webm',
      bitRate = 320,
      includeVideo = false,
      canvasSelector = 'canvas',
      djName = 'Piko DJ',
      title = `Mix Session ${new Date().toLocaleDateString()}`,
    } = options;

    // End any current session
    if (this.currentSession?.isRecording) {
      await this.stopRecording();
    }

    // Start track history session
    const historySessionId = this.trackHistory.startSession();

    // Create session
    const sessionId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentSession = {
      id: sessionId,
      isRecording: false,
      startTime: null,
      duration: 0,
      format,
      bitRate,
      includeVideo,
    };

    try {
      // Ensure audio context is running
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create audio destination
      this.audioDestination = audioContext.createMediaStreamDestination();
      masterNode.connect(this.audioDestination);

      let combinedStream: MediaStream;

      if (includeVideo) {
        // Capture video from canvas
        const canvas = document.querySelector(canvasSelector) as HTMLCanvasElement;
        if (!canvas) {
          throw new Error(`Canvas element not found: ${canvasSelector}`);
        }

        this.videoStream = canvas.captureStream(30); // 30 FPS
        combinedStream = new MediaStream([
          ...this.videoStream.getVideoTracks(),
          ...this.audioDestination.stream.getAudioTracks(),
        ]);
      } else {
        combinedStream = this.audioDestination.stream;
      }

      // Configure MediaRecorder with HD settings
      const mimeType = this.getBestMimeType(format, bitRate);
      const recorderOptions: MediaRecorderOptions = {
        mimeType,
      };

      // Set bitrate if supported
      if ('audioBitsPerSecond' in recorderOptions || 'videoBitsPerSecond' in recorderOptions) {
        if (format.startsWith('audio/')) {
          (recorderOptions as any).audioBitsPerSecond = bitRate * 1000; // Convert to bps
        } else {
          (recorderOptions as any).videoBitsPerSecond = 2500000; // 2.5 Mbps for video
          (recorderOptions as any).audioBitsPerSecond = bitRate * 1000;
        }
      }

      this.mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
      this.recordedChunks = [];

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        await this.finalizeRecording(djName, title, options.description, options.tags);
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('[EnhancedMixRecorder] Recording error:', event);
        this.currentSession = null;
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.currentSession.isRecording = true;
      this.currentSession.startTime = new Date();

      console.log(`[EnhancedMixRecorder] Started HD recording: ${format} at ${bitRate}kbps`);
      return sessionId;

    } catch (error) {
      console.error('[EnhancedMixRecorder] Failed to start recording:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Stop recording and save to Pocket Vault
   */
  async stopRecording(): Promise<string | null> {
    if (!this.mediaRecorder || !this.currentSession?.isRecording) {
      return null;
    }

    return new Promise((resolve) => {
      // Set up one-time stop handler
      const originalOnStop = this.mediaRecorder!.onstop;
      this.mediaRecorder!.onstop = async () => {
        // Call original handler
        if (originalOnStop) {
          originalOnStop.call(this.mediaRecorder!, new Event('stop'));
        }

        // End track history session
        const historySession = this.trackHistory.endSession();

        // Resolve with session ID
        resolve(this.currentSession?.id || null);
      };

      // Stop recording
      this.mediaRecorder!.stop();
      this.currentSession!.isRecording = false;

      console.log('[EnhancedMixRecorder] Stopped recording');
    });
  }

  /**
   * Get current recording status
   */
  getRecordingStatus(): RecordingSession | null {
    if (!this.currentSession) return null;

    // Update duration if recording
    if (this.currentSession.isRecording && this.currentSession.startTime) {
      this.currentSession.duration = Math.floor(
        (Date.now() - this.currentSession.startTime.getTime()) / 1000
      );
    }

    return { ...this.currentSession };
  }

  /**
   * Cancel current recording without saving
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.currentSession?.isRecording) {
      this.mediaRecorder.stop();
      this.currentSession.isRecording = false;
    }

    this.cleanup();
    console.log('[EnhancedMixRecorder] Recording cancelled');
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private getBestMimeType(format: string, bitRate: number): string {
    const formats = [
      `${format};codecs=opus`,
      format,
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ];

    for (const mimeType of formats) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    // Fallback
    return 'audio/webm';
  }

  private async finalizeRecording(
    djName: string,
    title: string,
    description?: string,
    tags?: string[]
  ): Promise<void> {
    if (!this.currentSession || this.recordedChunks.length === 0) {
      this.cleanup();
      return;
    }

    try {
      // Create final blob
      const mimeType = this.getBestMimeType(this.currentSession.format, this.currentSession.bitRate);
      const blob = new Blob(this.recordedChunks, { type: mimeType });

      // Get tracklist from history
      const tracklist = this.trackHistory.getCurrentTracklist();

      // Create metadata
      const metadata: Omit<RecordingMetadata, 'id'> = {
        title,
        djName,
        description,
        duration: this.currentSession.duration,
        createdAt: this.currentSession.startTime || new Date(),
        format: this.currentSession.format as any,
        bitRate: this.currentSession.bitRate,
        fileSize: blob.size,
        tracklist: tracklist.map(track => ({
          id: track.trackId,
          title: track.title,
          artist: track.artist,
          startTime: Math.round((track.startedAt - (this.currentSession!.startTime!.getTime())) / 1000),
          endTime: track.endedAt ? Math.round((track.endedAt - (this.currentSession!.startTime!.getTime())) / 1000) : undefined,
          bpm: track.bpm,
          camelot: track.camelot,
        })),
        tags,
      };

      // Store in Pocket Vault
      const recordingId = await this.pocketVault.storeRecording(metadata, blob);

      console.log(`[EnhancedMixRecorder] Recording saved to Pocket Vault: ${recordingId}`);

    } catch (error) {
      console.error('[EnhancedMixRecorder] Failed to finalize recording:', error);
    } finally {
      this.cleanup();
    }
  }

  private cleanup(): void {
    // Disconnect audio destination
    if (this.audioDestination) {
      try {
        // Note: We don't disconnect here as it's managed by the caller
        this.audioDestination = null;
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    // Stop video stream
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }

    // Clear state
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.currentSession = null;
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  dispose(): void {
    this.cancelRecording();
    this.pocketVault.dispose();
    this.trackHistory.dispose();
    console.log('[EnhancedMixRecorder] Disposed');
  }
}

// Export singleton instance getter
export const getEnhancedMixRecorder = () => EnhancedMixRecorder.getInstance();
