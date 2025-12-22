"use client";

import { useRef } from "react";

/**
 * Custom hook for playing sound effects
 * Uses HTML5 Audio API for lightweight sound playback
 */
export function useSFX() {
  const diceShakeRef = useRef<HTMLAudioElement | null>(null);
  const diceThrowRef = useRef<HTMLAudioElement | null>(null);
  const sprayControlRef = useRef<HTMLAudioElement | null>(null);

  const playDiceShake = () => {
    if (!diceShakeRef.current) {
      diceShakeRef.current = new Audio("/audio/sfx/dice-shake.mp3");
      diceShakeRef.current.volume = 0.5;
    }
    diceShakeRef.current.currentTime = 0;
    diceShakeRef.current.play().catch((err) => {
      console.warn("Failed to play dice shake sound:", err);
    });
  };

  const playDiceThrow = () => {
    if (!diceThrowRef.current) {
      diceThrowRef.current = new Audio("/audio/sfx/dice-throw.mp3");
      diceThrowRef.current.volume = 0.5;
    }
    diceThrowRef.current.currentTime = 0;
    diceThrowRef.current.play().catch((err) => {
      console.warn("Failed to play dice throw sound:", err);
    });
  };

  const playSprayControl = () => {
    if (!sprayControlRef.current) {
      sprayControlRef.current = new Audio("/audio/sfx/spray-shake.mp3");
      sprayControlRef.current.volume = 0.5;
    }
    sprayControlRef.current.currentTime = 0;
    sprayControlRef.current.play().catch((err) => {
      console.warn("Failed to play spray control sound:", err);
    });
  };

  return {
    playDiceShake,
    playDiceThrow,
    playSprayControl,
  };
}

