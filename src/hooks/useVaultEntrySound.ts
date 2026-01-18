"use client";

import { useRef, useEffect } from "react";
import { useAudioStore } from "@/stores/useAudioStore";

/**
 * useVaultEntrySound - Plays low-frequency hydraulic "hiss" sound effect
 *
 * Triggered when LogoIntro finishes its animation and the site is revealed.
 * Creates an immersive "vault opening" experience.
 */
export function useVaultEntrySound(shouldPlay: boolean) {
  const { audioContext } = useAudioStore();
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (!shouldPlay || !audioContext || hasPlayedRef.current) {
      return;
    }

    hasPlayedRef.current = true;

    // Create low-frequency hydraulic "hiss" using oscillator
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filterNode = audioContext.createBiquadFilter();

    // Configure for low-frequency hydraulic sound
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(60, audioContext.currentTime); // Low frequency
    oscillator.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.8); // Descend

    // Filter for hydraulic character
    filterNode.type = "lowpass";
    filterNode.frequency.value = 200;
    filterNode.Q.value = 2;

    // Gain envelope: quick attack, slow release
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2);

    // Connect: oscillator -> filter -> gain -> destination
    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Start and stop
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1.2);

    // Cleanup
    return () => {
      try {
        oscillator.stop();
        oscillator.disconnect();
        filterNode.disconnect();
        gainNode.disconnect();
      } catch {
        // Already stopped
      }
    };
  }, [shouldPlay, audioContext]);
}

