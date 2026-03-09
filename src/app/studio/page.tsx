"use client";

import { Suspense } from "react";
import { DJInterface } from "@/components/DJInterface";
import { HelpProvider } from "@/context/HelpContext";
import { CrashGuard } from "@/components/dj-ui/CrashGuard";
// Preload 3D models early
import "@/components/dj-ui/preload3D";

function StudioContent() {
  return (
    <CrashGuard>
      <DJInterface />
    </CrashGuard>
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
