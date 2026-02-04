"use client";

import { useStudioStore } from "@/store/useStudioStore";
import { useHaptic } from "@/hooks/device/useHaptic";

export function StemModeToggle() {
  const stemModeEnabled = useStudioStore((state) => state.stemModeEnabled);
  const setStemModeEnabled = useStudioStore((state) => state.setStemModeEnabled);
  const { triggerHaptic } = useHaptic();

  return (
    <button
      type="button"
      className={`btn ${stemModeEnabled ? "btn-active" : ""}`}
      onClick={() => {
        triggerHaptic(6);
        setStemModeEnabled(!stemModeEnabled);
      }}
      data-testid="stem-mode-toggle"
      aria-pressed={stemModeEnabled}
      aria-label="Toggle stem mode"
      aria-controls="studio-side-panel"
    >
      Stem Mode
    </button>
  );
}
