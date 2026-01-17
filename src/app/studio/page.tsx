"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { HelpProvider } from "@/context/HelpContext";
import { verifyStudioCrossOriginIsolation } from "@/utils/crossOriginCheck";
import { DevAudioDebug } from "@/components/DevAudioDebug";

// Dynamically import refactored DJInterface to avoid SSR issues
const DJInterface = dynamic(
  () =>
    import("@/components/RefactoredDJInterface").then(
      (mod) => mod.RefactoredDJInterface,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-lg">Loading DJ Mixer...</div>
      </div>
    ),
  },
);

/**
 * Desktop Studio Page
 *
 * This page serves the desktop-optimized DJ mixer interface with track library.
 * Features:
 * - Track library with drag-and-drop to Deck A/B
 * - Search and filter controls
 * - Keyboard shortcuts (Shift+A/B to load tracks)
 * - Dual deck mixing interface
 *
 * The middleware handles device detection and routing:
 * - Desktop UA: Serves this page at /studio
 * - Mobile UA: Rewrites /studio to /studio-v2
 */
export default function StudioPage() {
  // Verify crossOriginIsolated on mount
  useEffect(() => {
    verifyStudioCrossOriginIsolation();
  }, []);

  return (
    <HelpProvider>
      <DJInterface />
      {process.env.NODE_ENV === "development" && <DevAudioDebug />}
    </HelpProvider>
  );
}
