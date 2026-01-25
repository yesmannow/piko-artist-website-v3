"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useMixerStore, FxTarget } from "../stores/useMixerStore";
import { KaossPad } from "./KaossPad";

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-2 py-1.5 md:px-3 md:py-1 text-xs font-barlow uppercase tracking-wider rounded border-2 transition-all touch-manipulation",
        active ? "bg-[#00d9ff] text-white border-[#00d9ff]" : "border-gray-700 text-gray-400 hover:border-gray-600",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function KnobLike({
  label,
  value01,
  onChange,
  accent = "#22c55e",
}: {
  label: string;
  value01: number;
  onChange: (v01: number) => void;
  accent?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={value01}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-[64px] min-h-[44px] touch-manipulation"
        style={{ accentColor: accent }}
        aria-label={label}
      />
      <span className="text-[10px] md:text-xs font-barlow uppercase text-gray-400 tracking-wider">{label}</span>
      <div className="text-[9px] md:text-[10px] font-mono text-white/40">{Math.round(value01 * 100)}%</div>
    </div>
  );
}

export function FxRack() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fxTarget = useMixerStore((s) => s.fxTarget);
  const setFxTarget = useMixerStore((s) => s.setFxTarget);
  const resetFx = useMixerStore((s) => s.resetFx);
  const fx = useMixerStore((s) => s.fx);
  const setFxParam = useMixerStore((s) => s.setFxParam);
  const kaoss = useMixerStore((s) => s.kaoss);
  const setKaoss = useMixerStore((s) => s.setKaoss);

  const setTarget = (t: FxTarget) => setFxTarget(t);

  // Check which FX are active (non-zero values)
  const activeFx = useMemo(() => {
    return {
      filter: fx.filterCutoff01 < 1,
      grit: fx.grit01 > 0,
      reverb: fx.reverbWet01 > 0,
      delay: fx.delayTime01 > 0 || fx.delayFeedback01 > 0,
      flanger: fx.flangerDepth01 > 0,
      phaser: fx.phaserDepth01 > 0,
      chorus: fx.chorusDepth01 > 0,
    };
  }, [fx]);

  return (
    <section className="p-4 md:p-6 bg-[#0a0a0a] rounded-lg border border-gray-800" data-tour="fx-unit">
      <div className="flex items-center justify-between gap-2 md:gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          <h3 className="text-base md:text-lg font-barlow uppercase tracking-wider text-gray-300">FX RACK</h3>
          <div className="flex gap-2">
            <ToggleButton active={fxTarget === "A"} onClick={() => setTarget("A")}>
              DECK A
            </ToggleButton>
            <ToggleButton active={fxTarget === "B"} onClick={() => setTarget("B")}>
              DECK B
            </ToggleButton>
          </div>
          <button
            type="button"
            onClick={resetFx}
            className="px-2 py-1.5 md:px-3 md:py-1 text-xs font-barlow uppercase tracking-wider rounded border-2 border-gray-700 text-gray-400 hover:border-red-500 hover:text-red-500 transition-all touch-manipulation active:bg-red-500/20"
            title="Reset all FX settings to default"
            aria-label="Clear all FX settings"
          >
            CLEAR ALL
          </button>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-all touch-manipulation"
          aria-label={isCollapsed ? "Expand FX Rack" : "Collapse FX Rack"}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4 lg:gap-6 items-start">
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs text-gray-400 uppercase tracking-widest">FILTER</span>
          <div className="flex gap-1 mb-2 flex-wrap justify-center">
            {(["lpf", "hpf", "bpf"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFxParam("filterType", t)}
                className={[
                  "px-2 py-1 text-[10px] rounded border transition-colors",
                  fx.filterType === t
                    ? "bg-blue-500 text-white border-blue-500"
                    : "border-gray-700 text-gray-500 hover:border-gray-600",
                ].join(" ")}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
          <KnobLike
            label="FREQ"
            value01={fx.filterCutoff01}
            onChange={(v) => setFxParam("filterCutoff01", v)}
            accent="#22c55e"
          />
        </div>

        <div className={`flex flex-col items-center gap-3 relative ${activeFx.grit ? 'ring-2 ring-[#3b82f6] ring-offset-2 ring-offset-[#0a0a0a] rounded-lg p-2' : ''}`}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-widest">GRIT</span>
            {activeFx.grit && (
              <div className="w-2 h-2 bg-[#3b82f6] rounded-full animate-pulse" title="Active" />
            )}
          </div>
          <div className="h-[26px]" />
          <KnobLike
            label="DRIVE"
            value01={fx.grit01}
            onChange={(v) => setFxParam("grit01", v)}
            accent="#3b82f6"
          />
        </div>

        <div className="flex flex-col items-center gap-3">
          <span className="text-xs text-gray-400 uppercase tracking-widest">REVERB</span>
          <div className="h-[26px]" />
          <KnobLike
            label="DRY/WET"
            value01={fx.reverbWet01}
            onChange={(v) => setFxParam("reverbWet01", v)}
            accent="#ef4444"
          />
        </div>

        <div className={`flex flex-col items-center gap-3 relative ${activeFx.delay ? 'ring-2 ring-[#eab308] ring-offset-2 ring-offset-[#0a0a0a] rounded-lg p-2' : ''}`}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-widest">DELAY</span>
            {activeFx.delay && (
              <div className="w-2 h-2 bg-[#eab308] rounded-full animate-pulse" title="Active" />
            )}
          </div>
          <div className="h-[26px]" />
          <div className="flex gap-3 md:gap-4">
            <KnobLike
              label="TIME"
              value01={fx.delayTime01}
              onChange={(v) => setFxParam("delayTime01", v)}
              accent="#eab308"
            />
            <KnobLike
              label="FDBK"
              value01={fx.delayFeedback01}
              onChange={(v) => setFxParam("delayFeedback01", v)}
              accent="#eab308"
            />
          </div>
        </div>

        <KaossPad
          x01={kaoss.x01}
          y01={kaoss.y01}
          onChange={(x, y) => {
            setKaoss(x, y);
            // Mirror Kaoss mapping to FX defaults (will be wired to audio graph next).
            setFxParam("filterCutoff01", x);
            setFxParam("reverbWet01", y);
          }}
        />

        <div className={`flex flex-col items-center gap-3 relative ${activeFx.flanger ? 'ring-2 ring-[#a855f7] ring-offset-2 ring-offset-[#0a0a0a] rounded-lg p-2' : ''}`}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-widest">FLANGER</span>
            {activeFx.flanger && (
              <div className="w-2 h-2 bg-[#a855f7] rounded-full animate-pulse" title="Active" />
            )}
          </div>
          <div className="h-[26px]" />
          <div className="flex gap-3 md:gap-4">
            <KnobLike
              label="RATE"
              value01={fx.flangerRate01}
              onChange={(v) => setFxParam("flangerRate01", v)}
              accent="#a855f7"
            />
            <KnobLike
              label="DEPTH"
              value01={fx.flangerDepth01}
              onChange={(v) => setFxParam("flangerDepth01", v)}
              accent="#a855f7"
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <span className="text-xs text-gray-400 uppercase tracking-widest">PHASER</span>
          <div className="h-[26px]" />
          <div className="flex gap-3 md:gap-4">
            <KnobLike
              label="RATE"
              value01={fx.phaserRate01}
              onChange={(v) => setFxParam("phaserRate01", v)}
              accent="#06b6d4"
            />
            <KnobLike
              label="DEPTH"
              value01={fx.phaserDepth01}
              onChange={(v) => setFxParam("phaserDepth01", v)}
              accent="#06b6d4"
            />
          </div>
        </div>

        <div className={`flex flex-col items-center gap-3 relative ${activeFx.chorus ? 'ring-2 ring-[#22c55e] ring-offset-2 ring-offset-[#0a0a0a] rounded-lg p-2' : ''}`}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-widest">CHORUS</span>
            {activeFx.chorus && (
              <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" title="Active" />
            )}
          </div>
          <div className="h-[26px]" />
          <div className="flex gap-3 md:gap-4">
            <KnobLike
              label="RATE"
              value01={fx.chorusRate01}
              onChange={(v) => setFxParam("chorusRate01", v)}
              accent="#22c55e"
            />
            <KnobLike
              label="DEPTH"
              value01={fx.chorusDepth01}
              onChange={(v) => setFxParam("chorusDepth01", v)}
              accent="#22c55e"
            />
          </div>
        </div>
      </div>
      )}
    </section>
  );
}

