/**
 * GPU Performance Detection & Adaptive Rendering Utilities
 * Phase X: Mobile Mastery - GPU-Adaptive Shaders
 *
 * Tier 1: Low-end mobile (budget Android tablets)
 * Tier 2: Mid-range (standard phones/tablets)
 * Tier 3: High-end (iPad Pro, gaming laptops, desktops)
 */

import { getGPUTier } from 'detect-gpu';

export interface PerformanceProfile {
  /** GPU tier: 0 (blocked), 1 (low), 2 (mid), 3 (high) */
  tier: number;
  /** Is this a mobile/low-end device? */
  isLowEnd: boolean;
  /** Is this a mobile device? */
  isMobile: boolean;
  /** Target FPS for this device */
  fpsTarget: 30 | 60;
  /** Sphere detail level (segments) */
  sphereDetail: 32 | 64;
  /** Enable anti-aliasing? */
  enableAntialias: boolean;
  /** Use simplified materials? */
  useBasicMaterials: boolean;
  /** Device pixel ratio cap */
  maxDPR: number;
}

let cachedProfile: PerformanceProfile | null = null;

/**
 * Detect GPU capabilities and return performance profile
 * Caches result to avoid repeated detection
 */
export async function getPerformanceProfile(): Promise<PerformanceProfile> {
  if (cachedProfile) {
    return cachedProfile;
  }

  const gpuTier = await getGPUTier();

  const tier = gpuTier.tier;
  const isMobile = gpuTier.isMobile ?? false;
  const isLowEnd = tier < 2 || isMobile;

  const profile: PerformanceProfile = {
    tier,
    isMobile,
    isLowEnd,

    // FPS: 30 for low-end, 60 for high-end
    fpsTarget: tier < 2 ? 30 : 60,

    // Sphere detail: 32x32 for mobile/low-end, 64x64 for high-end
    sphereDetail: tier < 2 || isMobile ? 32 : 64,

    // Anti-aliasing: disable on low-end/mobile (expensive)
    enableAntialias: tier >= 2 && !isMobile,

    // Basic materials: use on tier 1 (fastest rendering)
    useBasicMaterials: tier < 2,

    // DPR: cap at 1.5 for mobile, 2 for high-end
    maxDPR: isMobile || tier < 2 ? 1.5 : 2,
  };

  cachedProfile = profile;
  return profile;
}

/**
 * Clear cached profile (useful for testing or manual override)
 */
export function clearPerformanceCache() {
  cachedProfile = null;
}

/**
 * Get simplified profile for immediate use (assumes mid-tier)
 * Use when you can't await async detection
 */
export function getFallbackProfile(): PerformanceProfile {
  return {
    tier: 2,
    isMobile: false,
    isLowEnd: false,
    fpsTarget: 60,
    sphereDetail: 32, // Conservative default
    enableAntialias: false, // Conservative default
    useBasicMaterials: false,
    maxDPR: 1.5,
  };
}
