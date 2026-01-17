/**
 * BeatGridService.ts - Beat Grid Analysis Service
 *
 * Phase 9A: Service for managing beat grid analysis results
 *
 * Architecture:
 * - Singleton pattern
 * - Manages Web Worker for beat grid analysis
 * - Caches results by track URL/hash
 * - Provides beat grid data for sync operations
 */

export interface BeatGridData {
  bpm: number;
  downbeatTime: number; // Time of first downbeat in seconds
  beatTimestamps: number[]; // Array of all beat times in seconds
  confidence: number; // 0-1 confidence score
}

export type BeatGridServiceState =
  | "uninitialized"
  | "ready"
  | "analyzing"
  | "error";

/**
 * BeatGridService - Singleton service for beat grid analysis
 */
class BeatGridService {
  private static instance: BeatGridService | null = null;

  private serviceState: BeatGridServiceState = "uninitialized";
  private worker: Worker | null = null;

  // Cache for beat grid data (keyed by track URL or hash)
  private beatGridCache: Map<string, BeatGridData> = new Map();

  // Private constructor enforces singleton
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): BeatGridService {
    if (!BeatGridService.instance) {
      BeatGridService.instance = new BeatGridService();
    }
    return BeatGridService.instance;
  }

  /**
   * Initialize the beat grid service
   */
  async initialize(): Promise<void> {
    if (this.serviceState === "ready") {
      console.warn("[BeatGridService] Already initialized");
      return;
    }

    if (typeof window === "undefined") {
      throw new Error("[BeatGridService] Cannot initialize on server");
    }

    try {
      this.serviceState = "uninitialized";
      console.log("[BeatGridService] Initializing...");

      // Create Web Worker
      // Note: Worker is served from public/workers/ (compiled from src/workers/)
      this.worker = new Worker("/workers/beatgrid.worker.js", {
        type: "classic",
      });

      // Wait for worker ready (worker auto-initializes)
      await new Promise<void>((resolve) => {
        // Worker doesn't send READY, it just processes messages
        // So we resolve immediately
        setTimeout(resolve, 100); // Small delay to ensure worker is ready
      });

      this.serviceState = "ready";
      console.log("[BeatGridService] ✅ Initialization complete");
    } catch (error) {
      this.serviceState = "error";
      console.error("[BeatGridService] ❌ Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Analyze beat grid for an audio buffer
   *
   * @param audioBuffer - The audio buffer to analyze
   * @param cacheKey - Optional cache key for caching results
   * @returns Promise that resolves with beat grid data
   */
  async analyze(
    audioBuffer: AudioBuffer,
    cacheKey?: string,
  ): Promise<BeatGridData> {
    this.ensureReady();

    // Check cache
    if (cacheKey && this.beatGridCache.has(cacheKey)) {
      console.log("[BeatGridService] Using cached beat grid");
      return this.beatGridCache.get(cacheKey)!;
    }

    this.serviceState = "analyzing";

    try {
      // Extract channel data
      const numberOfChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;

      // Prepare channel data arrays
      const channelData: Float32Array[] = [];
      for (let i = 0; i < numberOfChannels; i++) {
        const channel = audioBuffer.getChannelData(i);
        channelData.push(new Float32Array(channel));
      }

      // Send analysis request to worker
      const result = await new Promise<BeatGridData>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("[BeatGridService] Analysis timeout"));
        }, 60000); // 1 minute timeout

        const handleResult = (event: MessageEvent) => {
          clearTimeout(timeout);
          this.worker?.removeEventListener("message", handleResult);

          if (event.data.error) {
            reject(new Error(event.data.error));
            return;
          }

          const beatGridData: BeatGridData = {
            bpm: event.data.bpm,
            downbeatTime: event.data.downbeatTime,
            beatTimestamps: event.data.beatTimestamps,
            confidence: event.data.confidence,
          };

          // Cache result
          if (cacheKey) {
            this.beatGridCache.set(cacheKey, beatGridData);
          }

          resolve(beatGridData);
        };

        this.worker?.addEventListener("message", handleResult);

        // Send analysis request
        this.worker?.postMessage({
          channelData,
          sampleRate,
        });
      });

      this.serviceState = "ready";
      return result;
    } catch (error) {
      this.serviceState = "error";
      console.error("[BeatGridService] ❌ Analysis failed:", error);
      throw error;
    }
  }

  /**
   * Get beat grid data from cache
   */
  getCached(cacheKey: string): BeatGridData | null {
    return this.beatGridCache.get(cacheKey) || null;
  }

  /**
   * Clear beat grid cache
   */
  clearCache(): void {
    this.beatGridCache.clear();
    console.log("[BeatGridService] Cache cleared");
  }

  /**
   * Get service state
   */
  get state(): BeatGridServiceState {
    return this.serviceState;
  }

  /**
   * Check if service is analyzing
   */
  get isAnalyzing(): boolean {
    return this.serviceState === "analyzing";
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private ensureReady(): void {
    if (this.serviceState !== "ready") {
      throw new Error(
        `[BeatGridService] Service not ready. Current state: ${this.serviceState}`,
      );
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

    this.beatGridCache.clear();
    this.serviceState = "uninitialized";

    console.log("[BeatGridService] Disposed");
  }
}

// Export singleton instance getter
export const getBeatGridService = () => BeatGridService.getInstance();
