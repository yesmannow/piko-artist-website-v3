"use client";

import { useRef, useCallback, useEffect } from "react";

/**
 * useVelocityScratching - Velocity-based turntable scratching with friction physics
 *
 * Calculates movement velocity from pointer/touch coordinates and applies
 * friction-based deceleration to simulate high-torque platter physics.
 *
 * Features:
 * - Real-time velocity calculation from delta movement
 * - Friction coefficient for natural deceleration
 * - Maps velocity directly to AudioBufferSourceNode.playbackRate
 * - Smooth deceleration to 1.0x (or 0 if stopped) when released
 */
export function useVelocityScratching(
  sourceNode: AudioBufferSourceNode | null,
  isPlaying: boolean,
  onVelocityChange?: (velocity: number) => void
) {
  const velocityRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const lastDeltaRef = useRef<number>(0);
  const frictionCoefficient = 0.95; // High-torque platter friction (0.95 = slow deceleration)
  const frictionIntervalRef = useRef<number | null>(null);

  /**
   * Calculate velocity from delta angle movement
   * Velocity is in degrees per frame, normalized to playbackRate multiplier
   */
  const calculateVelocity = useCallback((deltaAngle: number) => {
    const now = performance.now();
    const lastTime = lastTimeRef.current;

    if (lastTime === null) {
      lastTimeRef.current = now;
      lastDeltaRef.current = deltaAngle;
      return 0;
    }

    const deltaTime = (now - lastTime) / 1000; // Convert to seconds
    lastTimeRef.current = now;

    if (deltaTime === 0) return velocityRef.current;

    // Calculate angular velocity (degrees per second)
    const angularVelocity = deltaAngle / deltaTime;

    // Normalize to playbackRate multiplier
    // Typical scratching: ±180 degrees/second = ±0.5x playbackRate
    // Scale factor: 0.5 / 180 = 0.00278
    const velocityMultiplier = angularVelocity * 0.00278;

    // Clamp to reasonable range (±2x playbackRate)
    const clampedVelocity = Math.max(-2.0, Math.min(2.0, velocityMultiplier));

    // Apply exponential smoothing for stability
    velocityRef.current = velocityRef.current * 0.7 + clampedVelocity * 0.3;
    lastDeltaRef.current = deltaAngle;

    return velocityRef.current;
  }, []);

  /**
   * Apply velocity to sourceNode playbackRate
   */
  const applyVelocity = useCallback(
    (velocity: number) => {
      if (!sourceNode || !isPlaying) return;

      // Calculate target playbackRate: base rate (1.0) + velocity
      const targetRate = 1.0 + velocity;

      // Clamp to valid range (0.25x to 4.0x)
      const clampedRate = Math.max(0.25, Math.min(4.0, targetRate));

      // Apply with smooth ramping to prevent clicks
      if (sourceNode.playbackRate) {
        const currentTime = sourceNode.context.currentTime;
        sourceNode.playbackRate.setTargetAtTime(clampedRate, currentTime, 0.01);
      }
    },
    [sourceNode, isPlaying]
  );

  /**
   * Handle scrub event with velocity calculation
   */
  const handleScrub = useCallback(
    (deltaAngle: number) => {
      const velocity = calculateVelocity(deltaAngle);
      applyVelocity(velocity);
      onVelocityChange?.(velocity);
    },
    [calculateVelocity, applyVelocity, onVelocityChange]
  };

  /**
   * Handle drag end - apply friction deceleration
   */
  const handleDragEnd = useCallback(() => {
    lastTimeRef.current = null;
    lastDeltaRef.current = 0;

    // Start friction deceleration loop
    if (frictionIntervalRef.current) {
      cancelAnimationFrame(frictionIntervalRef.current);
    }

    const applyFriction = () => {
      if (!sourceNode || !isPlaying) {
        velocityRef.current = 0;
        return;
      }

      // Apply friction: velocity *= frictionCoefficient
      velocityRef.current *= frictionCoefficient;

      // If velocity is very small, snap to 0
      if (Math.abs(velocityRef.current) < 0.01) {
        velocityRef.current = 0;
        applyVelocity(0);
        return;
      }

      // Continue deceleration
      applyVelocity(velocityRef.current);
      onVelocityChange?.(velocityRef.current);

      // Continue friction loop if still moving
      if (Math.abs(velocityRef.current) > 0.01) {
        frictionIntervalRef.current = requestAnimationFrame(applyFriction);
      } else {
        frictionIntervalRef.current = null;
      }
    };

    frictionIntervalRef.current = requestAnimationFrame(applyFriction);
  }, [sourceNode, isPlaying, applyVelocity, onVelocityChange]);

  /**
   * Reset velocity when playback stops
   */
  useEffect(() => {
    if (!isPlaying) {
      velocityRef.current = 0;
      if (frictionIntervalRef.current) {
        cancelAnimationFrame(frictionIntervalRef.current);
        frictionIntervalRef.current = null;
      }
    }
  }, [isPlaying]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (frictionIntervalRef.current) {
        cancelAnimationFrame(frictionIntervalRef.current);
      }
    };
  }, []);

  return {
    handleScrub,
    handleDragEnd,
    currentVelocity: velocityRef.current,
  };
}

