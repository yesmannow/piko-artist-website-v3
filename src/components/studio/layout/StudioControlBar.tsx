"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Library, Settings2 } from "lucide-react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useHaptic } from "@/hooks/useHaptic";
import { useStore } from "@/store/useStore";
import { useStudioStore } from "@/store/useStudioStore";
import { StemModeToggle } from "@/components/studio/stems/StemModeToggle";

const formatTime = (value: number) => {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export function StudioControlBar() {
  const { play, pause, getDeckDuration, getTransportSeconds } = useAudioEngine();
  const deckAPlaying = useStore((state) => state.deckA.isPlaying);
  const deckBPlaying = useStore((state) => state.deckB.isPlaying);
  const setDeckPlaying = useStore((state) => state.setDeckPlaying);
  const crossfaderPos = useStudioStore((state) => state.crossfaderPos);
  const setCrossfader = useStudioStore((state) => state.setCrossfader);
  const libraryOpen = useStudioStore((state) => state.libraryOpen);
  const settingsOpen = useStudioStore((state) => state.settingsOpen);
  const setLibraryOpen = useStudioStore((state) => state.setLibraryOpen);
  const setSettingsOpen = useStudioStore((state) => state.setSettingsOpen);
  const seek = useStudioStore((state) => state.seek);
  const performanceMode = useStudioStore((state) => state.performanceMode);
  const { triggerHaptic } = useHaptic();

  const isPlaying = deckAPlaying || deckBPlaying;
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const frameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const interval = performanceMode === "low" ? 150 : 50;
    const tick = (now: number) => {
      if (now - lastUpdateRef.current >= interval) {
        const totalDuration = Math.max(getDeckDuration("A"), getDeckDuration("B"));
        const current = getTransportSeconds();
        setDuration(totalDuration);
        setProgress(totalDuration > 0 ? Math.min(1, current / totalDuration) : 0);
        lastUpdateRef.current = now;
      }
      frameRef.current = window.requestAnimationFrame(tick);
    };
    frameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [getDeckDuration, getTransportSeconds, performanceMode]);

  const handleTogglePlay = () => {
    triggerHaptic(8);
    if (isPlaying) {
      pause("A");
      pause("B");
      setDeckPlaying("A", false);
      setDeckPlaying("B", false);
      return;
    }

    play("A");
    play("B");
    setDeckPlaying("A", true);
    setDeckPlaying("B", true);
  };

  return (
    <div className="studio-control-bar">
      <div className="control-cluster">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleTogglePlay}
          data-testid="play-toggle"
          aria-label={isPlaying ? "Pause all decks" : "Play all decks"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span>{isPlaying ? "Pause" : "Play"}</span>
        </button>
        <div className="control-timer">
          <span>{formatTime(progress * duration)}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Transport position"
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="control-cluster">
        <div className="crossfader">
          <span>A</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={crossfaderPos}
            onChange={(event) => setCrossfader(Number(event.target.value))}
            aria-label="Crossfader"
            data-testid="crossfader"
          />
          <span>B</span>
        </div>
        <StemModeToggle />
      </div>

      <div className="control-cluster">
        <button
          type="button"
          className={`btn ${libraryOpen ? "btn-active" : ""}`}
          onClick={() => {
            triggerHaptic(6);
            setLibraryOpen(!libraryOpen);
          }}
          aria-expanded={libraryOpen}
          aria-controls="studio-library-drawer"
          data-testid="library-toggle"
          aria-label="Toggle library"
        >
          <Library className="h-4 w-4" />
          Library
        </button>
        <button
          type="button"
          className={`btn ${settingsOpen ? "btn-active" : ""}`}
          onClick={() => {
            triggerHaptic(6);
            setSettingsOpen(!settingsOpen);
          }}
          aria-expanded={settingsOpen}
          aria-controls="studio-settings-panel"
          data-testid="settings-toggle"
          aria-label="Toggle settings"
        >
          <Settings2 className="h-4 w-4" />
          Settings
        </button>
      </div>
    </div>
  );
}
