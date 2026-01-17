import { useRef, useCallback, useEffect } from "react";

/**
 * PHASE 3: Inertia Hook for Physical Gesture Feel
 *
 * Implements exponential ramp-down (tape-stop effect) for gestures.
 * Used for virtual jog wheels, faders, and other touch controls.
 *
 * @example
 * ```tsx
 * const { velocity, applyVelocity, stopInertia } = useInertia({
 *   friction: 0.95,
 *   minVelocity: 0.01,
 *   onUpdate: (vel) => setRotation(prev => prev + vel)
 * });
 *
 * useDrag({
 *   onDrag: ({ movement: [mx, my], velocity: [vx] }) => {
 *     applyVelocity(vx);
 *   }
 * });
 * ```
 */

interface UseInertiaOptions {
  /**
   * Friction coefficient (0-1). Higher = more friction, slower decay.
   * Default: 0.95 (5% velocity loss per frame)
   */
  friction?: number;

  /**
   * Minimum velocity threshold. Below this, inertia stops.
   * Default: 0.01
   */
  minVelocity?: number;

  /**
   * Callback fired on each animation frame with current velocity.
   */
  onUpdate?: (velocity: number) => void;

  /**
   * Optional callback when inertia stops.
   */
  onStop?: () => void;
}

/**
 * Hook return value
 */
interface UseInertiaReturn {
  /**
   * Current velocity value
   */
  velocity: number;

  /**
   * Set/apply velocity (starts inertia animation)
   */
  applyVelocity: (vel: number) => void;

  /**
   * Stop inertia immediately
   */
  stopInertia: () => void;

  /**
   * Check if inertia is currently active
   */
  isActive: boolean;
}

export function useInertia(options: UseInertiaOptions = {}): UseInertiaReturn {
  const { friction = 0.95, minVelocity = 0.01, onUpdate, onStop } = options;

  const velocityRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);

  /**
   * Stop the inertia animation
   */
  const stopInertia = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const wasActive = isActiveRef.current;
    isActiveRef.current = false;
    velocityRef.current = 0;

    if (wasActive && onStop) {
      onStop();
    }
  }, [onStop]);

  /**
   * Animation frame loop for exponential decay
   */
  const animate = useCallback(() => {
    const currentVel = velocityRef.current;

    // Check if velocity is below threshold
    if (Math.abs(currentVel) < minVelocity) {
      stopInertia();
      return;
    }

    // Apply friction (exponential decay)
    velocityRef.current = currentVel * friction;

    // Call update callback
    if (onUpdate) {
      onUpdate(velocityRef.current);
    }

    // Schedule next frame
    rafRef.current = requestAnimationFrame(animate);
  }, [friction, minVelocity, onUpdate, stopInertia]);

  /**
   * Apply/set velocity and start inertia animation
   */
  const applyVelocity = useCallback(
    (vel: number) => {
      // Cancel any existing animation
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      // Set new velocity
      velocityRef.current = vel;
      isActiveRef.current = true;

      // Start animation loop if velocity is significant
      if (Math.abs(vel) >= minVelocity) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        isActiveRef.current = false;
      }
    },
    [animate, minVelocity],
  );

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    velocity: velocityRef.current,
    applyVelocity,
    stopInertia,
    isActive: isActiveRef.current,
  };
}

/**
 * PHASE 3: Tape Stop Effect Hook
 *
 * Specialized version of useInertia with slower, more dramatic decay.
 * Simulates the sound of a tape deck slowing to a stop.
 *
 * @example
 * ```tsx
 * const { applyTapeStop } = useTapeStopEffect({
 *   onUpdate: (vel) => setPitch(vel / 100)
 * });
 * ```
 */
export function useTapeStopEffect(options: UseInertiaOptions = {}) {
  return useInertia({
    friction: 0.92, // More aggressive friction for tape stop feel
    minVelocity: 0.05,
    ...options,
  });
}
