"use client";

import { useRef, useEffect, useState } from "react";
import { Glitch, ChromaticAberration } from "@react-three/postprocessing";
import { GlitchMode } from "postprocessing";

interface GlitchControllerProps {
  getFrequencyData?: () => Uint8Array | null;
}

/**
 * GlitchController - Audio-reactive glitch effect
 *
 * Monitors high-frequency transients (treble) and triggers
 * glitch effects when peaks exceed threshold.
 *
 * This creates visual feedback for snare hits, sharp synth leads,
 * and other high-frequency transients, connecting audio to visuals.
 */
export function GlitchController({ getFrequencyData }: GlitchControllerProps) {
  const [isActive, setIsActive] = useState(false);
  const glitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!getFrequencyData) return;

    const checkTreble = () => {
      const frequencyData = getFrequencyData();
      if (!frequencyData) {
        requestAnimationFrame(checkTreble);
        return;
      }

      // Isolate high frequencies (treble) - top 20% of frequency array
      const trebleStart = Math.floor(frequencyData.length * 0.8);
      const trebleEnd = frequencyData.length;

      // Find peak in treble range
      let maxTreble = 0;
      for (let i = trebleStart; i < trebleEnd; i++) {
        maxTreble = Math.max(maxTreble, frequencyData[i]);
      }

      // Normalize to 0-1 range
      const normalizedTreble = maxTreble / 255.0;
      const threshold = 0.7; // Trigger glitch on strong transients

      // Trigger glitch if threshold exceeded
      if (normalizedTreble > threshold && !isActive) {
        setIsActive(true);

        // Clear any existing timeout
        if (glitchTimeoutRef.current) {
          clearTimeout(glitchTimeoutRef.current);
        }

        // Deactivate after 100ms
        glitchTimeoutRef.current = setTimeout(() => {
          setIsActive(false);
        }, 100);
      }

      requestAnimationFrame(checkTreble);
    };

    checkTreble();

    return () => {
      if (glitchTimeoutRef.current) {
        clearTimeout(glitchTimeoutRef.current);
      }
    };
  }, [getFrequencyData, isActive]);

  return (
    <>
      {/* Chromatic Aberration - Color separation effect */}
      <ChromaticAberration
        offset={isActive ? [0.002, 0.001] : [0.0005, 0.0005]}
        radialModulation={true}
      />

      {/* Glitch Effect - Screen distortion */}
      <Glitch
        delay={[0.5, 1.5]}
        duration={[0.1, 0.3]}
        strength={isActive ? [0.3, 0.5] : [0, 0.1]}
        mode={GlitchMode.SPORADIC}
      />
    </>
  );
}

