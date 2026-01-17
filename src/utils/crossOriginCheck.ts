/**
 * crossOriginCheck.ts - Cross-Origin Isolation Verification
 *
 * Utility to verify that crossOriginIsolated is true on studio routes.
 * This is required for SharedArrayBuffer support.
 */

/**
 * Check if crossOriginIsolated is enabled
 * @returns true if crossOriginIsolated is available and true
 */
export function isCrossOriginIsolated(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  // Check if crossOriginIsolated is available (Chrome 92+)
  if (typeof (window as any).crossOriginIsolated !== "undefined") {
    return (window as any).crossOriginIsolated === true;
  }

  // Fallback: Check if SharedArrayBuffer is available
  // If SharedArrayBuffer exists, crossOriginIsolated is likely true
  if (typeof SharedArrayBuffer !== "undefined") {
    return true;
  }

  return false;
}

/**
 * Verify crossOriginIsolated and log warnings if not enabled
 * @param context - Context string for logging (e.g., "StudioEngine")
 */
export function verifyCrossOriginIsolated(
  context: string = "Unknown",
): boolean {
  const isIsolated = isCrossOriginIsolated();

  if (!isIsolated) {
    console.warn(
      `[${context}] ⚠️ crossOriginIsolated is false. SharedArrayBuffer may not work.\n` +
        "Required headers:\n" +
        "  Cross-Origin-Opener-Policy: same-origin\n" +
        "  Cross-Origin-Embedder-Policy: require-corp\n" +
        "These should be set by middleware.ts for /studio* routes.",
    );
  } else {
    console.log(`[${context}] ✅ crossOriginIsolated is true`);
  }

  return isIsolated;
}

/**
 * Check if we're on a studio route
 * @returns true if current pathname starts with /studio
 */
export function isStudioRoute(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.pathname.startsWith("/studio");
}

/**
 * Verify crossOriginIsolated on studio routes and warn if not enabled
 * Should be called on studio page mount
 */
export function verifyStudioCrossOriginIsolation(): void {
  if (!isStudioRoute()) {
    return;
  }

  const isIsolated = verifyCrossOriginIsolated("StudioRoute");

  if (!isIsolated) {
    console.error(
      "[StudioRoute] ❌ CRITICAL: crossOriginIsolated is false on studio route!\n" +
        "This will break SharedArrayBuffer and ControlBus functionality.\n" +
        "Check middleware.ts to ensure COOP/COEP headers are set correctly.",
    );
  }
}
