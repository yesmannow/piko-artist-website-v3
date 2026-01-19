"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useStudioStore } from "../stores/useStudioStore";
import { renderTimelineToWav } from "../lib/export/renderTimelineToWav";
import { downloadBlob } from "../lib/export/download";
import { recordCanvasWithAudio } from "../lib/export/recordCanvasWithAudio";

export function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const timelineTracks = useStudioStore((s) => s.timelineTracks);

  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoSeconds, setVideoSeconds] = useState(15);

  const hasTimeline = useMemo(
    () => timelineTracks.some((t) => t.clips.length > 0),
    [timelineTracks]
  );

  if (!open) return null;

  const findTimelineCanvas = (): HTMLCanvasElement | null => {
    const el = document.querySelector('canvas[aria-label="Studio timeline"]');
    return el instanceof HTMLCanvasElement ? el : null;
  };

  const exportWav = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const blob = await renderTimelineToWav(timelineTracks);
      downloadBlob(blob, `piko-studio-export-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.wav`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const exportVideo = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const canvas = findTimelineCanvas();
      if (!canvas) throw new Error("Timeline canvas not found. Keep the Studio view visible while exporting.");
      const { blob, ext } = await recordCanvasWithAudio({
        canvas,
        durationSeconds: Math.max(1, Math.min(120, videoSeconds)),
      });
      downloadBlob(
        blob,
        `piko-studio-capture-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${ext}`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Video export failed.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Export"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl border border-white/10 bg-black/60 glass-panel p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-xs text-white/60 font-mono uppercase tracking-[0.25em]">
              EXPORT_PIPELINE
            </div>
            <div className="text-xl font-black uppercase tracking-wider">Export</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 border border-white/10 bg-black/40 hover:bg-black/60"
            aria-label="Close export modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="border border-white/10 bg-black/30 p-3">
            <div className="text-xs font-mono uppercase tracking-[0.25em] text-white/60">
              WAV_OFFLINE_RENDER
            </div>
            <div className="text-sm text-white/70 mt-1">
              Faster-than-realtime render of the current **timeline clips** (requires dropped/imported audio).
            </div>
            <button
              type="button"
              disabled={isBusy || !hasTimeline}
              onClick={() => void exportWav()}
              className="mt-3 px-4 py-3 border border-white/10 bg-black/50 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black uppercase tracking-wider"
            >
              Export WAV
            </button>
            {!hasTimeline && (
              <div className="mt-2 text-[11px] text-white/40">
                Tip: drop audio files onto the timeline first.
              </div>
            )}
          </div>

          <div className="border border-white/10 bg-black/30 p-3">
            <div className="text-xs font-mono uppercase tracking-[0.25em] text-white/60">
              VIDEO_CAPTURE
            </div>
            <div className="text-sm text-white/70 mt-1">
              Real-time capture of the timeline canvas + master audio. Output is MP4 if supported, otherwise WebM.
            </div>
            <div className="mt-3 flex items-center gap-3">
              <label className="text-xs text-white/70 font-mono uppercase tracking-[0.25em]">
                Seconds
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={videoSeconds}
                onChange={(e) => setVideoSeconds(Number(e.target.value))}
                className="w-24 bg-black/50 border border-white/10 px-2 py-2 text-white"
              />
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void exportVideo()}
                className="px-4 py-3 border border-white/10 bg-black/50 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black uppercase tracking-wider"
              >
                Capture Video
              </button>
            </div>
          </div>

          {error && (
            <div className="border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

