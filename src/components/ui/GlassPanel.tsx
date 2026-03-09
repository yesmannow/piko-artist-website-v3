"use client";

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useGPUTier } from '@/hooks/useGPUTier';

/**
 * GlassPanel - Glassmorphic panel component with adaptive intensity
 *
 * Intensity levels:
 * - high: Full backdrop-blur-xl (Desktop)
 * - medium: backdrop-blur-md
 * - low: backdrop-blur-sm (Mobile, battery optimization)
 *
 * Automatically degrades on low-end devices.
 */
export interface GlassPanelProps {
  children: ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
  onClick?: () => void;
}

export function GlassPanel({
  children,
  intensity = 'high',
  className,
  onClick,
}: GlassPanelProps) {
  const gpuTier = useGPUTier();

  // Auto-degrade on low GPU tier
  const effectiveIntensity = gpuTier.tier === 'low' ? 'low' : intensity;

  // Map intensity to Tailwind v4 utility classes
  const intensityClasses = {
    high: gpuTier.supportsBackdropFilter
      ? 'glass-panel-high'
      : 'bg-black/90', // Fallback for no backdrop-filter support
    medium: gpuTier.supportsBackdropFilter
      ? 'bg-white/8 backdrop-blur-md'
      : 'bg-black/80',
    low: 'glass-panel-low', // Uses @utility directive for mobile optimization
  };

  return (
    <motion.div
      className={cn(
        'rounded-2xl border border-white/10 shadow-lg',
        intensityClasses[effectiveIntensity],
        className
      )}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      {children}
    </motion.div>
  );
}
