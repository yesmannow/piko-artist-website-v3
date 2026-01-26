"use client";

import { useStudioStore } from "@/store/useStudioStore";

export function StemDebugPanel() {
  const stemModeEnabled = useStudioStore((state) => state.stemModeEnabled);
  const focusedDeckId = useStudioStore((state) => state.focusedDeckId);
  const performanceMode = useStudioStore((state) => state.performanceMode);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="stem-debug-panel">
      <div>Stem Mode: {stemModeEnabled ? "on" : "off"}</div>
      <div>Focused Deck: {focusedDeckId ?? "none"}</div>
      <div>Performance: {performanceMode}</div>
    </div>
  );
}
