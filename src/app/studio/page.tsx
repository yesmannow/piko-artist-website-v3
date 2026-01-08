"use client";

import { Suspense, useEffect } from "react";
import { DJInterface } from "@/components/DJInterface";
import { HelpProvider } from "@/context/HelpContext";
import { CrashGuard } from "@/components/dj-ui/CrashGuard";
import { useAudio } from "@/context/AudioContext";
// Preload 3D models early
import "@/components/dj-ui/preload3D";
import { usePathname } from "next/navigation";

function StudioContent() {
  const { stop: stopPersistentPlayer, isPlaying, currentTrack } = useAudio();
  const pathname = usePathname();

  // Stop persistent player audio when entering studio page
  useEffect(() => {
    // Only stop if we're on the studio page and audio is playing
    if (pathname === '/studio' && (isPlaying || currentTrack)) {
      stopPersistentPlayer();
    }
  }, [pathname, isPlaying, currentTrack, stopPersistentPlayer]);

  return (
    <div className="relative overflow-hidden">
      <CrashGuard>
        <DJInterface />
      </CrashGuard>
    </div>
  );
}

export default function StudioPage() {
  return (
    <HelpProvider>
      <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
        <StudioContent />
      </Suspense>
    </HelpProvider>
  );
}
