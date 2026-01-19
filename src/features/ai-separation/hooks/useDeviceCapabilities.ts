"use client";

import { useState, useEffect } from 'react';

/**
 * Device Capabilities
 */
export interface DeviceCapabilities {
  ai: boolean; // AI stem separation enabled
  hardwareConcurrency: number;
  deviceMemory?: number; // GB (if available)
  isMobile: boolean;
  hasWebGPU: boolean;
}

/**
 * useDeviceCapabilities - Detects device hardware tier
 *
 * Implements tiered capability strategy:
 * - Tier A (Desktop/GPU): AI enabled, WebGPU backend
 * - Tier B (High-End Mobile): AI enabled, WASM backend
 * - Tier C (Low-End Mobile): AI disabled (battery preservation)
 */
export function useDeviceCapabilities(): DeviceCapabilities {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    ai: false,
    hardwareConcurrency: 4,
    deviceMemory: undefined,
    isMobile: false,
    hasWebGPU: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect mobile
    const isMobile = window.innerWidth < 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Get hardware info
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const deviceMemory = (navigator as any).deviceMemory; // Optional API

    // Check for WebGPU
    const hasWebGPU = 'gpu' in navigator;

    // Determine AI capability
    // Disable AI on mobile to preserve battery
    // Can be enabled later for high-end devices if needed
    const aiEnabled = !isMobile && hardwareConcurrency >= 4;

    setCapabilities({
      ai: aiEnabled,
      hardwareConcurrency,
      deviceMemory,
      isMobile,
      hasWebGPU,
    });
  }, []);

  return capabilities;
}
