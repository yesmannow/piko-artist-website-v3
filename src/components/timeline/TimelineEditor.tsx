"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, ZoomIn, ZoomOut, Download } from "lucide-react";
import { useDeckMixerStore } from "@/store/useDeckMixerStore";
import { tracks } from "@/lib/data";
import { TemplateLibrary } from "@/components/timeline/TemplateLibrary";
import { ExportTimelineModal } from "@/components/timeline/ExportTimelineModal";
import { SmartSuggestButton } from "@/components/SmartSuggestButton";
import { transitionSnippets } from "@/lib/transitionSnippets";

const BEAT_WIDTH = 24;

export function TimelineEditor() {
  const {
    mixTimeline,
    addTimelineSegment,
    updateTimelineSegment,
    removeTimelineSegment,
    timelineRender,
  } = useDeckMixerStore((state) => ({
    mixTimeline: state.mixTimeline,
    addTimelineSegment: state.addTimelineSegment,
    updateTimelineSegment: state.updateTimelineSegment,
    removeTimelineSegment: state.removeTimelineSegment,
    timelineRender: state.timelineRender,
  }));

  const [zoom, setZoom] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);

  const beatWidth = useMemo(
    () => Math.max(12, Math.min(64, BEAT_WIDTH * zoom)),
    [zoom],
  );

  const addPlaceholderSegment = () => {
    const track = tracks[0];
    if (!track) return;
    addTimelineSegment({
      trackId: track.id,
      startBeat: mixTimeline.length * 16,
      endBeat: mixTimeline.length * 16 + 16,
      transition: "fade",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70">
          Timeline Editor • Beat-Synced Planning
        </div>
        <div className="flex items-center gap-2">
          <SmartSuggestButton />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white"
          >
            <ZoomIn className="h-4 w-4" /> Zoom In
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white"
          >
            <ZoomOut className="h-4 w-4" /> Zoom Out
          </button>
          <button
            type="button"
            onClick={addPlaceholderSegment}
            className="inline-flex items-center gap-2 rounded-full bg-[#c1ff00] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black"
          >
            <Plus className="h-4 w-4" /> Add Segment
          </button>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:border-[#c1ff00]/40"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      <TemplateLibrary />

      <div className="rounded-3xl border border-white/10 bg-[#0b0f1c] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/60">
          Beat Grid
        </div>
        <div className="relative overflow-x-auto">
          <div className="relative min-w-full">
            <div className="relative h-24 border-y border-white/5">
              <div
                className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px)]"
                style={{ backgroundSize: `${beatWidth}px 100%` }}
              />
              {mixTimeline.map((segment) => {
                const track = tracks.find((t) => t.id === segment.trackId);
                const width =
                  segment.endBeat && segment.endBeat > segment.startBeat
                    ? (segment.endBeat - segment.startBeat) * beatWidth
                    : 16 * beatWidth;
                const left = segment.startBeat * beatWidth;
                return (
                  <motion.div
                    key={segment.id}
                    className="absolute top-4 rounded-xl border border-[#c1ff00]/50 bg-[#c1ff00]/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-[0_0_20px_rgba(193,255,0,0.2)]"
                    style={{ width, left }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {track?.title ?? "Track"}
                      </span>
                      <button
                        type="button"
                        className="text-[10px] uppercase tracking-[0.14em] text-white/70 underline"
                        onClick={() => removeTimelineSegment(segment.id)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-white/60">
                      <span>
                        Beats {segment.startBeat}–{segment.endBeat ?? "?"}
                      </span>
                      {segment.transition ? (
                        <span className="rounded-full bg-black/40 px-2 py-0.5 text-white/70">
                          {segment.transition}
                        </span>
                      ) : null}
                      <select
                        value={segment.transition ?? ""}
                        onChange={(e) =>
                          updateTimelineSegment(segment.id, {
                            transition: (e.target.value ||
                              undefined) as typeof segment.transition,
                          })
                        }
                        className="rounded border border-white/20 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/80"
                      >
                        <option value="">Transition</option>
                        {transitionSnippets.map((snippet) => (
                          <option key={snippet.id} value={snippet.transition}>
                            {snippet.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <ExportTimelineModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}
