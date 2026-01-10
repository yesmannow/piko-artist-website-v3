"use client";

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { StudioErrorBoundary } from '@/components/mobile-shell/StudioErrorBoundary';
import { verifyStudioCrossOriginIsolation } from "@/utils/crossOriginCheck";

// Dynamically import with no SSR (mobile-optimized)
const MobileStudioLayout = dynamic(
  () => import('@/components/mobile-shell/MobileStudioLayout').then(mod => mod.MobileStudioLayout),
  {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black" />
  }
);

/**
 * Mobile DJ Mixer Page
 *
 * Phase 1: Mobile-optimized entry point for DJ mixer application
 * 
 * This page serves the mobile-optimized DJ mixer interface with:
 * - App-like mobile UI (gesture-physics based)
 * - Dual deck audio engine with ultra-low latency (<20ms)
 * - Real-time waveform visualization
 * - Loop & hot cue system
 * - Touch-optimized controls
 * - Offline/PWA support
 * 
 * User-Agent routing in middleware.ts ensures mobile devices are
 * directed here, preventing heavy desktop code from being downloaded.
 * 
 * Cross-Origin Isolation:
 * - Middleware sets COOP/COEP headers for SharedArrayBuffer support
 * - Required for multi-threaded audio engine
 * - Enables lock-free parameter updates
 */
export default function MobilePage() {
  // Verify crossOriginIsolated on mount
  useEffect(() => {
    verifyStudioCrossOriginIsolation();
  }, []);

  return (
    <StudioErrorBoundary>
      <MobileStudioLayout />
    </StudioErrorBoundary>
  );
}
