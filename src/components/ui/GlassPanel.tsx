"use client";

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useGPUTier } from '@/hooks/performance/useGPUTier';

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
  depth?: 'deck' | 'mixer' | 'control';
  accentColor?: string;
  className?: string;
  onClick?: () => void;
}

type PanelDepth = NonNullable<GlassPanelProps['depth']>;

export function GlassPanel({
  children,
  intensity = 'high',
  depth = 'deck',
  accentColor = '#22d3ee',
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

  const depthValue: PanelDepth = depth ?? 'deck';

  const depthShadows: Record<PanelDepth, string> = {
    deck: '0 28px 88px rgba(0,0,0,0.55), 0 18px 52px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.05)',
    mixer: `0 18px 48px rgba(0,0,0,0.42), 0 0 28px ${accentColor}33, inset 0 1px 0 rgba(255,255,255,0.08)`,
    control: '0 14px 36px rgba(0,0,0,0.55), 0 10px 22px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
  };

  const depthBase: Record<PanelDepth, string> = {
    deck: 'backdrop-blur-[28px] border-white/5',
    mixer: 'backdrop-blur-[18px] border-white/10 ring-1 ring-white/10',
    control: 'backdrop-blur-[14px] border-white/20',
  };

  const motionInteractions =
    depth === 'control'
      ? {
          whileHover: { y: -2, boxShadow: depthShadows.control },
          whileTap: { y: 0, boxShadow: depthShadows.control },
        }
      : onClick
        ? { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } }
        : {};

  return (
    <motion.div
      className={cn(
        'rounded-2xl shadow-lg bg-linear-to-br from-white/10 via-white/5 to-white/0',
        intensityClasses[effectiveIntensity],
        depthBase[depthValue],
        className
      )}
      onClick={onClick}
      style={{ boxShadow: depthShadows[depthValue] }}
      {...motionInteractions}
    >
      {children}
    </motion.div>
  );
}
