/**
 * useIOSAudioUnlock - iOS Audio Context Unlock Hook
 *
 * Phase 4: iOS silent buffer unlock pattern
 * - Attaches one-time touch/pointer listener
 * - Plays a 1-sample silent buffer to unlock AudioContext
 * - Resumes AudioContext after user interaction
 *
 * This is required for iOS Safari which blocks audio until user gesture.
 *
 * Constraints:
 * - No DSP on main thread (uses Web Audio API)
 * - One-time setup with automatic cleanup
 */

import { useEffect, useRef } from "react";

export interface IOSAudioUnlockOptions {
  /**
   * Callback fired when audio is unlocked
   */
  onUnlock?: () => void;

  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * iOS Audio Unlock Hook
 *
 * Automatically unlocks iOS audio on first user interaction.
 * Returns true when audio has been unlocked.
 *
 * @param audioContext - The AudioContext to unlock
 * @param options - Configuration options
 * @returns boolean indicating if audio is unlocked
 */
export function useIOSAudioUnlock(
  audioContext: AudioContext | null,
  options: IOSAudioUnlockOptions = {},
): boolean {
  const { onUnlock, debug = false } = options;
  const isUnlockedRef = useRef(false);
  const listenerAttachedRef = useRef(false);

  useEffect(() => {
    // Early return if no context or already unlocked
    if (!audioContext || isUnlockedRef.current) {
      return;
    }

    // Early return if listener already attached
    if (listenerAttachedRef.current) {
      return;
    }

    const unlockAudio = async () => {
      if (isUnlockedRef.current) {
        return;
      }

      try {
        if (debug) {
          console.log("[useIOSAudioUnlock] Attempting to unlock audio...");
        }

        // Create a 1-sample silent buffer
        const buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);

        // Play the silent buffer (this unlocks iOS audio)
        source.start(0);

        // Stop immediately after (buffer is only 1 sample anyway)
        source.stop(audioContext.currentTime + 0.001);

        // Resume AudioContext if suspended
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        // Mark as unlocked
        isUnlockedRef.current = true;

        if (debug) {
          console.log("[useIOSAudioUnlock] ✅ Audio unlocked successfully");
        }

        // Call unlock callback
        if (onUnlock) {
          onUnlock();
        }

        // Clean up listeners
        removeListeners();
      } catch (error) {
        console.error("[useIOSAudioUnlock] Failed to unlock audio:", error);
      }
    };

    // Event handler for touch/pointer events
    const handleUserGesture = () => {
      unlockAudio();
    };

    // Attach listeners for first user interaction
    const attachListeners = () => {
      if (listenerAttachedRef.current) {
        return;
      }

      if (debug) {
        console.log("[useIOSAudioUnlock] Attaching unlock listeners...");
      }

      // Listen for both touch and pointer events for broad compatibility
      document.addEventListener("touchstart", handleUserGesture, {
        once: true,
        passive: true,
      });
      document.addEventListener("pointerdown", handleUserGesture, {
        once: true,
        passive: true,
      });

      // Also listen for click as fallback
      document.addEventListener("click", handleUserGesture, {
        once: true,
        passive: true,
      });

      listenerAttachedRef.current = true;
    };

    // Remove listeners
    const removeListeners = () => {
      if (!listenerAttachedRef.current) {
        return;
      }

      document.removeEventListener("touchstart", handleUserGesture);
      document.removeEventListener("pointerdown", handleUserGesture);
      document.removeEventListener("click", handleUserGesture);

      listenerAttachedRef.current = false;

      if (debug) {
        console.log("[useIOSAudioUnlock] Listeners removed");
      }
    };

    // Attach listeners on mount
    attachListeners();

    // Cleanup on unmount
    return () => {
      removeListeners();
    };
  }, [audioContext, onUnlock, debug]);

  return isUnlockedRef.current;
}
