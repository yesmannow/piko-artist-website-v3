"use client";

import { Suspense } from "react";
import { DJInterface } from "@/components/DJInterface";

function BeatMakerContent() {
  return <DJInterface />;
}

export default function BeatMakerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
      <BeatMakerContent />
    </Suspense>
  );
}

