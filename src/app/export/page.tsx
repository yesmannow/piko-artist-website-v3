"use client";

import { useEffect, useMemo, useState } from "react";
import { ensureAudioEngineReady } from "@/engine/AudioEngine";
import { format } from "date-fns";
import Link from "next/link";
import { ShareMixModal } from "@/components/ShareMixModal";

interface StoredMix {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

const STORAGE_KEY = "piko_mixes";

const loadMixes = (): StoredMix[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredMix[]) : [];
  } catch {
    return [];
  }
};

const saveMixes = (mixes: StoredMix[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mixes));
};

export default function ExportPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [mixes, setMixes] = useState<StoredMix[]>([]);
  const [shareId, setShareId] = useState<string | null>(null);
  const nextTitle = useMemo(
    () => `Piko Mix ${format(new Date(), "yyyy-MM-dd_HH-mm")}`,
    [],
  );

  useEffect(() => {
    setMixes(loadMixes());
  }, []);

  const startRecording = async () => {
    const engine = await ensureAudioEngineReady();
    const ok = engine.startRecording();
    setIsRecording(ok);
  };

  const stopRecording = async () => {
    const engine = await ensureAudioEngineReady();
    const blob = await engine.stopRecording();
    setIsRecording(false);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const entry: StoredMix = {
      id: crypto.randomUUID(),
      title: nextTitle,
      url,
      createdAt: new Date().toISOString(),
    };
    const updated = [entry, ...mixes];
    setMixes(updated);
    saveMixes(updated);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${entry.title}.webm`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">
            Export
          </p>
          <h1 className="text-2xl font-bold">Mix Recorder</h1>
        </div>
        <Link href="/" className="text-sm text-safety-yellow underline">
          Back home
        </Link>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/60">
            Session Recording
          </span>
          <span
            className={`inline-flex h-2 w-2 rounded-full ${isRecording ? "bg-red-500 shadow-[0_0_10px_rgba(255,0,0,0.6)]" : "bg-white/40"}`}
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={startRecording}
            disabled={isRecording}
            className="rounded-full bg-safety-yellow px-4 py-2 text-black text-xs font-bold uppercase tracking-[0.18em] disabled:opacity-50"
          >
            Start Recording
          </button>
          <button
            type="button"
            onClick={stopRecording}
            disabled={!isRecording}
            className="rounded-full border border-white/30 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50"
          >
            Stop + Save
          </button>
        </div>
        <p className="text-xs text-white/60">
          Audio is captured from the master bus via MediaRecorder and downloaded
          locally as .webm.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/60">
            Saved Mixes
          </span>
          <span className="text-xs text-white/60">{mixes.length} items</span>
        </div>
        <div className="space-y-2">
          {mixes.length === 0 ? (
            <p className="text-sm text-white/60">
              No mixes yet. Record to generate a file.
            </p>
          ) : (
            mixes.map((mix) => (
              <div
                key={mix.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold">{mix.title}</p>
                  <p className="text-[11px] text-white/60">
                    {new Date(mix.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={mix.url}
                    download={`${mix.title}.webm`}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.14em] text-white/80 hover:border-white/40"
                  >
                    Download
                  </a>
                  <Link
                    href={`/embed/${mix.id}?title=${encodeURIComponent(mix.title)}&url=${encodeURIComponent(mix.url)}`}
                    className="rounded-full border border-safety-yellow px-3 py-1 text-xs uppercase tracking-[0.14em] text-safety-yellow"
                  >
                    Embed
                  </Link>
                  <button
                    onClick={() => setShareId(mix.id)}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.14em] text-white/80 hover:border-white/50"
                  >
                    Share
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ShareMixModal
        open={!!shareId}
        onClose={() => setShareId(null)}
        title={mixes.find((m) => m.id === shareId)?.title ?? nextTitle}
        mixUrl={
          shareId
            ? (mixes.find((m) => m.id === shareId)?.url ?? "")
            : (mixes[0]?.url ?? "")
        }
        coverArt="/images/tracks/dj-2581269_1280.jpg"
      />
    </div>
  );
}
