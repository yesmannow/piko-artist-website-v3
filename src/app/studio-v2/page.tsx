"use client";

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { StudioErrorBoundary } from '@/components/mobile-shell/StudioErrorBoundary';
import { verifyStudioCrossOriginIsolation } from "@/utils/crossOriginCheck";

// Dynamically import with no SSR
const MobileStudioLayout = dynamic(
  () => import('@/components/mobile-shell/MobileStudioLayout').then(mod => mod.MobileStudioLayout),
  {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black" />
  }
);

/**
 * Studio V2 Page
 *
 * Professional mobile DJ workstation with:
 * - Dual deck audio engine
 * - Real-time waveform visualization
 * - Loop & hot cue system
 * - WebMIDI hardware support
 *
 * Uses headless audio engine architecture for maximum performance.
 *
 * PHASE 10: Wrapped in error boundary for production hardening.
 */
export default function StudioV2Page() {
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
