"use client";

import { useMemo } from "react";

function parseCamelot(code: string | undefined) {
  if (!code) return null;
  const m = code.trim().match(/^(\d{1,2})([AB])$/i);
  if (!m) return null;
  const n = Number(m[1]);
  const l = m[2]!.toUpperCase() as "A" | "B";
  if (!Number.isFinite(n) || n < 1 || n > 12) return null;
  return { n, l };
}

function isHarmonicMatch(current?: string, previous?: string): boolean {
  const c = parseCamelot(current);
  const p = parseCamelot(previous);
  if (!c || !p) return false;

  if (c.n === p.n && c.l === p.l) return true; // same key
  if (c.n === p.n && c.l !== p.l) return true; // relative major/minor (A<->B)
  if (c.l === p.l) {
    const d = Math.abs(c.n - p.n);
    return d === 1 || d === 11; // adjacent on wheel (wrap)
  }
  return false;
}

export function CamelotBadge({
  camelot,
  previousCamelot,
  label,
}: {
  camelot?: string;
  previousCamelot?: string;
  label?: string;
}) {
  const match = useMemo(() => isHarmonicMatch(camelot, previousCamelot), [camelot, previousCamelot]);

  return (
    <div className="inline-flex items-center gap-2">
      {label && (
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">
          {label}
        </span>
      )}
      <span
        className={[
          "px-2 py-1 border text-[11px] font-black uppercase tracking-wider",
          "bg-black/40",
          match
            ? "border-emerald-400 text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.35)]"
            : "border-white/15 text-white/70",
        ].join(" ")}
        title={match ? "Harmonic match" : "No harmonic match"}
      >
        {camelot ?? "--"}
      </span>
    </div>
  );
}

