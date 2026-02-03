"use client";

import { useEffect, useRef, useState } from "react";
import { useStudioStore } from "@/store/useStudioStore";

type StemMetersProps = {
  deckId: "A" | "B";
};

const STEMS = ["vocals", "drums", "bass", "other"] as const;

export function StemMeters({ deckId }: StemMetersProps) {
  const stems = useStudioStore((state) => state.stems[deckId]);
  const performanceMode = useStudioStore((state) => state.performanceMode);
  const hasStems = Object.values(stems).some(Boolean);
  const [levels, setLevels] = useState(() => STEMS.map(() => 0));
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hasStems || performanceMode === "low") {
      // Legitimate use: resetting visualization state when stems are removed
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLevels(STEMS.map(() => 0));
      return;
    }

    const tick = () => {
      setLevels((prev) =>
        prev.map((value) => {
          const next = value + (Math.random() - 0.4) * 0.2;
          return Math.max(0.05, Math.min(1, next));
        })
      );
      frameRef.current = window.requestAnimationFrame(tick);
    };
    frameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [hasStems, performanceMode]);

  return (
    <div className="stem-meters">
      <div className="stem-meters-header">Stem Meters</div>
      <div className="stem-meter-grid">
        {STEMS.map((stem, index) => (
          <div key={stem} className="stem-meter-row" data-stem={stem}>
            <span className="stem-label">{stem}</span>
            <div className="meter-bar">
              <div className="meter-fill" style={{ transform: `scaleX(${levels[index]})` }} />
            </div>
          </div>
        ))}
      </div>
      {!hasStems && <div className="stem-meters-empty">Meters appear after stems are generated.</div>}
    </div>
  );
}
