"use client";

import { useMemo } from "react";
import { useStudioStore, StudioStemId } from "../stores/useStudioStore";
import { StudioEngine } from "../lib/StudioEngine";

type StemButtonConfig = {
  id: StudioStemId;
  label: string;
  glowClass: string;
};

const STEMS: StemButtonConfig[] = [
  { id: "vocal", label: "VOCALS", glowClass: "shadow-[0_0_15px_#0ff]" },
  { id: "drum", label: "DRUMS", glowClass: "shadow-[0_0_15px_#f0f]" },
  { id: "bass", label: "BASS", glowClass: "shadow-[0_0_15px_#0f0]" },
  { id: "other", label: "SYNTH", glowClass: "shadow-[0_0_15px_#FFD700]" },
];

export function MixerRack() {
  const activeDeck = useStudioStore((s) => s.activeDeck);
  const deckTrackIds = useStudioStore((s) => s.deckTrackIds);
  const tracks = useStudioStore((s) => s.tracks);
  const toggleStem = useStudioStore((s) => s.toggleStem);
  const bpm = useStudioStore((s) => s.bpm);

  const activeTrackId = deckTrackIds[activeDeck];
  const activeTrack = useMemo(
    () => tracks.find((t) => t.id === activeTrackId) ?? tracks[0] ?? null,
    [activeTrackId, tracks]
  );

  const handleAutomix = async () => {
    const engine = StudioEngine.getInstance();
    await engine.initFromUserGesture();

    const fromId = deckTrackIds[activeDeck];
    const toDeck = activeDeck === "A" ? "B" : "A";
    const toId = deckTrackIds[toDeck];
    if (!fromId || !toId) return;

    const ctx = await engine.initFromUserGesture();

    const rmsEnergyMap = (mono: Float32Array, sampleRate: number) => {
      const bucketSize = Math.max(1, Math.floor(sampleRate));
      const buckets = Math.max(1, Math.ceil(mono.length / bucketSize));
      const out = new Array<number>(buckets);
      let max = 0;
      for (let b = 0; b < buckets; b++) {
        const start = b * bucketSize;
        const end = Math.min(mono.length, start + bucketSize);
        let sumSq = 0;
        const n = Math.max(1, end - start);
        for (let i = start; i < end; i++) {
          const v = mono[i] ?? 0;
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / n);
        out[b] = rms;
        if (rms > max) max = rms;
      }
      if (max > 0) {
        for (let i = 0; i < out.length; i++) out[i] = Math.max(0, Math.min(1, (out[i] ?? 0) / max));
      }
      return out;
    };

    const avg = (arr: number[], from: number, to: number) => {
      let s = 0;
      let c = 0;
      for (let i = from; i < to; i++) {
        const v = arr[i];
        if (typeof v === "number") {
          s += v;
          c++;
        }
      }
      return c ? s / c : 0;
    };

    // Ensure both tracks have at least the "other" stem loaded (fallback = full mix).
    // If they haven't been loaded via the header yet, load them here.
    const ensureLoaded = async (id: string) => {
      const t = tracks.find((x) => x.id === id);
      if (!t) return;
      const res = await fetch(t.url, { cache: "default" });
      if (!res.ok) throw new Error(`Failed to fetch audio (${res.status}): ${t.url}`);
      const ab = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(ab.slice(0));
      // TEMP (until pre-separated stems are provided): reuse full mix for all stems.
      (["vocal", "drum", "bass", "other"] as const).forEach((stem) => {
        engine.setStemBuffer(id, stem, buf);
      });
      engine.setTrackVolume(id, t.volume);
      (Object.entries(t.stems) as Array<[StudioStemId, boolean]>).forEach(([stem, enabled]) =>
        engine.setStemActive(id, stem, enabled)
      );

      const energyMap = rmsEnergyMap(buf.getChannelData(0), buf.sampleRate);
      return { energyMap };
    };

    const fromAnalysis = await ensureLoaded(fromId);
    const toAnalysis = await ensureLoaded(toId);

    // Energy-aware duration + curve
    const outEnergy = fromAnalysis?.energyMap
      ? avg(fromAnalysis.energyMap, Math.max(0, fromAnalysis.energyMap.length - 4), fromAnalysis.energyMap.length)
      : 0.5;
    const inEnergy = toAnalysis?.energyMap ? avg(toAnalysis.energyMap, 0, Math.min(4, toAnalysis.energyMap.length)) : 0.5;
    const k = Math.max(0, Math.min(1, (outEnergy + inEnergy) / 2));

    // 4..8 bars @ 4/4
    const beats = 16 + Math.round(16 * k);
    const seconds = (beats * 60) / Math.max(1, bpm);

    const points = 128;
    const curve = new Float32Array(points);
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1);
      // cosine ease in/out
      curve[i] = 0.5 - 0.5 * Math.cos(Math.PI * t);
    }

    engine.automixCrossfadeCurve(fromId, toId, seconds, curve);
  };

  return (
    <section className="glass-panel w-full px-3 py-3">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-xs text-white/70 uppercase tracking-wider font-bold">
          Mixer Rack
        </div>
        <div className="text-xs text-white/40 font-technical truncate max-w-[60%]">
          {activeTrack ? `Deck ${activeDeck}: ${activeTrack.id}` : "No track selected"}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <button
          type="button"
          onClick={() => void handleAutomix()}
          className="px-3 py-2 border border-white/10 bg-black/50 hover:bg-black/70 text-xs font-black uppercase tracking-wider"
        >
          Automix
        </button>
        <div className="text-[10px] text-white/40 font-mono uppercase tracking-[0.25em]">
          Energy-aware crossfade
        </div>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
        {STEMS.map((stem) => {
          const enabled = activeTrack?.stems[stem.id] ?? false;
          return (
            <button
              key={stem.id}
              type="button"
              onClick={() => {
                const nextEnabled = !enabled;
                toggleStem(stem.id);
                if (activeTrack) {
                  StudioEngine.getInstance().setStemActive(activeTrack.id, stem.id, nextEnabled);
                }
              }}
              className={[
                "px-3 py-3 border text-xs font-black uppercase tracking-wider",
                "bg-black/40 hover:bg-black/60",
                "transition-shadow",
                enabled ? `border-white/20 text-white ${stem.glowClass}` : "border-white/10 text-white/40",
              ].join(" ")}
              aria-pressed={enabled}
            >
              {stem.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

