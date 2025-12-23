"use client";

import { Suspense } from "react";
import { DJInterface } from "@/components/DJInterface";
import { HelpProvider } from "@/context/HelpContext";
// Preload 3D models early
import "@/components/dj-ui/preload3D";

function BeatMakerContent() {
  return <DJInterface />;
}

export default function BeatMakerPage() {
  return (
    <HelpProvider>
      <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
        <BeatMakerContent />
      </Suspense>
    </HelpProvider>
  );
}

