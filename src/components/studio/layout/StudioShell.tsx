"use client";

import type * as Tone from "tone";
import { StudioHeader } from "./StudioHeader";
import { StudioControlBar } from "./StudioControlBar";
import { StudioPanels } from "./StudioPanels";
import { LibraryDrawer } from "@/components/studio/ui/LibraryDrawer";
import { StudioSettingsPanel } from "@/components/studio/ui/StudioSettingsPanel";
import { StudioOnboarding } from "@/components/studio/ui/StudioOnboarding";
import { Scene3D } from "@/components/studio/visuals/Scene3D";
import { useEffect, useRef } from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { useStore } from "@/store/useStore";
import { ComplexityModeProvider } from "@/contexts/ComplexityModeContext";
import { ShortcutsOverlay } from "@/components/ui/ShortcutsOverlay";
import { DiagnosticsPanel } from "@/components/dev/DiagnosticsPanel";
import { SmartSuggestions } from "@/components/ui/SmartSuggestions";
import { usePerformanceHeuristics } from "@/hooks/usePerformanceHeuristics";

type StudioShellProps = {
  masterProgress: number;
  masterBus?: Tone.Gain | null;
  masterPostFx?: Tone.Gain | null;
};

export function StudioShell({ masterProgress, masterBus, masterPostFx }: StudioShellProps) {
  const show3D = useStudioStore((state) => state.show3D);
  const performanceMode = useStudioStore((state) => state.performanceMode);
  const setPerformanceMode = useStudioStore((state) => state.setPerformanceMode);
  const isAppActive = useStore((state) => state.isAppActive);
  const perfSampledRef = useRef(false);
  const show3DEffective = show3D && performanceMode !== "low";
  
  // Monitor performance and auto-adjust
  usePerformanceHeuristics();

  useEffect(() => {
    if (perfSampledRef.current || performanceMode !== "balanced") return;
    perfSampledRef.current = true;
    let frames = 0;
    let rafId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      frames += 1;
      if (now - start >= 1000) {
        const fps = frames / ((now - start) / 1000);
        if (fps < 40) {
          setPerformanceMode("low");
        } else if (fps > 55) {
          setPerformanceMode("high");
        }
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [performanceMode, setPerformanceMode]);

  return (
    <ComplexityModeProvider>
      <main className="studio-shell" data-performance={performanceMode}>
        <div className="studio-shell-bg" aria-hidden="true">
          {show3DEffective && <Scene3D className="w-full h-full" isActive={isAppActive} />}
        </div>

        <StudioHeader masterProgress={masterProgress} />

        <div className="studio-main">
          <LibraryDrawer />
          <StudioPanels masterBus={masterBus} masterPostFx={masterPostFx} />
        </div>

        <StudioControlBar />

        <StudioSettingsPanel />
        <StudioOnboarding />
        
        <ShortcutsOverlay />
        {process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_TEST_HELPERS === 'true' ? <DiagnosticsPanel /> : null}
        <SmartSuggestions />
      </main>
    </ComplexityModeProvider>
  );
}
