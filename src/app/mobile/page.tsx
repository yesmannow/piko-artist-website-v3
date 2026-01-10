"use client";

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { StudioErrorBoundary } from '@/components/mobile-shell/StudioErrorBoundary';
import { HelpProvider } from '@/context/HelpContext';
import { verifyStudioCrossOriginIsolation } from "@/utils/crossOriginCheck";

// Dynamically import DJInterface for mobile
const DJInterface = dynamic(
  () => import('@/components/DJInterface').then(mod => ({ default: mod.DJInterface })),
  {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-white text-lg">Loading DJ Mixer...</div>
    </div>
  }
);

/**
 * Mobile DJ Mixer Page
 *
 * Phase 1: Mobile-optimized entry point for DJ mixer application
 * Phase 3: Mobile-First UI & PWA
 * 
 * This page serves the mobile-optimized DJ mixer interface with:
 * - Track library with drag-and-drop to Deck A/B
 * - Mobile-optimized touch controls
 * - Keyboard shortcuts for accessibility
 * - Search and filter functionality
 * - Dual deck audio engine with ultra-low latency (<20ms)
 * - Real-time waveform visualization
 * - Loop & hot cue system
 * - Touch-optimized controls
 * - Offline/PWA support
 * - Haptic feedback on key interactions
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
  // Add mobile-studio class to body for fixed-canvas interface
  useEffect(() => {
    // Add mobile-studio class to body
    document.body.classList.add('mobile-studio');
    
    // Verify crossOriginIsolated on mount
    verifyStudioCrossOriginIsolation();
    
    // Cleanup: remove class when unmounting
    return () => {
      document.body.classList.remove('mobile-studio');
    };
  }, []);

  return (
    <StudioErrorBoundary>
      <HelpProvider>
        <DJInterface />
      </HelpProvider>
    </StudioErrorBoundary>
  );
}
