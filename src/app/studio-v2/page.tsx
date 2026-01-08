"use client";

import dynamic from 'next/dynamic';

// Dynamically import with no SSR
const MobileStudioLayout = dynamic(
  () => import('@/components/mobile-shell/MobileStudioLayout').then(mod => mod.MobileStudioLayout),
  { 
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black" />
  }
);

/**
 * Studio V2 - Mobile PWA DJ Workstation
 * 
 * Landscape-only, gesture-locked, full-screen PWA.
 * Uses headless audio engine architecture for maximum performance.
 */
export default function StudioV2Page() {
  return <MobileStudioLayout />;
}
