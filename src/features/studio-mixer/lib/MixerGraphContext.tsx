"use client";

import React, { createContext, useContext } from "react";
import type { ChannelStripNodes } from "@/features/audio-engine/hooks/useChannelStrip";

export type MixerDeckId = "A" | "B";

export type MixerDeckGraph = {
  channel: ChannelStripNodes;
};

export type MixerGraph = {
  audioContext: AudioContext;
  masterAnalyser: AnalyserNode;
  deck: Record<MixerDeckId, MixerDeckGraph>;
};

const Ctx = createContext<MixerGraph | null>(null);

export function MixerGraphProvider({ value, children }: { value: MixerGraph | null; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMixerGraph(): MixerGraph {
  const v = useContext(Ctx);
  if (v === null) {
    throw new Error("useMixerGraph must be used within MixerGraphProvider");
  }
  return v;
}

export function useMixerGraphOrNull(): MixerGraph | null {
  return useContext(Ctx);
}

