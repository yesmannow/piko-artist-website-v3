"use client";

import type * as Tone from "tone";
import { useMemo, useRef } from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { useStore } from "@/store/useStore";
import { useComplexityMode } from '@/contexts/ComplexityModeContext';
import { useGestures } from "@/hooks/useGestures";
import { StudioGrid } from "./StudioGrid";
import { Deck } from "@/components/studio/ui/Deck";
import { MainWaveform } from "@/components/studio/ui/MainWaveform";
import { StemWaveforms } from "@/components/studio/ui/StemWaveforms";
import { StemMeters } from "@/components/studio/ui/StemMeters";
import { StemGenerator } from "@/components/studio/ui/StemGenerator";
import { StemControls } from "@/components/studio/ui/StemControls";
import { StemDebugPanel } from "@/components/studio/ui/StemDebugPanel";
import { FXRack } from "@/components/studio/core/FXRack";

type StudioPanelsProps = {
  masterBus?: Tone.Gain | null;
  masterPostFx?: Tone.Gain | null;
};

export function StudioPanels({ masterBus, masterPostFx }: StudioPanelsProps) {
  const stemModeEnabled = useStudioStore((state) => state.stemModeEnabled);
  const fxPanelOpen = useStudioStore((state) => state.fxPanelOpen);
  const performanceMode = useStudioStore((state) => state.performanceMode);
  const focusedDeckId = useStudioStore((state) => state.focusedDeckId);
  const setFocusedDeckId = useStudioStore((state) => state.setFocusedDeckId);
  const isFocusActive = focusedDeckId !== null;
  const { mode: complexityMode } = useComplexityMode();
  const useGridLayout = useStudioStore((state) => state.useGridLayout ?? true); // Default to true for Phase V

  const deckA = useStore((state) => state.deckA);
  const deckB = useStore((state) => state.deckB);
  const dragDeltaRef = useRef(0);

  // Always call hooks before any conditional returns
  const gestureConfig = useMemo(
    () => ({
      shouldStart: (event: PointerEvent) => {
        if (typeof window === "undefined") return false;
        if (window.innerWidth >= 768) return false;
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
        if (typeof window === "undefined") return;
        if (window.innerWidth >= 768) return;
        if (Math.abs(dragDeltaRef.current) < 80) return;
        setFocusedDeckId(dragDeltaRef.current > 0 ? "A" : "B");
      },
    }),
    [setFocusedDeckId]
  );

  const gestureHandlers = useGestures(gestureConfig);

  // Phase V: Use new 3-row grid layout
  if (useGridLayout && complexityMode === 'pro') {
    return <StudioGrid masterBus={masterBus} masterPostFx={masterPostFx} masterProgress={0} />;
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
        className={`studio-side-panel ${stemModeEnabled || fxPanelOpen ? "is-open" : ""}`}
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

        {fxPanelOpen && (
          <div className="studio-panel-block">
            <div className="studio-panel-header">
              <span>FX Rack</span>
            </div>
            <FXRack masterBus={masterBus} masterPostFx={masterPostFx} />
          </div>
        )}
      </aside>
    </div>
  );
}
