"use client";

import { StudioHeader } from "@/features/studio/components/StudioHeader";
import { TimelineView } from "@/features/studio/components/TimelineView";
import { MixerRack } from "@/features/studio/components/MixerRack";

export default function StudioPage() {
  return (
    <div className="h-screen overflow-hidden bg-[#050505] text-[#E0E0E0]">
      <div className="h-full w-full p-2 flex flex-col gap-2">
        <StudioHeader />
        <TimelineView />
        <MixerRack />
      </div>
    </div>
  );
}

