"use client";

import type * as Tone from "tone";
import dynamic from "next/dynamic";
import { StudioHeader } from "./StudioHeader";
import { StudioControlBar } from "./StudioControlBar";
import { StudioPanels } from "./StudioPanels";
import { LibraryDrawer } from "@/components/studio/library/LibraryDrawer";
import { StudioSettingsPanel } from "@/components/studio/modals/StudioSettingsPanel";
import { StudioOnboarding } from "@/components/studio/controls/StudioOnboarding";
import { OrientationCoach } from "@/components/studio/controls/OrientationCoach";
import { useEffect, useRef } from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { useStore } from "@/store/useStore";
import { ComplexityModeProvider } from "@/contexts/ComplexityModeContext";
import { usePerformanceHeuristics } from "@/hooks/studio/usePerformanceHeuristics";
import { usePerformanceMode } from "@/hooks/studio/usePerformanceMode";

// Lazy-load heavy modules to reduce first-load JS
const Scene3D = dynamic(
  () => import("@/components/studio/visuals/Scene3D").then(m => ({ default: m.Scene3D })),
  { ssr: false }
);

const DiagnosticsPanel = dynamic(
  () => import("@/components/dev/DiagnosticsPanel").then(m => ({ default: m.DiagnosticsPanel })),
  { ssr: false }
);

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
  const performanceHeuristicsMode = usePerformanceMode();
  const show3DEffective = show3D && performanceMode !== "low";

  // Monitor performance and auto-adjust
  usePerformanceHeuristics();

  useEffect(() => {
    if (performanceHeuristicsMode === 'low' && performanceMode !== 'low') {
      setPerformanceMode('low');
    } else if (performanceHeuristicsMode === 'high' && performanceMode === 'low') {
      setPerformanceMode('balanced'); // or high
    }
  }, [performanceHeuristicsMode, performanceMode, setPerformanceMode]);

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
      <main className="studio-shell" data-performance={performanceMode} style={{ background: '#0a0a0c' }}>
        {/* Surveillance Grid Overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(0,242,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div className="studio-shell-bg" aria-hidden="true">
          {show3DEffective && <Scene3D className="w-full h-full" isActive={isAppActive} />}
        </div>

        <StudioHeader masterProgress={masterProgress} />

        <div className="studio-main">
          <LibraryDrawer />
          <StudioPanels masterBus={masterBus} masterPostFx={masterPostFx} masterProgress={masterProgress} />
        </div>

        <StudioControlBar />

        <StudioSettingsPanel />
        <StudioOnboarding />
        <OrientationCoach />

        {process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_TEST_HELPERS === 'true' ? <DiagnosticsPanel /> : null}
      </main>
    </ComplexityModeProvider>
  );
}
