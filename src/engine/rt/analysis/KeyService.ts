/**
 * KeyService.ts - Key Detection Service
 *
 * Phase 9C: Service for managing key detection results
 *
 * Architecture:
 * - Singleton pattern
 * - Manages Web Worker for key analysis
 * - Caches results by track URL/hash
 * - Provides key data for harmonic mixing
 */

import {
  toCamelot,
  type KeyResult,
  type KeyRoot,
  type KeyScale,
} from "@/utils/camelot";

export interface KeyAnalysisResult extends KeyResult {
  available: boolean; // True if key was successfully detected, false if unavailable
  error?: string; // Error message if detection failed
}

export type KeyServiceState = "uninitialized" | "ready" | "analyzing" | "error";

/**
 * KeyService - Singleton service for key detection
 */
class KeyService {
  private static instance: KeyService | null = null;

  private serviceState: KeyServiceState = "uninitialized";
  private worker: Worker | null = null;

  // Cache for key data (keyed by track URL or hash)
  private keyCache: Map<string, KeyAnalysisResult> = new Map();

  // Private constructor enforces singleton
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): KeyService {
    if (!KeyService.instance) {
      KeyService.instance = new KeyService();
    }
    return KeyService.instance;
  }

  /**
   * Initialize the key service
   */
  async initialize(): Promise<void> {
    if (this.serviceState === "ready") {
      console.warn("[KeyService] Already initialized");
      return;
    }

    if (typeof window === "undefined") {
      throw new Error("[KeyService] Cannot initialize on server");
    }

    try {
      this.serviceState = "uninitialized";
      console.log("[KeyService] Initializing...");

      // Create Web Worker
      // Note: Worker is served from public/workers/ (compiled from src/workers/)
      this.worker = new Worker("/workers/key.worker.js", { type: "classic" });

      // Wait for worker ready (small delay to ensure worker is ready)
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });

      this.serviceState = "ready";
      console.log("[KeyService] ✅ Initialization complete");
    } catch (error) {
      this.serviceState = "error";
      console.error("[KeyService] ❌ Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Analyze key for an audio buffer
   *
   * @param audioBuffer - The audio buffer to analyze
   * @param cacheKey - Optional cache key for caching results
   * @returns Promise that resolves with key analysis result
   */
  async analyzeKey(
    audioBuffer: AudioBuffer,
    cacheKey?: string,
  ): Promise<KeyAnalysisResult> {
    this.ensureReady();

    // Check cache
    if (cacheKey && this.keyCache.has(cacheKey)) {
      console.log("[KeyService] Using cached key");
      return this.keyCache.get(cacheKey)!;
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
      const result = await new Promise<KeyAnalysisResult>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("[KeyService] Analysis timeout"));
        }, 60000); // 1 minute timeout

        let hasError = false;
        let errorMessage: string | undefined;

        const handleResult = (event: MessageEvent) => {
          if (event.data.type === "ANALYZE_KEY_ERROR") {
            // Error received, but may still get a result
            hasError = true;
            errorMessage = event.data.error;
            console.warn("[KeyService] Key analysis error:", event.data.error);
            // Don't reject yet - wait for DONE message
          } else if (event.data.type === "ANALYZE_KEY_DONE") {
            clearTimeout(timeout);
            this.worker?.removeEventListener("message", handleResult);

            const keyData = event.data.data;
            if (!keyData) {
              reject(new Error("No key data received"));
              return;
            }

            // Convert to KeyAnalysisResult
            const keyResult: KeyAnalysisResult = {
              root: keyData.root as KeyRoot,
              scale: keyData.scale as KeyScale,
              camelot: keyData.camelot,
              available: !hasError, // Available if no error occurred
              error: errorMessage,
            };

            // Ensure camelot is set (recalculate if needed)
            if (!keyResult.camelot) {
              const camelot = toCamelot(keyResult.root, keyResult.scale);
              keyResult.camelot = camelot || "8B"; // Default to C major
            }

            // Cache result
            if (cacheKey) {
              this.keyCache.set(cacheKey, keyResult);
            }

            resolve(keyResult);
          }
        };

        this.worker?.addEventListener("message", handleResult);

        // Send analysis request
        this.worker?.postMessage({
          type: "ANALYZE_KEY_START",
          input: {
            channelData,
            sampleRate,
          },
        });
      });

      this.serviceState = "ready";
      return result;
    } catch (error) {
      this.serviceState = "error";
      console.error("[KeyService] ❌ Analysis failed:", error);

      // Return unavailable result instead of throwing
      const unavailableResult: KeyAnalysisResult = {
        root: "C",
        scale: "major",
        camelot: "8B",
        available: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      // Cache unavailable result to avoid repeated attempts
      if (cacheKey) {
        this.keyCache.set(cacheKey, unavailableResult);
      }

      return unavailableResult;
    }
  }

  /**
   * Get key data from cache
   */
  getCached(cacheKey: string): KeyAnalysisResult | null {
    return this.keyCache.get(cacheKey) || null;
  }

  /**
   * Clear key cache
   */
  clearCache(): void {
    this.keyCache.clear();
    console.log("[KeyService] Cache cleared");
  }

  /**
   * Get service state
   */
  get state(): KeyServiceState {
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
        `[KeyService] Service not ready. Current state: ${this.serviceState}`,
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

    this.keyCache.clear();
    this.serviceState = "uninitialized";

    console.log("[KeyService] Disposed");
  }
}

// Export singleton instance getter
export const getKeyService = () => KeyService.getInstance();
