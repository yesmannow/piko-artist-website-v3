import { create } from "zustand";

interface AudioStore {
  audioContext: AudioContext | null;
  isReady: boolean;
  isPlaying: boolean;
  initializeAudio: () => Promise<void>;
  setIsPlaying: (playing: boolean) => void;
}

/**
 * AudioStore - Zustand store for Web Audio API AudioContext (Singleton Pattern)
 *
 * This store manages the global AudioContext instance to ensure:
 * - Only one AudioContext exists (Singleton)
 * - Proper initialization with AudioWorklet support
 * - Browser autoplay policy compliance (user interaction required)
 *
 * The AudioContext is created in a 'suspended' state and must be resumed
 * via user interaction to comply with browser autoplay policies.
 */
export const useAudioStore = create<AudioStore>((set, get) => ({
  audioContext: null,
  isReady: false,
  isPlaying: false,

  /**
   * initializeAudio - Creates and initializes the AudioContext
   *
   * This must be called from a user interaction (click, touch, etc.)
   * to comply with browser autoplay policies. The context starts in
   * 'suspended' state and is automatically resumed.
   *
   * Registers the sidechain-processor AudioWorklet for DSP processing.
   */
  initializeAudio: async () => {
    // Return early if already initialized
    if (get().audioContext && get().isReady) {
      return;
    }

    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      console.warn("[AudioStore] Cannot initialize AudioContext on server");
      return;
    }

    try {
      // Create AudioContext (starts in 'suspended' state)
      const AudioContextClass = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      const audioContext = new AudioContextClass({
        sampleRate: 44100, // Standard sample rate
        latencyHint: "interactive", // Low latency for real-time processing
      });

      // Register the AudioWorklet module
      // This loads the sidechain-processor.js file that runs on the audio thread
      await audioContext.audioWorklet.addModule("/worklets/sidechain-processor.js");

      // Resume the context (required for autoplay policy compliance)
      // This must be called from a user interaction context
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      set({
        audioContext,
        isReady: audioContext.state === "running",
      });

      // Listen for state changes
      audioContext.addEventListener("statechange", () => {
        set({ isReady: audioContext.state === "running" });
      });
    } catch (error) {
      console.error("[AudioStore] Failed to initialize AudioContext:", error);
      set({ isReady: false });
    }
  },

  setIsPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
  },
}));

