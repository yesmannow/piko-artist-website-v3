/**
 * RealtimeAudioSystem - Real-time Audio Bootstrap Layer
 *
 * Phase 4: Real-time audio primitives
 * - Initializes AudioContext with latencyHint:'interactive'
 * - Loads AudioWorklet modules
 * - Creates SharedArrayBuffer control plane
 * - Provides low-level audio infrastructure without UI dependencies
 *
 * Constraints:
 * - No DSP on main thread
 * - No HTML <audio> elements
 * - Singleton pattern for global audio context
 * - Strict TypeScript
 */

import { createSharedControlBlock, ControlBus } from "./control/ControlBus";
import type { ControlBlockViews } from "./control/ControlLayout";
import type {
  WorkletInitMessage,
  FromWorkletMessage,
} from "./control/messages";

export type AudioSystemState =
  | "uninitialized"
  | "initializing"
  | "ready"
  | "error";

export interface RealtimeAudioSystemConfig {
  latencyHint?: "interactive" | "balanced" | "playback";
  sampleRate?: number;
  workletModules?: string[];
}

class RealtimeAudioSystem {
  private static instance: RealtimeAudioSystem | null = null;

  private audioContext: AudioContext | null = null;
  private audioDestination: AudioDestinationNode | null = null;
  private systemState: AudioSystemState = "uninitialized";
  private initializationError: Error | null = null;

  // Phase 4: Control plane
  private controlBlock: ControlBlockViews | null = null;
  private controlBusInstance: ControlBus | null = null;
  private mixerWorkletNode: AudioWorkletNode | null = null;

