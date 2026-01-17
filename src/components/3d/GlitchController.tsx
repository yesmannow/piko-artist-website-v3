"use client";

import { useRef, useEffect, useState } from "react";
import { ChromaticAberration, Vignette } from "@react-three/postprocessing";

interface GlitchControllerProps {
  getFrequencyData?: () => Uint8Array | null;
  impactPulse?: boolean; // For session launch impact effect
  remixIntensity?: number; // 0-1, environmental reactivity trigger
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
export function GlitchController({
  getFrequencyData,
  impactPulse,
  remixIntensity = 0,
}: GlitchControllerProps) {
  const [flashIntensity, setFlashIntensity] = useState(0);
  const [vignetteIntensity, setVignetteIntensity] = useState(0.5);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const brightnessPulseRef = useRef<NodeJS.Timeout | null>(null);

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

  // Environmental Reactivity: remixIntensity > 0.7 triggers visual stress
  useEffect(() => {
    if (remixIntensity > 0.7) {
      // Trigger screen flicker (CRT scan-line interference)
      const flickerInterval = setInterval(() => {
        setFlashIntensity(0.3);
        setTimeout(() => setFlashIntensity(0), 50);
      }, 200);

      // Clear interval when intensity drops
      const cleanup = () => {
        clearInterval(flickerInterval);
      };

      brightnessPulseRef.current = setTimeout(cleanup, 1000);

      return () => {
        clearInterval(flickerInterval);
        if (brightnessPulseRef.current) {
          clearTimeout(brightnessPulseRef.current);
        }
      };
    } else {
      // Gradual fade when intensity drops
      setFlashIntensity(0);
    }
  }, [remixIntensity]);

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

      {/* Chromatic Aberration - Intensifies on impact pulse, treble transients, or remixIntensity */}
      <ChromaticAberration
        offset={
          flashIntensity > 0 || remixIntensity > 0.7
            ? [
                0.002 * Math.max(flashIntensity, remixIntensity),
                0.0015 * Math.max(flashIntensity, remixIntensity),
              ]
            : [0.0003, 0.0003]
        }
        radialModulation={true}
      />
    </>
  );
}

/**
 * Brightness filter wrapper - Applied to canvas container for remixIntensity reactivity
 * This is a separate component to be used outside the post-processing pipeline
 */
export function BrightnessFilter({ intensity }: { intensity: number }) {
  const brightness = 1.0 + (intensity > 0.7 ? (intensity - 0.7) * 0.67 : 0); // Maps 0.7-1.0 to 1.0-1.2

  return (
    <div
      className="absolute inset-0 pointer-events-none z-[1000]"
      style={{
        filter: `brightness(${brightness})`,
        mixBlendMode: "normal",
      }}
    />
  );
}
