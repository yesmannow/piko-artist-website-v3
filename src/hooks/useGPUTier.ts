"use client";

import { useState, useEffect } from 'react';

/**
 * GPU Tier Detection
 *
 * Detects device GPU capabilities and returns tier level for performance optimization.
 */
export type GPUTier = 'high' | 'medium' | 'low';

export interface GPUCapabilities {
  tier: GPUTier;
  supportsBackdropFilter: boolean;
  estimatedFPS: number; // Estimated max FPS with glassmorphism
}

/**
 * useGPUTier - Hook to detect GPU capabilities
 *
 * Uses heuristics to determine GPU tier:
 * - High: Desktop with dedicated GPU, high-end mobile
 * - Medium: Mid-range mobile, integrated graphics
 * - Low: Low-end mobile, older devices
 */
export function useGPUTier(): GPUCapabilities {
  const [capabilities, setCapabilities] = useState<GPUCapabilities>({
    tier: 'medium',
    supportsBackdropFilter: true,
    estimatedFPS: 60,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for backdrop-filter support
    const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');

    // Heuristics for GPU tier
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deviceMemory = (navigator as any).deviceMemory || 4; // GB
    const isMobile = window.innerWidth < 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    let tier: GPUTier = 'medium';
    let estimatedFPS = 60;

    if (isMobile) {
      // Mobile devices
      if (hardwareConcurrency >= 8 && deviceMemory >= 6) {
        tier = 'high';
        estimatedFPS = 60;
      } else if (hardwareConcurrency >= 4 && deviceMemory >= 4) {
        tier = 'medium';
        estimatedFPS = 45;
      } else {
        tier = 'low';
        estimatedFPS = 30;
      }
    } else {
      // Desktop
      if (hardwareConcurrency >= 8) {
        tier = 'high';
        estimatedFPS = 60;
      } else {
        tier = 'medium';
        estimatedFPS = 60; // Desktop can usually handle it
      }
    }

    // Disable backdrop-filter on low tier
    const finalSupportsBackdropFilter = supportsBackdropFilter && tier !== 'low';

    setCapabilities({
      tier,
      supportsBackdropFilter: finalSupportsBackdropFilter,
      estimatedFPS,
    });
  }, []);

  return capabilities;
}
