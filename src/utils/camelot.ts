/**
 * camelot.ts - Camelot Wheel Key Mapping and Compatibility
 *
 * Phase 9C: Utilities for musical key detection and harmonic mixing
 *
 * The Camelot Wheel is a circular key system used by DJs for harmonic mixing:
 * - Keys are numbered 1-12 (representing the circle of fifths)
 * - Each number has A (minor) and B (major) variants
 * - Compatible keys: same number, adjacent numbers, and A↔B variants
 */

export type KeyRoot =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";

export type KeyScale = "major" | "minor";

export interface KeyResult {
  root: KeyRoot;
  scale: KeyScale;
  camelot: string; // e.g., "8A", "5B"
}

/**
 * Camelot Wheel Mapping
 * Maps (root, scale) to Camelot notation
 *
 * The Camelot Wheel:
 * 1A = Abm, 1B = B
 * 2A = Ebm, 2B = F#
 * 3A = Bbm, 3B = Db
 * 4A = Fm, 4B = Ab
 * 5A = Cm, 5B = Eb
 * 6A = Gm, 6B = Bb
 * 7A = Dm, 7B = F
 * 8A = Am, 8B = C
 * 9A = Em, 9B = G
 * 10A = Bm, 10B = D
 * 11A = F#m, 11B = A
 * 12A = C#m, 12B = E
 */
const CAMELOT_MAP: Record<string, string> = {
  // Minor keys (A)
  Abm: "1A",
  Ebm: "2A",
  Bbm: "3A",
  Fm: "4A",
  Cm: "5A",
  Gm: "6A",
  Dm: "7A",
  Am: "8A",
  Em: "9A",
  Bm: "10A",
  "F#m": "11A",
  "C#m": "12A",
  // Major keys (B)
  B: "1B",
  "F#": "2B",
  Db: "3B",
  Ab: "4B",
  Eb: "5B",
  Bb: "6B",
  F: "7B",
  C: "8B",
  G: "9B",
  D: "10B",
  A: "11B",
  E: "12B",
};

/**
 * Convert musical key (root + scale) to Camelot notation
 *
 * @param root - Musical root note (C, C#, D, etc.)
 * @param scale - Major or minor
 * @returns Camelot notation (e.g., "8A", "5B") or null if invalid
 */
export function toCamelot(root: KeyRoot, scale: KeyScale): string | null {
  // Normalize root for lookup
  let keyString: string;

  if (scale === "minor") {
    // Minor keys use lowercase 'm' suffix
    keyString = root === "C#" ? "C#m" : root === "F#" ? "F#m" : `${root}m`;
  } else {
    // Major keys use root as-is (but handle special cases)
    keyString = root;
  }

  return CAMELOT_MAP[keyString] || null;
}

/**
 * Get compatible Camelot keys for harmonic mixing
 *
 * Compatibility rules:
 * 1. Same number (e.g., 8A ↔ 8B)
 * 2. Adjacent numbers (e.g., 8A ↔ 7A, 8A ↔ 9A)
 * 3. Adjacent numbers with opposite scale (e.g., 8A ↔ 7B, 8A ↔ 9B)
 *
 * @param camelot - Camelot notation (e.g., "8A", "5B")
 * @returns Array of compatible Camelot keys
 */
export function compatibleKeys(camelot: string): string[] {
  if (!camelot || camelot.length < 2) {
    return [];
  }

  const number = parseInt(camelot.slice(0, -1), 10);
  const scale = camelot.slice(-1) as "A" | "B";

  if (isNaN(number) || (scale !== "A" && scale !== "B")) {
    return [];
  }

  const compatibles: string[] = [];

  // 1. Same number, opposite scale (A ↔ B)
  const oppositeScale = scale === "A" ? "B" : "A";
  compatibles.push(`${number}${oppositeScale}`);

  // 2. Adjacent numbers, same scale
  const prevNumber = number === 1 ? 12 : number - 1;
  const nextNumber = number === 12 ? 1 : number + 1;
  compatibles.push(`${prevNumber}${scale}`);
  compatibles.push(`${nextNumber}${scale}`);

  // 3. Adjacent numbers, opposite scale
  compatibles.push(`${prevNumber}${oppositeScale}`);
  compatibles.push(`${nextNumber}${oppositeScale}`);

  return compatibles;
}

/**
 * Check if two Camelot keys are compatible
 *
 * @param key1 - First Camelot key
 * @param key2 - Second Camelot key
 * @returns True if keys are compatible for harmonic mixing
 */
export function areKeysCompatible(
  key1: string | null,
  key2: string | null,
): boolean {
  if (!key1 || !key2) {
    return false;
  }

  if (key1 === key2) {
    return true; // Same key is always compatible
  }

  const compatibles = compatibleKeys(key1);
  return compatibles.includes(key2);
}

/**
 * Parse Camelot notation to extract number and scale
 *
 * @param camelot - Camelot notation (e.g., "8A", "5B")
 * @returns Object with number and scale, or null if invalid
 */
export function parseCamelot(
  camelot: string,
): { number: number; scale: "A" | "B" } | null {
  if (!camelot || camelot.length < 2) {
    return null;
  }

  const number = parseInt(camelot.slice(0, -1), 10);
  const scale = camelot.slice(-1) as "A" | "B";

  if (
    isNaN(number) ||
    number < 1 ||
    number > 12 ||
    (scale !== "A" && scale !== "B")
  ) {
    return null;
  }

  return { number, scale };
}
