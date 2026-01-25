"use client";

import { useState, useRef, useCallback } from 'react';
import { useGestures } from '@/hooks/useGestures';
import { useHaptic } from '@/hooks/useHaptic';
import { cn } from '@/lib/utils';

/**
 * Fader - Vertical fader control with haptic feedback
 *
 * Features:
 * - Pointer Events for unified mouse/touch
 * - Haptic feedback at center detent (0.5) and limits (0, 1)
 * - Touch target: min 44px (mobile), visual size: 20px
 * - Glassmorphic styling with adaptive intensity
 */
export interface FaderProps {
  value: number; // 0-1
  onChange: (value: number) => void;
  orientation?: 'vertical' | 'horizontal';
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
}

export function Fader({
  value,
  onChange,
  orientation = 'vertical',
  min = 0,
  max = 1,
  step = 0.01,
  label,
  className,
}: FaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const faderRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHaptic();
  const lastValueRef = useRef(value);
  const hasTriggeredCenterRef = useRef(false);

  // Normalize value to 0-1 range
  const normalizedValue = (value - min) / (max - min);

  const handleValueChange = useCallback((newValue: number) => {
    // Clamp to min/max
    const clamped = Math.max(min, Math.min(max, newValue));
    const normalized = (clamped - min) / (max - min);

    // Haptic feedback at center detent (0.5)
    if (!hasTriggeredCenterRef.current && Math.abs(normalized - 0.5) < 0.02) {
      triggerHaptic(10);
      hasTriggeredCenterRef.current = true;
    } else if (Math.abs(normalized - 0.5) >= 0.02) {
      hasTriggeredCenterRef.current = false;
    }

    // Haptic feedback at limits
    if ((normalized <= 0.01 && lastValueRef.current > 0.01) ||
        (normalized >= 0.99 && lastValueRef.current < 0.99)) {
      triggerHaptic(20); // Stronger feedback at limits
    }

    lastValueRef.current = normalized;
    onChange(clamped);
  }, [min, max, onChange, triggerHaptic]);

  const gestures = useGestures({
    onDragStart: () => {
      setIsDragging(true);
      hasTriggeredCenterRef.current = false;
    },
    onDrag: (deltaX, deltaY) => {
      if (!faderRef.current) return;

      const rect = faderRef.current.getBoundingClientRect();
      const isVertical = orientation === 'vertical';
      const delta = isVertical ? -deltaY : deltaX; // Invert Y for vertical
      const range = isVertical ? rect.height : rect.width;
      const deltaValue = (delta / range) * (max - min);

      handleValueChange(value + deltaValue);
    },
    onDragEnd: () => {
      setIsDragging(false);
    },
  });

  const isVertical = orientation === 'vertical';
  const positionPercent = normalizedValue * 100;

  // Extract only DOM-compatible props from gestures (exclude getVelocity)
  const { getVelocity, ...gestureProps } = gestures;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {label && (
        <label className="text-xs text-white/60 uppercase font-mono">
          {label}
        </label>
      )}
      <div
        ref={faderRef}
        className={cn(
          'relative glass-panel-low rounded-lg touch-action-none',
          isVertical ? 'w-5 h-32' : 'w-32 h-5',
          'min-w-[44px] min-h-[44px]' // Touch target size
        )}
        style={{
          writingMode: isVertical ? 'vertical-lr' : 'horizontal-tb',
        }}
        {...gestureProps}
      >
        {/* Track */}
        <div
          className={cn(
            'absolute bg-white/10 rounded',
            isVertical ? 'w-1 h-full left-1/2 -translate-x-1/2' : 'h-1 w-full top-1/2 -translate-y-1/2'
          )}
        />

        {/* Handle */}
        <div
          className={cn(
            'absolute bg-[#FFD700] rounded-full shadow-lg transition-transform',
            isVertical ? 'w-5 h-5 left-0' : 'w-5 h-5 top-0',
            isDragging && 'scale-110'
          )}
          style={{
            [isVertical ? 'bottom' : 'left']: `${positionPercent}%`,
            transform: isVertical
              ? `translateY(50%) scale(${isDragging ? 1.1 : 1})`
              : `translateX(-50%) scale(${isDragging ? 1.1 : 1})`,
          }}
        />
      </div>
      <div className="text-xs text-white/40 font-mono">
        {value.toFixed(2)}
      </div>
    </div>
  );
}
