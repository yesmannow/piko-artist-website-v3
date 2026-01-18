"use client";

import { motion } from "framer-motion";

export type VideoCategory =
  | "ALL"
  | "HYPE"
  | "CHILL"
  | "STORYTELLING"
  | "CLASSIC";

interface VideoFilterNavProps {
  categories: VideoCategory[];
  active: VideoCategory;
  onChange: (category: VideoCategory) => void;
}

export function VideoFilterNav({
  categories,
  active,
  onChange,
}: VideoFilterNavProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const isActive = active === cat;
        return (
          <motion.button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              isActive
                ? "border-[#c1ff00] bg-[#c1ff00] text-black shadow-[0_0_20px_rgba(193,255,0,0.35)]"
                : "border-white/15 bg-white/5 text-white/70 hover:border-[#c1ff00]/40 hover:text-white"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            aria-pressed={isActive}
          >
            {cat}
          </motion.button>
        );
      })}
    </div>
  );
}
