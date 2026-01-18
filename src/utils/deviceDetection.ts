"use client";

/**
 * Device Detection Utilities
 *
 * Checks hardware capabilities to determine if device can handle
 * computationally intensive features like AI stem separation.
 */

/**
 * Check if device has sufficient compute power for AI inference
 *
 * Uses navigator.hardwareConcurrency to detect CPU cores.
 * Low-end mobile devices typically have 2-4 cores, which may struggle
 * with real-time neural network inference.
 *
 * @returns {boolean} - true if device can handle AI processing
 */
export function hasSufficientComputePower(): boolean {
  if (typeof window === "undefined" || !navigator.hardwareConcurrency) {
    return false;
  }

  // Require at least 4 CPU cores for AI inference
  // This prevents UI freezing on low-end devices
  const minCores = 4;
  return navigator.hardwareConcurrency >= minCores;
}

/**
 * Get device compute power level
 *
 * @returns {'high' | 'medium' | 'low'} - Device capability level
 */
export function getComputePowerLevel(): 'high' | 'medium' | 'low' {
  if (typeof window === "undefined" || !navigator.hardwareConcurrency) {
    return 'low';
  }

  const cores = navigator.hardwareConcurrency;
  if (cores >= 8) return 'high';
  if (cores >= 4) return 'medium';
  return 'low';
}

