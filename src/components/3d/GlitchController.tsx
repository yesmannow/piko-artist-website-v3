"use client";

import { useRef, useEffect, useState } from "react";
import { ChromaticAberration, Vignette } from "@react-three/postprocessing";

interface GlitchControllerProps {
  getFrequencyData?: () => Uint8Array | null;
  impactPulse?: boolean; // For session launch impact effect
}

/**
 * GlitchController - Cinematic Film Grain & Flash effects
 *
 * Replaces digital glitch with professional music video aesthetic:
 * - Film Grain overlay (constant subtle texture)
 * - Cinematic Flash (white flash on snare/treble transients)
 *
 * Monitors high-frequency transients (treble) and triggers
 * flash effects when peaks exceed threshold, mimicking
 * professional music video editing.
 */
export function GlitchController({ getFrequencyData, impactPulse }: GlitchControllerProps) {
  const [flashIntensity, setFlashIntensity] = useState(0);
  const [vignetteIntensity, setVignetteIntensity] = useState(0.5);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle impact pulse effect (session launch)
  useEffect(() => {
    if (impactPulse) {
      // Intensify flash and vignette for impact
      setFlashIntensity(1.0);
      setVignetteIntensity(0.8);

      // Reset after 300ms
      setTimeout(() => {
        setFlashIntensity(0);
        setVignetteIntensity(0.5);
      }, 300);
    }
  }, [impactPulse]);

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

      // Trigger cinematic flash on strong transients (snare hits, sharp synth leads)
      if (normalizedTreble > threshold) {
        // Set flash intensity (0-1)
        setFlashIntensity(0.8);

        // Clear any existing timeout
        if (flashTimeoutRef.current) {
          clearTimeout(flashTimeoutRef.current);
        }

        // Fade flash out over 150ms (smooth cinematic fade)
        flashTimeoutRef.current = setTimeout(() => {
          setFlashIntensity(0);
        }, 150);
      } else {
        // Gradual fade if no new transients
        setFlashIntensity((prev) => Math.max(0, prev * 0.9));
      }

      requestAnimationFrame(checkTreble);
    };

    checkTreble();

    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, [getFrequencyData]);

  return (
    <>
      {/* Vignette - Creates cinematic depth, intensifies on impact pulse */}
      <Vignette eskil={false} offset={0.1} darkness={vignetteIntensity} />

      {/* Chromatic Aberration - Intensifies on impact pulse or treble transients */}
      <ChromaticAberration
        offset={flashIntensity > 0 ? [0.002 * flashIntensity, 0.0015 * flashIntensity] : [0.0003, 0.0003]}
        radialModulation={true}
      />
    </>
  );
}

