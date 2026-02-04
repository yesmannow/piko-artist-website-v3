"use client";

import type * as Tone from "tone";
import dynamic from "next/dynamic";
import { useMemo, useRef } from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { useStore } from "@/store/useStore";
import { useComplexityMode } from '@/contexts/ComplexityModeContext';
import { useGestures } from "@/hooks/useGestures";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useOrientation } from "@/hooks/useOrientation";
import { StudioGrid } from "./StudioGrid";
import { MobilePortraitPocketStudio } from "./MobilePortraitPocketStudio";
import { MobileLandscapeWorkstation } from "./MobileLandscapeWorkstation";
import { Deck } from "@/components/studio/deck/Deck";
import { MainWaveform } from "@/components/studio/ui/MainWaveform";
import { StemMeters } from "@/components/studio/stems/StemMeters";
import { StemControls } from "@/components/studio/stems/StemControls";


// Lazy-load heavy stem components to reduce first-load JS
const StemWaveforms = dynamic(
  () => import("@/components/studio/stems/StemWaveforms").then(m => ({ default: m.StemWaveforms })),
  { ssr: false }
);

const StemGenerator = dynamic(
  () => import("@/components/studio/stems/StemGenerator").then(m => ({ default: m.StemGenerator })),
  { ssr: false }
);

const StemDebugPanel = dynamic(
  () => import("@/components/studio/stems/StemDebugPanel").then(m => ({ default: m.StemDebugPanel })),
  { ssr: false }
);

type StudioPanelsProps = {
  readonly masterBus?: Tone.Gain | null;
  readonly masterPostFx?: Tone.Gain | null;
  readonly masterProgress?: number;
};

export function StudioPanels({ masterBus, masterPostFx, masterProgress }: Readonly<StudioPanelsProps>) {
  const stemModeEnabled = useStudioStore((state) => state.stemModeEnabled);
  const performanceMode = useStudioStore((state) => state.performanceMode);
  const focusedDeckId = useStudioStore((state) => state.focusedDeckId);
  const setFocusedDeckId = useStudioStore((state) => state.setFocusedDeckId);
  const isFocusActive = focusedDeckId !== null;
  const { mode: complexityMode } = useComplexityMode();
  const useGridLayout = useStudioStore((state) => state.useGridLayout ?? true); // Default to true for Phase V

  const deckA = useStore((state) => state.deckA);
  const deckB = useStore((state) => state.deckB);
  const dragDeltaRef = useRef(0);

  // Phase 5: Mobile detection (avoid keyboard-triggered flips)
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isLandscape = useOrientation();

  // Always call hooks before any conditional returns
  const gestureConfig = useMemo(
    () => ({
      shouldStart: (event: PointerEvent) => {
        if (globalThis.window === undefined) return false;
        if (globalThis.innerWidth >= 768) return false;
        const target = event.target as HTMLElement | null;
        if (!target) return false;
        return !target.closest("button, input, select, textarea, [data-no-swipe='true']");
      },
      onDragStart: () => {
        dragDeltaRef.current = 0;
      },
      onDrag: (deltaX: number) => {
        dragDeltaRef.current += deltaX;
      },
      onDragEnd: () => {
        if (globalThis.window === undefined) return;
        if (globalThis.innerWidth >= 768) return;
        if (Math.abs(dragDeltaRef.current) < 80) return;
        setFocusedDeckId(dragDeltaRef.current > 0 ? "A" : "B");
      },
    }),
    [setFocusedDeckId]
  );

  const gestureHandlers = useGestures(gestureConfig);

  // Phase 5: Mobile layouts (portrait/landscape)
  if (!isDesktop) {
    if (isLandscape) {
      return <MobileLandscapeWorkstation />;
    } else {
      return <MobilePortraitPocketStudio />;
    }
  }

  // Phase V: Use new 3-row grid layout for desktop
  if (useGridLayout && complexityMode === 'pro') {
    return <StudioGrid masterBus={masterBus} masterPostFx={masterPostFx} masterProgress={masterProgress ?? 0} />;
  }

  // Legacy layout for backwards compatibility  // Extract only DOM-compatible props from gestureHandlers
  const domGestureHandlers = {
    onPointerDown: gestureHandlers.onPointerDown,
    onPointerMove: gestureHandlers.onPointerMove,
    onPointerUp: gestureHandlers.onPointerUp,
    onPointerCancel: gestureHandlers.onPointerCancel,
  };

  return (
    <div className="studio-panels">
      <section className={`studio-decks ${isFocusActive ? "is-focus" : ""}`} {...domGestureHandlers}>
        <div className={`studio-deck-column ${focusedDeckId === "B" ? "is-hidden" : ""}`}>
          <MainWaveform
            deckId="A"
            title={deckA.trackData?.title ?? "Deck A"}
            url={deckA.trackData?.url}
            beatGrid={deckA.trackData?.beatGrid}
          />
          <Deck deckId="A" showMiniWaveform={false} complexityMode={complexityMode} />
          {stemModeEnabled && <StemWaveforms deckId="A" performanceMode={performanceMode} />}
        </div>
        <div className={`studio-deck-column ${focusedDeckId === "A" ? "is-hidden" : ""}`}>
          <MainWaveform
            deckId="B"
            title={deckB.trackData?.title ?? "Deck B"}
            url={deckB.trackData?.url}
            beatGrid={deckB.trackData?.beatGrid}
          />
          <Deck deckId="B" showMiniWaveform={false} complexityMode={complexityMode} />
          {stemModeEnabled && <StemWaveforms deckId="B" performanceMode={performanceMode} />}
        </div>
      </section>

      <aside
        className={`studio-side-panel ${stemModeEnabled ? "is-open" : ""}`}
        id="studio-side-panel"
      >
        {stemModeEnabled && (
          <div className="studio-panel-block">
            <div className="studio-panel-header">
              <span>Stem Mode</span>
            </div>
            <StemGenerator />
            <StemControls deckId={focusedDeckId ?? "A"} />
            <StemMeters deckId={focusedDeckId ?? "A"} />
            <StemDebugPanel />
          </div>
        )}
      </aside>
    </div>
  );
}
