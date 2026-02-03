'use client';

import { useRef, useCallback, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  PanInfo,
} from 'framer-motion';

interface FaderProps {
  /** Current value (0.0 - 1.0) */
  readonly value?: number;
  /** Callback fired instantly during drag with normalized value */
  readonly onValueChange?: (value: number) => void;
  /** Height of the fader track in pixels */
  readonly height?: number;
  /** Label displayed below the fader */
  readonly label?: string;
  /** Disable interaction */
  readonly disabled?: boolean;
  /** Additional CSS classes */
  readonly className?: string;
}

/**
 * Hardware-emulated vertical fader component
 * Uses Framer Motion for smooth, high-performance dragging
 * Maps physical drag distance to normalized 0.0 - 1.0 audio range
 */
export function Fader({
  value = 0.75,
  onValueChange,
  height = 120,
  label,
  disabled = false,
  className = '',
}: FaderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const handleHeight = 24;
  const trackHeight = height - handleHeight;

  // Motion value for handle position (pixels from top)
  // 0 = top (value 1.0), trackHeight = bottom (value 0.0)
  const y = useMotionValue((1 - value) * trackHeight);

  // Transform pixel position to normalized value (inverted: top = 1.0)
  const normalizedValue = useTransform(y, [0, trackHeight], [1, 0]);

  // Transform for the fill indicator height
  const fillHeight = useTransform(y, [0, trackHeight], [trackHeight, 0]);

  // Subscribe to motion value changes for instant callbacks
  useEffect(() => {
    const unsubscribe = normalizedValue.on('change', (latest) => {
      if (onValueChange && !disabled) {
        // Clamp to 0-1 range
        const clamped = Math.max(0, Math.min(1, latest));
        onValueChange(clamped);
      }
    });
    return unsubscribe;
  }, [normalizedValue, onValueChange, disabled]);

  // Sync external value changes
  useEffect(() => {
    const targetY = (1 - value) * trackHeight;
    y.set(targetY);
  }, [value, trackHeight, y]);

  const handleDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (disabled) return;

      const currentY = y.get();
      let newY = currentY + info.delta.y;

      // Hard stops at top and bottom (hardware emulation)
      newY = Math.max(0, Math.min(trackHeight, newY));
      y.set(newY);
    },
    [y, trackHeight, disabled]
  );

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Fader Track */}
      <div
        ref={trackRef}
        className="relative rounded-sm"
        style={{
          width: 32,
          height: height,
          backgroundColor: 'var(--bg-tertiary, #2C2C2C)',
        }}
      >
        {/* Fill Indicator */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-sm"
          style={{
            width: 4,
            height: fillHeight,
            backgroundColor: 'var(--accent-color, #009688)',
          }}
        />

        {/* Track groove */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: 4,
            height: trackHeight,
            top: handleHeight / 2,
            backgroundColor: 'var(--bg-primary, #121212)',
          }}
        />

        {/* Draggable Handle */}
        <motion.div
          className="absolute left-0 right-0 mx-auto cursor-grab active:cursor-grabbing touch-none"
          style={{
            y,
            width: 28,
            height: handleHeight,
            left: 2,
          }}
          drag="y"
          dragConstraints={{ top: 0, bottom: trackHeight }}
          dragElastic={0}
          dragMomentum={false}
          onDrag={handleDrag}
          whileTap={{ scale: 1.05 }}
        >
          {/* Handle body */}
          <div
            className="w-full h-full rounded-sm shadow-lg"
            style={{
              backgroundColor: 'var(--bg-secondary, #1E1E1E)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.05))',
            }}
          >
            {/* Center indicator line */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 16,
                height: 2,
                backgroundColor: 'var(--accent-color, #009688)',
              }}
            />
            {/* Grip lines */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1 flex flex-col gap-0.5">
              <div className="w-3 h-px bg-neutral-600" />
              <div className="w-3 h-px bg-neutral-600" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-1 flex flex-col gap-0.5">
              <div className="w-3 h-px bg-neutral-600" />
              <div className="w-3 h-px bg-neutral-600" />
            </div>
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

export default Fader;
