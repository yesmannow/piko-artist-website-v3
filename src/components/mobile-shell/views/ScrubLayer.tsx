"use client";

import { useRef, useEffect } from "react";
import { useDrag } from "@use-gesture/react";
import { useAudioStore } from "@/store/useAudioStore";
import { ensureAudioEngineReady } from "@/engine/AudioEngine";
import { triggerHaptic, HAPTIC_PATTERNS } from "@/utils/haptics";
import { useInertia } from "@/hooks/useInertia";

interface ScrubLayerProps {
  deckId: string;
}

/**
 * PHASE 3 & 5: Scrub Layer for Waveform Seeking
 *
 * Transparent touch layer over waveform that allows seeking by dragging.
 * Maps X position to track time and calls AudioEngine.seek().
 *
 * PHASE 3 Enhancements:
 * - Inertia/momentum scrolling after release
 * - Velocity-based haptic feedback
 * - Physical jog wheel feel
 */
export const ScrubLayer = ({ deckId }: ScrubLayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const deckState = useAudioStore((state) => state.decks[deckId]);
  const lastSeekTime = useRef(0);
  const isDragging = useRef(false);
  const engineReadyRef = useRef<Promise<
    Awaited<ReturnType<typeof ensureAudioEngineReady>>
  > | null>(null);

  const getEngine = () => {
    if (!engineReadyRef.current) {
      engineReadyRef.current = ensureAudioEngineReady();
    }
    return engineReadyRef.current;
  };

  // PHASE 3: Inertia for jog wheel feel
  const { applyVelocity, stopInertia } = useInertia({
    friction: 0.93, // Moderate friction for scrub feel
    minVelocity: 0.1,
    onUpdate: (velocity) => {
      // Apply velocity to seek position
      if (!deckState.duration || isDragging.current) return;

      const delta = velocity * 0.01; // Scale velocity to seek delta
      const newTime = Math.max(
        0,
        Math.min(deckState.duration, lastSeekTime.current + delta),
      );

      getEngine()
        .then((engine) => {
          engine.seek(deckId, newTime);
          lastSeekTime.current = newTime;
        })
        .catch(() => {});

      try {
        // Subtle haptic tick during inertia
        if (Math.random() < 0.1) {
          // 10% chance per frame to avoid overwhelming
          triggerHaptic(HAPTIC_PATTERNS.JOG_TICK);
        }
      } catch (error) {
        // Silently fail
      }
    },
    onStop: () => {
      // Haptic feedback when inertia stops
      triggerHaptic(HAPTIC_PATTERNS.BUMP);
    },
  });

  // Drag gesture handler for scrubbing
  const bind = useDrag(
    ({ xy: [x], first, last, tap, velocity: [vx] }) => {
      if (!containerRef.current || !deckState.duration) return;

      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = x - rect.left;
      const progress = Math.max(0, Math.min(1, relativeX / rect.width));
      const seekTime = progress * deckState.duration;

      // Track dragging state
      if (first) {
        isDragging.current = true;
        stopInertia(); // Stop any existing inertia
        // Haptic feedback on touch start
        triggerHaptic(HAPTIC_PATTERNS.JOG_SCRUB);
      }

      // Seek to position
      getEngine()
        .then((engine) => {
          engine.seek(deckId, seekTime);
          lastSeekTime.current = seekTime;
        })
        .catch((error) => {
          console.warn("Seek failed:", error);
        });

      // PHASE 3: Apply inertia on release
      if (last) {
        isDragging.current = false;

        // Apply velocity for inertia effect
        const scaledVelocity = vx * 0.5; // Scale down gesture velocity
        if (Math.abs(scaledVelocity) > 0.1) {
          applyVelocity(scaledVelocity);
        }

        // Haptic feedback on release
        triggerHaptic(HAPTIC_PATTERNS.CLICK);
      }
    },
    {
      filterTaps: false, // Allow taps to seek
      pointer: { touch: true },
    },
  );

  // Stop inertia when component unmounts or deck changes
  useEffect(() => {
    return () => {
      stopInertia();
    };
  }, [deckId, stopInertia]);

  return (
    <div
      ref={containerRef}
      {...bind()}
      className="absolute inset-0 z-10 cursor-pointer touch-none"
      style={{ touchAction: "none" }}
    />
  );
};