  // Private constructor enforces singleton pattern
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): RealtimeAudioSystem {
    if (!RealtimeAudioSystem.instance) {
      RealtimeAudioSystem.instance = new RealtimeAudioSystem();
    }
    return RealtimeAudioSystem.instance;
  }

  /**
   * Initialize the real-time audio system
   * Must be called after user gesture (iOS requirement)
   *
   * @param config - Configuration options
   * @returns Promise that resolves when initialization is complete
   */
  public async initialize(
    config: RealtimeAudioSystemConfig = {},
  ): Promise<void> {
    if (this.systemState === "ready") {
      console.warn("[RealtimeAudioSystem] Already initialized");
      return;
    }

    if (this.systemState === "initializing") {
      console.warn("[RealtimeAudioSystem] Initialization already in progress");
      return;
    }

    try {
      this.systemState = "initializing";
      console.log("[RealtimeAudioSystem] Initializing...");

      // Create AudioContext with optimal settings for real-time audio
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error("AudioContext not supported in this browser");
      }

      this.audioContext = new AudioContextClass({
        latencyHint: config.latencyHint || "interactive",
        sampleRate: config.sampleRate || 44100,
      });

      console.log(
        `[RealtimeAudioSystem] AudioContext created: ${this.audioContext.state}, sampleRate: ${this.audioContext.sampleRate}Hz`,
      );

      // Store destination reference
      this.audioDestination = this.audioContext.destination;

      // Resume if suspended (Safari/iOS requirement)
      if (this.audioContext.state === "suspended") {
        console.log("[RealtimeAudioSystem] Resuming suspended AudioContext...");
        await this.audioContext.resume();
      }

      // Phase 4: Create SharedArrayBuffer control block
      try {
        console.log(
          "[RealtimeAudioSystem] Creating SharedArrayBuffer control block...",
        );
        this.controlBlock = createSharedControlBlock();
        this.controlBusInstance = new ControlBus(this.controlBlock);
        console.log("[RealtimeAudioSystem] ✓ Control block created");
      } catch (sabError) {
        console.error(
          "[RealtimeAudioSystem] ❌ Failed to create control block:",
          sabError,
        );
        throw sabError;
      }

      // Load AudioWorklet modules if specified
      const workletModules = config.workletModules || [
        "/worklets/mixer-processor.js",
      ];

      let workletLoaded = false;
      for (const modulePath of workletModules) {
        try {
          console.log(`[RealtimeAudioSystem] Loading worklet: ${modulePath}`);
          await this.audioContext.audioWorklet.addModule(modulePath);
          console.log(`[RealtimeAudioSystem] ✓ Loaded worklet: ${modulePath}`);
          workletLoaded = true;
        } catch (workletError) {
          // Log worklet load error but don't fail initialization
          // The worklet file may not exist yet (Phase 4 dependency)
          console.warn(
            `[RealtimeAudioSystem] ⚠ Failed to load worklet ${modulePath}:`,
            workletError,
          );
          // Store as warning but continue - this is expected if worklet file doesn't exist yet
        }
      }

      // Phase 4: Create mixer worklet node if worklet loaded successfully
      if (workletLoaded && this.controlBlock) {
        try {
          console.log("[RealtimeAudioSystem] Creating mixer worklet node...");
          this.mixerWorkletNode = new AudioWorkletNode(
            this.audioContext,
            "mixer-processor",
          );

          // Send initialization message with SharedArrayBuffer
          const initMessage: WorkletInitMessage = {
            kind: "INIT",
            sab: this.controlBlock.sab,
          };

          this.mixerWorkletNode.port.postMessage(initMessage);

          // Listen for worklet responses
          this.mixerWorkletNode.port.onmessage = (
            event: MessageEvent<FromWorkletMessage>,
          ) => {
            const msg = event.data;

            if (msg.kind === "READY") {
              console.log("[RealtimeAudioSystem] ✓ Mixer worklet ready");
            } else if (msg.kind === "ERROR") {
              console.error(
                "[RealtimeAudioSystem] Mixer worklet error:",
                msg.error,
              );
            }
          };

          // Connect mixer to destination
          this.mixerWorkletNode.connect(this.audioDestination);

          console.log(
            "[RealtimeAudioSystem] ✓ Mixer worklet node created and connected",
          );
        } catch (nodeError) {
          console.warn(
            "[RealtimeAudioSystem] ⚠ Failed to create mixer worklet node:",
            nodeError,
          );
          // Don't fail initialization - worklet is optional for now
        }
      }

      this.systemState = "ready";
      console.log("[RealtimeAudioSystem] ✅ Initialization complete");
    } catch (error) {
      this.systemState = "error";
      this.initializationError =
        error instanceof Error ? error : new Error(String(error));
      console.error("[RealtimeAudioSystem] ❌ Initialization failed:", error);
      throw this.initializationError;
    }
  }

  /**
   * Get the AudioContext instance
   * @throws Error if system is not initialized
   */
  public get context(): AudioContext {
    if (!this.audioContext) {
      throw new Error(
        "[RealtimeAudioSystem] AudioContext not initialized. Call initialize() first.",
      );
    }
    return this.audioContext;
  }

  /**
   * Get the audio destination node
   * @throws Error if system is not initialized
   */
  public get destination(): AudioDestinationNode {
    if (!this.audioDestination) {
      throw new Error(
        "[RealtimeAudioSystem] AudioDestination not initialized. Call initialize() first.",
      );
    }
    return this.audioDestination;
  }

  /**
   * Get current system state
   */
  public get state(): AudioSystemState {
    return this.systemState;
  }

  /**
   * Get initialization error if any
   */
  public get error(): Error | null {
    return this.initializationError;
  }

  /**
   * Check if system is ready
   */
  public get isReady(): boolean {
    return this.systemState === "ready";
  }

  /**
   * Get the control bus for high-frequency UI control updates
   * @throws Error if system is not initialized or control bus not created
   */
  public get controlBus(): ControlBus {
    if (!this.controlBusInstance) {
      throw new Error(
        "[RealtimeAudioSystem] ControlBus not initialized. Call initialize() first and ensure crossOriginIsolated=true.",
      );
    }
    return this.controlBusInstance;
  }

  /**
   * Get the mixer worklet node (if created)
   */
  public get mixerNode(): AudioWorkletNode | null {
    return this.mixerWorkletNode;
  }

  /**
   * Resume AudioContext if suspended
   * Useful for handling iOS audio unlock after user gesture
   */
  public async resume(): Promise<void> {
    if (!this.audioContext) {
      console.warn(
        "[RealtimeAudioSystem] Cannot resume: AudioContext not initialized",
      );
      return;
    }

    if (this.audioContext.state === "suspended") {
      console.log("[RealtimeAudioSystem] Resuming AudioContext...");
      await this.audioContext.resume();
      console.log("[RealtimeAudioSystem] AudioContext resumed");
    }
  }
}

// Export singleton instance getter
export const getRealtimeAudioSystem = () => RealtimeAudioSystem.getInstance();
