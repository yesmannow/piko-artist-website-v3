"use client";

import { useMixerStore } from "../stores/useMixerStore";
import { Fader } from "@/features/ui-glass/controls/Fader";

function EqKnob({
  label,
  value,
  color,
  onChange,
}: {
  label: string;
  value: number; // -1..1
  color: string;
  onChange: (v: number) => void;
}) {
  // Map -1..1 to 0..1 for slider
  const v01 = (value + 1) / 2;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-[10px] md:text-xs font-barlow uppercase font-bold mb-1" style={{ color }}>
        {label}
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={v01}
        onChange={(e) => onChange(Number(e.target.value) * 2 - 1)}
        className="w-[64px]"
        style={{ accentColor: color }}
        aria-label={`${label} EQ`}
      />
      <button
        type="button"
        className="w-10 h-8 md:w-8 md:h-6 text-xs font-barlow uppercase rounded border transition-colors touch-manipulation bg-[#1a1a1a] text-gray-400"
        style={{ borderColor: `${color}80` }}
        aria-label={`Kill ${label}`}
        title={`Kill ${label}`}
        onClick={() => {
          // Kill is wired at audio-graph stage; UI stub for now.
        }}
      >
        K
      </button>
    </div>
  );
}

export function MixerCenter() {
  const bpm = useMixerStore((s) => s.bpm);
  const setBpm = useMixerStore((s) => s.setBpm);

  const crossfader = useMixerStore((s) => s.crossfader);
  const setCrossfader = useMixerStore((s) => s.setCrossfader);
  const curve = useMixerStore((s) => s.crossfaderCurve);
  const setCurve = useMixerStore((s) => s.setCrossfaderCurve);

  const deckVolume = useMixerStore((s) => s.deckVolume);
  const setDeckVolume = useMixerStore((s) => s.setDeckVolume);

  const eqA = useMixerStore((s) => s.eq.A);
  const eqB = useMixerStore((s) => s.eq.B);
  const setEq = useMixerStore((s) => s.setEq);

  return (
    <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 bg-[#0a0a0a] rounded-lg border border-gray-800 shadow-lg">
      <div className="text-center">
        <h3 className="text-base md:text-lg font-barlow uppercase tracking-wider text-gray-300 mb-2">MIXER</h3>
      </div>

      <div className="flex items-center justify-center gap-3">
        <label className="text-xs font-barlow uppercase tracking-wider text-gray-400">
          BPM
        </label>
        <input
          type="number"
          min={1}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-24 px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded text-white font-mono text-xs"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Deck A strip */}
        <div className="flex flex-col items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#1a1a1a]/50 rounded-lg border border-gray-800/50">
          <div className="text-xs md:text-sm font-barlow uppercase text-[#00d9ff] mb-1 font-bold tracking-wider">DECK A</div>
          <Fader
            value={deckVolume.A}
            onChange={(v) => setDeckVolume("A", v)}
            orientation="vertical"
            min={0}
            max={1}
            step={0.01}
            label="VOL"
          />
          <div className="flex gap-2 md:gap-3 justify-center flex-wrap">
            <EqKnob label="HIGH" value={eqA.high} onChange={(v) => setEq("A", "high", v)} color="#ef4444" />
            <EqKnob label="MID" value={eqA.mid} onChange={(v) => setEq("A", "mid", v)} color="#22c55e" />
            <EqKnob label="LOW" value={eqA.low} onChange={(v) => setEq("A", "low", v)} color="#3b82f6" />
          </div>
        </div>

        {/* Center: Crossfader */}
        <div className="flex flex-col items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#1a1a1a]/50 rounded-lg border border-gray-800/50">
          <div className="text-[10px] md:text-xs font-barlow uppercase text-gray-400 mb-2 text-center tracking-wider">CROSSFADER</div>
          <div className="w-full flex flex-col items-center gap-2">
            <input
              type="range"
              min={-1}
              max={1}
              step={0.001}
              value={crossfader}
              onChange={(e) => setCrossfader(Number(e.target.value))}
              className="w-full accent-[#00ff00] min-h-[44px] touch-manipulation"
              aria-label="Crossfader"
            />
            <div className="flex gap-2 flex-wrap justify-center">
              {(["linear", "sharp", "smooth"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurve(c)}
                  className={[
                    "px-2 md:px-3 py-1.5 text-[9px] md:text-[10px] font-barlow uppercase rounded border transition-all touch-manipulation min-h-[44px] min-w-[60px]",
                    curve === c ? "bg-[#00ff00] text-black border-[#00ff00]" : "bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-600",
                  ].join(" ")}
                >
                  {c.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[9px] md:text-[10px] font-mono text-white/40 uppercase tracking-[0.25em]">
            {crossfader.toFixed(2)}
          </div>
        </div>

        {/* Deck B strip */}
        <div className="flex flex-col items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#1a1a1a]/50 rounded-lg border border-gray-800/50">
          <div className="text-xs md:text-sm font-barlow uppercase text-[#ff00d9] mb-1 font-bold tracking-wider">DECK B</div>
          <Fader
            value={deckVolume.B}
            onChange={(v) => setDeckVolume("B", v)}
            orientation="vertical"
            min={0}
            max={1}
            step={0.01}
            label="VOL"
          />
          <div className="flex gap-2 md:gap-3 justify-center flex-wrap">
            <EqKnob label="HIGH" value={eqB.high} onChange={(v) => setEq("B", "high", v)} color="#ef4444" />
            <EqKnob label="MID" value={eqB.mid} onChange={(v) => setEq("B", "mid", v)} color="#22c55e" />
            <EqKnob label="LOW" value={eqB.low} onChange={(v) => setEq("B", "low", v)} color="#3b82f6" />
          </div>
        </div>
      </div>
    </div>
  );
}

