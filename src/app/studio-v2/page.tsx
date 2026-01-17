"use client";

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { StudioErrorBoundary } from '@/components/mobile-shell/StudioErrorBoundary';
import { HelpProvider } from '@/context/HelpContext';
import { verifyStudioCrossOriginIsolation } from "@/utils/crossOriginCheck";
import { DevAudioDebug } from '@/components/DevAudioDebug';

// Dynamically import refactored DJInterface
const DJInterface = dynamic(
  () => import('@/components/RefactoredDJInterface').then(mod => mod.RefactoredDJInterface),
  {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-white text-lg">Loading DJ Mixer...</div>
    </div>
  }
);

/**
 * Studio V2 Page
 *
 * Professional mobile DJ workstation with:
 * - Track library with drag-and-drop to Deck A/B
 * - Dual deck audio engine
 * - Real-time waveform visualization
 * - Loop & hot cue system
 * - WebMIDI hardware support
 * - Search and filter controls
 * - Keyboard shortcuts (Shift+A/B)
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
      <HelpProvider>
        <DJInterface />
        {process.env.NODE_ENV === 'development' && <DevAudioDebug />}
      </HelpProvider>
    </StudioErrorBoundary>
  );
}
