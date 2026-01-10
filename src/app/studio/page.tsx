"use client";

import { useEffect } from 'react';
import { DesktopStudioLayout } from "@/components/desktop-studio/DesktopStudioLayout";
import { verifyStudioCrossOriginIsolation } from "@/utils/crossOriginCheck";

/**
 * Desktop Studio Page
 *
 * This page serves the desktop-optimized studio interface.
 * It's completely separate from the mobile studio (served at /studio-v2).
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

  return <DesktopStudioLayout />;
}

