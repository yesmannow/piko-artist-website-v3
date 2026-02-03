'use client';

import { useRef, useCallback, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  PanInfo,
} from 'framer-motion';

interface KnobProps {
  /** Current value (0.0 - 1.0) */
  readonly value?: number;
  /** Callback fired instantly during rotation with normalized value */
  readonly onValueChange?: (value: number) => void;
  /** Size of the knob in pixels */
  readonly size?: number;
  /** Rotation range in degrees (centered at 12 o'clock) */
  readonly rotationRange?: number;
  /** Label displayed below the knob */
  readonly label?: string;
  /** Disable interaction */
  readonly disabled?: boolean;
  /** Additional CSS classes */
  readonly className?: string;
  /** Sensitivity multiplier for drag-to-rotation */
  readonly sensitivity?: number;
}

/**
 * Hardware-emulated rotational knob component
 * Uses vertical drag gesture to simulate rotation (industry standard UX)
 * Maps drag distance to normalized 0.0 - 1.0 range
 */
export function Knob({
  value = 0.5,
  onValueChange,
  size = 48,
  rotationRange = 270, // Total rotation arc in degrees
  label,
  disabled = false,
  className = '',
  sensitivity = 1,
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);

  // Motion value for normalized position (0.0 - 1.0)
  const normalizedValue = useMotionValue(value);

  // Transform normalized value to rotation degrees
  // 0.0 = -135deg (7 o'clock), 1.0 = +135deg (5 o'clock)
  const rotation = useTransform(
    normalizedValue,
    [0, 1],
    [-rotationRange / 2, rotationRange / 2]
  );

  // Subscribe to motion value changes for instant callbacks
  useEffect(() => {
    const unsubscribe = normalizedValue.on('change', (latest) => {
      if (onValueChange && !disabled) {
        const clamped = Math.max(0, Math.min(1, latest));
        onValueChange(clamped);
      }
    });
    return unsubscribe;
  }, [normalizedValue, onValueChange, disabled]);

  // Sync external value changes
  useEffect(() => {
    normalizedValue.set(value);
  }, [value, normalizedValue]);

  // Vertical drag handler - dragging up increases value, down decreases
  const handlePan = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (disabled) return;

      const current = normalizedValue.get();
      // Negative delta.y because dragging UP should increase value
      const delta = -info.delta.y * sensitivity * 0.005;
      let newValue = current + delta;

      // Hard stops at 0 and 1 (hardware emulation)
      newValue = Math.max(0, Math.min(1, newValue));
      normalizedValue.set(newValue);
    },
    [normalizedValue, disabled, sensitivity]
  );

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Knob Container */}
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Outer ring / track indicator */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: 'var(--bg-tertiary, #2C2C2C)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
          }}
        />

        {/* Value arc indicator */}
        <svg
          className="absolute inset-0"
          viewBox="0 0 100 100"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="var(--bg-primary, #121212)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(rotationRange / 360) * 264} 264`}
            strokeDashoffset={-((360 - rotationRange) / 2 / 360) * 264}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="var(--accent-color, #009688)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(rotationRange / 360) * 264} 264`}
            style={{
              strokeDashoffset: useTransform(
                normalizedValue,
                [0, 1],
                [
                  (rotationRange / 360) * 264 - ((360 - rotationRange) / 2 / 360) * 264,
                  -((360 - rotationRange) / 2 / 360) * 264,
                ]
              ),
            }}
          />
        </svg>

        {/* Rotatable Knob Body */}
        <motion.div
          ref={knobRef}
          className="absolute cursor-grab active:cursor-grabbing touch-none"
          style={{
            width: size - 12,
            height: size - 12,
            top: 6,
            left: 6,
            rotate: rotation,
          }}
          onPan={handlePan}
          whileTap={{ scale: 0.98 }}
        >
          {/* Knob face */}
          <div
            className="w-full h-full rounded-full shadow-lg"
            style={{
              backgroundColor: 'var(--bg-secondary, #1E1E1E)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.05))',
              background: `
                radial-gradient(
                  ellipse at 30% 30%,
                  var(--bg-tertiary, #2C2C2C) 0%,
                  var(--bg-secondary, #1E1E1E) 50%,
                  var(--bg-primary, #121212) 100%
                )
              `,
            }}
          >
            {/* Position indicator tick */}
            <div
              className="absolute left-1/2 -translate-x-1/2 rounded-full"
              style={{
                width: 3,
                height: (size - 12) / 4,
                top: 4,
                backgroundColor: 'var(--accent-color, #009688)',
                boxShadow: '0 0 4px var(--accent-color, #009688)',
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Label */}
      {label && (
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--text-muted, #757575)' }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export default Knob;
