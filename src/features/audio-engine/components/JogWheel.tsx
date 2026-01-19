"use client";

import { useRef, useEffect, useState } from 'react';
import { useGestures } from '@/hooks/useGestures';
import { useHaptic } from '@/hooks/useHaptic';

/**
 * JogWheel - Virtual turntable platter with inertia
 *
 * Implements Virtual Inertia: when user flicks and releases, the wheel
 * continues spinning with exponential velocity decay, mimicking physical mass.
 */
export interface JogWheelProps {
  onScratch?: (delta: number) => void; // Delta in degrees
  size?: number; // Diameter in pixels
  className?: string;
}

export function JogWheel({
  onScratch,
  size = 200,
  className = '',
}: JogWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [angularVelocity, setAngularVelocity] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastAngleRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const { triggerHaptic } = useHaptic();

  // Calculate angle from center point
  const getAngle = (x: number, y: number, centerX: number, centerY: number): number => {
    return Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
  };

  const gestures = useGestures({
    onDragStart: (e) => {
      // Stop any existing inertia animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setAngularVelocity(0);

      // Calculate initial angle
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        lastAngleRef.current = getAngle(e.clientX, e.clientY, centerX, centerY);
      }
    },
    onDrag: (deltaX, deltaY, e) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const currentAngle = getAngle(e.clientX, e.clientY, centerX, centerY);

      // Calculate angular delta (handle wrap-around)
      let deltaAngle = currentAngle - lastAngleRef.current;
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;

      // Update rotation
      setRotation((prev) => prev + deltaAngle);
      onScratch?.(deltaAngle);

      // Calculate velocity for inertia
      const velocity = gestures.getVelocity();
      const angularVel = Math.sqrt(velocity.x ** 2 + velocity.y ** 2) / (size / 2);
      setAngularVelocity(angularVel * (deltaAngle > 0 ? 1 : -1));

      lastAngleRef.current = currentAngle;

      // Haptic feedback on velocity changes
      if (Math.abs(angularVel) > 5) {
        triggerHaptic(10);
      }
    },
    onDragEnd: () => {
      // Start inertia decay animation
      const decay = () => {
        if (Math.abs(angularVelocity) < 0.1) {
          setAngularVelocity(0);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          return;
        }

        // Exponential decay: velocity *= 0.95 per frame
        setAngularVelocity((prev) => prev * 0.95);
        setRotation((prev) => prev + angularVelocity);
        onScratch?.(angularVelocity);

        animationFrameRef.current = requestAnimationFrame(decay);
      };

      animationFrameRef.current = requestAnimationFrame(decay);
    },
    onVelocity: (velocityX, velocityY) => {
      // Velocity tracking for haptic feedback
      const speed = Math.sqrt(velocityX ** 2 + velocityY ** 2);
      if (speed > 100) {
        triggerHaptic(5);
      }
    },
  });

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative rounded-full bg-glass-surface border border-glass-border touch-action-none ${className}`}
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
        transition: angularVelocity === 0 ? 'transform 0.1s' : 'none',
      }}
      {...gestures}
    >
      {/* Jog wheel visual elements */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-[#FFD700]" />
      </div>
      <div className="absolute inset-2 border-2 border-white/20 rounded-full" />
      <div className="absolute inset-4 border border-white/10 rounded-full" />
    </div>
  );
}
