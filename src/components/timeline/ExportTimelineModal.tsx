"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X } from "lucide-react";
import { useDeckMixerStore } from "@/store/useDeckMixerStore";

type ExportTimelineModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ExportTimelineModal({ open, onClose }: ExportTimelineModalProps) {
  const { startTimelineRender, timelineRender, resetTimelineRender } =
    useDeckMixerStore((state) => ({
      startTimelineRender: state.startTimelineRender,
      timelineRender: state.timelineRender,
      resetTimelineRender: state.resetTimelineRender,
    }));

  useEffect(() => {
    if (!open) resetTimelineRender();
  }, [open, resetTimelineRender]);

  const handleExport = async () => {
    await startTimelineRender();
  };

  const download = () => {
    if (timelineRender.url) {
      const link = document.createElement("a");
      link.href = timelineRender.url;
      link.download = "timeline-mix.wav";
      link.click();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1100] bg-black/70 backdrop-blur-sm px-4 py-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            className="mx-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b0f1c] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm uppercase tracking-[0.18em] text-white/70">
                Export Timeline
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white hover:border-[#c1ff00]/40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-white/70">
              <p>
                Render the current timeline to a WAV file using an offline audio context.
                Add a title and tags in your release workflow after download.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-white/70">
              <span className="rounded-full bg-white/5 px-3 py-1">
                Status: {timelineRender.status}
              </span>
              {timelineRender.duration ? (
                <span className="rounded-full bg-white/5 px-3 py-1">
                  Duration: {timelineRender.duration.toFixed(1)}s
                </span>
              ) : null}
            </div>

            {timelineRender.error ? (
              <div className="mt-3 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                {timelineRender.error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExport}
                disabled={timelineRender.status === "rendering"}
                className="inline-flex items-center gap-2 rounded-full bg-[#c1ff00] px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-black disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                Render + Save
              </button>
              <button
                type="button"
                onClick={download}
                disabled={!timelineRender.url}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
              >
                Download WAV
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
