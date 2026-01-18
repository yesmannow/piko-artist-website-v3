"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Save, Sparkles } from "lucide-react";
import { useDeckMixerStore, type TimelineSegment } from "@/store/useDeckMixerStore";

type Template = {
  id: string;
  name: string;
  segments: Omit<TimelineSegment, "id">[];
};

const defaultTemplates: Template[] = [
  {
    id: "lofi-tape",
    name: "Lo-Fi Tape",
    segments: [{ trackId: "1", startBeat: 0, endBeat: 64, transition: "fade" }],
  },
  {
    id: "festival-set",
    name: "Festival Set",
    segments: [
      { trackId: "2", startBeat: 0, endBeat: 64, transition: "cut" },
      { trackId: "3", startBeat: 64, endBeat: 128, transition: "echo-out" },
    ],
  },
];

export function TemplateLibrary() {
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);
  const [selected, setSelected] = useState<string | null>(null);
  const { addTimelineSegment, clearTimeline } = useDeckMixerStore((state) => ({
    addTimelineSegment: state.addTimelineSegment,
    clearTimeline: state.clearTimeline,
  }));

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selected) ?? templates[0],
    [selected, templates],
  );

  const applyTemplate = () => {
    if (!selectedTemplate) return;
    clearTimeline();
    selectedTemplate.segments.forEach((seg) => addTimelineSegment(seg));
  };

  const saveTemplate = (name: string, segments: Omit<TimelineSegment, "id">[]) => {
    setTemplates((prev) => [
      ...prev,
      { id: `template_${Date.now()}`, name, segments },
    ]);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
        <Sparkles className="h-4 w-4 text-[#c1ff00]" />
        Templates
      </div>
      <div className="flex flex-wrap gap-2">
        {templates.map((template) => (
          <motion.button
            key={template.id}
            type="button"
            onClick={() => setSelected(template.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
              selectedTemplate?.id === template.id
                ? "border-[#c1ff00] bg-[#c1ff00]/15 text-white"
                : "border-white/15 bg-white/5 text-white/70 hover:border-white/30"
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {selectedTemplate?.id === template.id && <Check className="h-3.5 w-3.5" />}
            {template.name}
          </motion.button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={applyTemplate}
          className="inline-flex items-center gap-2 rounded-full bg-[#c1ff00] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black"
        >
          Apply Template
        </button>
        <button
          type="button"
          onClick={() =>
            saveTemplate("Custom Template", selectedTemplate?.segments ?? [])
          }
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:border-[#c1ff00]/40"
        >
          <Save className="h-4 w-4" />
          Save As
        </button>
      </div>
    </div>
  );
}
