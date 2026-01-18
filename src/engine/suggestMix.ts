import { MediaItem, tracks } from "@/lib/data";
import { getCamelotCompatibility } from "@/lib/music/camelotUtils";

type SuggestParams = {
  currentKeys?: Array<string | null | undefined>;
  currentBpms?: Array<number | null | undefined>;
  vibe?: MediaItem["vibe"] | "any";
  genre?: string | "any";
  energy?: "low" | "mid" | "high" | "any";
  limit?: number;
};

export type TrackSuggestion = {
  track: MediaItem;
  score: number;
  reason: string;
};

const clampScore = (value: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value));

export function suggestMix({
  currentKeys = [],
  currentBpms = [],
  vibe = "any",
  genre = "any",
  energy = "any",
  limit = 10,
}: SuggestParams): TrackSuggestion[] {
  const keyRefs = currentKeys.filter(Boolean) as string[];
  const bpmRefs = currentBpms.filter(
    (bpm): bpm is number => typeof bpm === "number",
  );

  const candidates = tracks.filter((t) => t.type === "audio");

  const scored = candidates.map((track) => {
    const keyScore = keyRefs.length
      ? Math.max(
          ...keyRefs.map((k) =>
            getCamelotCompatibility(k, track.keyInfo?.camelot),
          ),
        )
      : 50;

    const bpmScore = bpmRefs.length
      ? Math.max(
          ...bpmRefs.map((b) => {
            const diff = Math.abs((track.bpm ?? b) - b);
            if (diff <= 2) return 100;
            if (diff <= 5) return 80;
            if (diff <= 8) return 60;
            return 30;
          }),
        )
      : 50;

    const vibeScore = vibe === "any" || track.vibe === vibe ? 90 : 60;
    const genreScore = genre === "any" ? 70 : 60;

    const energyScore =
      energy === "any"
        ? 70
        : energy === "high"
          ? 80
          : energy === "mid"
            ? 70
            : 60;

    const score = clampScore(
      0.4 * keyScore +
        0.3 * bpmScore +
        0.15 * vibeScore +
        0.1 * energyScore +
        0.05 * genreScore,
    );

    const reason = [
      keyRefs.length ? `Key ${keyScore.toFixed(0)}%` : null,
      bpmRefs.length ? `BPM Δ score ${bpmScore.toFixed(0)}%` : null,
      vibe !== "any" ? `Vibe ${track.vibe}` : null,
      genre !== "any" ? `Genre ${genre}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return { track, score, reason };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
