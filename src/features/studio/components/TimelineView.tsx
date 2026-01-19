"use client";

import { useMemo } from "react";
import { TimelineCanvas } from "./TimelineCanvas";
import { useStudioStore } from "../stores/useStudioStore";
import { CamelotBadge } from "./CamelotBadge";

export function TimelineView() {
  const timelineTracks = useStudioStore((s) => s.timelineTracks);
  const timelineMode = useStudioStore((s) => s.timelineMode);
  const setTimelineMode = useStudioStore((s) => s.setTimelineMode);
  const snapEnabled = useStudioStore((s) => s.snapEnabled);
  const setSnapEnabled = useStudioStore((s) => s.setSnapEnabled);
  const selectedLane = useStudioStore((s) => s.selectedAutomationLane);
  const setSelectedLane = useStudioStore((s) => s.setSelectedAutomationLane);

  const emptyHint = useMemo(() => timelineTracks.length === 0, [timelineTracks.length]);

  const clipSequence = useMemo(() => {
    const clips = timelineTracks.flatMap((t) =>
      t.clips.map((c) => ({
        id: c.id,
        name: c.name,
        startSeconds: c.startSeconds,
        camelot: c.camelot,
      }))
    );
    clips.sort((a, b) => a.startSeconds - b.startSeconds);
    return clips;
  }, [timelineTracks]);

  return (
    <section className="flex-1 min-h-0 glass-panel p-2 overflow-hidden">
      <div className="h-full w-full flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 px-2 flex-wrap">
          <div className="text-xs text-white/70 uppercase tracking-wider font-bold">
            Timeline
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setTimelineMode(timelineMode === "clips" ? "automation" : "clips")}
              className={[
                "px-2 py-1 border text-[10px] font-black uppercase tracking-wider",
                timelineMode === "clips"
                  ? "border-white/15 text-white/70 bg-black/30"
                  : "border-[#FFD700] text-[#FFD700] bg-black/50",
              ].join(" ")}
            >
              {timelineMode === "clips" ? "Edit" : "Automation"}
            </button>

            <button
              type="button"
              onClick={() => setSnapEnabled(!snapEnabled)}
              className={[
                "px-2 py-1 border text-[10px] font-black uppercase tracking-wider",
                snapEnabled
                  ? "border-emerald-400/40 text-emerald-200 bg-black/40"
                  : "border-white/10 text-white/40 bg-black/20",
              ].join(" ")}
              title="Shift disables snap temporarily"
            >
              Snap
            </button>

            {timelineMode === "automation" && (
              <div className="flex items-center gap-1">
                {(["volume", "filter"] as const).map((lane) => (
                  <button
                    key={lane}
                    type="button"
                    onClick={() => setSelectedLane(lane)}
                    className={[
                      "px-2 py-1 border text-[10px] font-black uppercase tracking-wider",
                      selectedLane === lane
                        ? "border-[#FFD700] text-[#FFD700] bg-black/50"
                        : "border-white/10 text-white/50 bg-black/20",
                    ].join(" ")}
                  >
                    {lane}
                  </button>
                ))}
              </div>
            )}

            <div className="text-[10px] text-white/40 font-mono uppercase tracking-[0.25em]">
              Drag pan • Ctrl+wheel zoom • Drop import • S split • Del delete • Shift no-snap
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <TimelineCanvas tracks={timelineTracks} />
        </div>

        {clipSequence.length > 0 && (
          <div className="px-2 py-2 border border-white/10 bg-black/20 overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max">
              {clipSequence.slice(0, 16).map((c, idx) => (
                <div key={c.id} className="flex items-center gap-2">
                  <CamelotBadge
                    camelot={c.camelot}
                    previousCamelot={idx > 0 ? clipSequence[idx - 1]?.camelot : undefined}
                  />
                  <div className="text-xs text-white/60 font-mono max-w-[180px] truncate">
                    {c.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {emptyHint && (
          <div className="px-3 py-2 text-xs text-white/50 border border-white/10 bg-black/20">
            Drop an audio file onto the timeline to create your first clip.
          </div>
        )}
      </div>
    </section>
  );
}

