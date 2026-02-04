/**
 * Phase S11.2: Canonical Track Key Utilities
 *
 * Provides a single source of truth for track identification across:
 * - Local file paths (/audio/tracks/te-perdi.mp3)
 * - API routes (/api/tracks?trackId=te-perdi)
 * - Future cloud URLs (https://r2.../audio/te-perdi.mp3)
 * - IndexedDB keys (insights, peaks, cues)
 *
 * CANONICAL TRACK KEY FORMAT:
 * - Lowercase slug without extension
 * - Examples: "te-perdi", "amor-sincero", "crussin"
 *
 * Benefits:
 * - Cache hit rate for insights/peaks/cues (stable key)
 * - Per-track cues follow the song (not tied to URL)
 * - No duplicate DB entries (te-perdi.mp3 vs /audio/tracks/te-perdi.mp3)
 * - Fewer fetch failures (URL vs trackKey separation)
 */

/**
 * Normalize any track identifier to canonical trackKey format
 *
 * Strips:
 * - File extensions (.mp3, .wav, .ogg, .m4a, .flac)
 * - Path prefixes (/audio/tracks/, /audio/, audio/)
 * - URL schemes and domains (https://...)
 * - API query params (/api/tracks?trackId=...)
 *
 * Transforms:
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Decodes URI components (%20 → space → hyphen)
 *
 * @param input Raw track identifier (filename, URL, path, or slug)
 * @returns Canonical trackKey (e.g., "te-perdi")
 *
 * @example
 * normalizeTrackId("te-perdi.mp3") → "te-perdi"
 * normalizeTrackId("/audio/tracks/te-perdi.mp3") → "te-perdi"
 * normalizeTrackId("https://r2.../audio/Te%20Perdi.mp3") → "te-perdi"
 * normalizeTrackId("/api/tracks?trackId=te-perdi") → "te-perdi"
 */
export function normalizeTrackId(input: string): string {
  if (!input) return '';

  let normalized = input;

  // Decode URI components first (handle %20, etc.)
  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // If decode fails, continue with original
  }

  // Strip URL scheme and domain if present
  // https://example.com/audio/tracks/te-perdi.mp3 → /audio/tracks/te-perdi.mp3
  try {
    const url = new URL(normalized);
    normalized = url.pathname + url.search;
  } catch {
    // Not a full URL, continue
  }

  // Strip API query params
  // /api/tracks?trackId=te-perdi → te-perdi
  if (normalized.includes('?trackId=')) {
    const match = normalized.match(/trackId=([^&]+)/);
    if (match?.[1]) {
      normalized = match[1];
    }
  }

  // Strip common path prefixes
  normalized = normalized
    .replace(/^\/audio\/tracks\//, '')
    .replace(/^\/audio\//, '')
    .replace(/^audio\/tracks\//, '')
    .replace(/^audio\//, '')
    .replace(/^\//, '');

  // Strip file extension
  normalized = normalized.replace(/\.(mp3|wav|ogg|m4a|flac|aac|webm)$/i, '');

  // Replace spaces with hyphens
  normalized = normalized.replace(/\s+/g, '-');

  // Convert to lowercase
  normalized = normalized.toLowerCase();

  // Remove any trailing slashes or dots
  normalized = normalized.replace(/[/.]+$/, '');

  return normalized;
}

/**
 * Derive canonical trackKey from track data object
 *
 * Priority:
 * 1. Explicit trackId field (if already normalized)
 * 2. URL or src field (will be normalized)
 * 3. Title field as fallback (will be normalized)
 *
 * @param data Track data with optional trackId, url, src, or title
 * @returns Canonical trackKey
 *
 * @example
 * deriveTrackKey({ trackId: "te-perdi.mp3", url: "/audio/tracks/te-perdi.mp3" })
 * → "te-perdi"
 *
 * deriveTrackKey({ url: "https://r2.../audio/amor-sincero.mp3" })
 * → "amor-sincero"
 */
export function deriveTrackKey(data: {
  trackId?: string;
  url?: string;
  src?: string;
  title?: string;
}): string {
  // Priority 1: Explicit trackId
  if (data.trackId) {
    return normalizeTrackId(data.trackId);
  }

  // Priority 2: URL or src
  if (data.url) {
    return normalizeTrackId(data.url);
  }

  if (data.src) {
    return normalizeTrackId(data.src);
  }

  // Priority 3: Title as fallback
  if (data.title) {
    return normalizeTrackId(data.title);
  }

  return '';
}

/**
 * Generate legacy fallback keys for migration
 *
 * When migrating from URL-based keys to canonical trackKeys,
 * this generates possible old key formats to check during lookup.
 *
 * @param trackKey Canonical trackKey
 * @param url Optional original URL
 * @returns Array of legacy key candidates
 *
 * @example
 * getLegacyKeys("te-perdi", "/audio/tracks/te-perdi.mp3")
 * → ["te-perdi.mp3", "/audio/tracks/te-perdi.mp3", "audio/tracks/te-perdi.mp3"]
 */
export function getLegacyKeys(trackKey: string, url?: string): string[] {
  const legacyKeys: string[] = [];

  // Add filename variants
  legacyKeys.push(`${trackKey}.mp3`);

  // Add URL-based variants if available
  if (url) {
    legacyKeys.push(url);

    // Strip leading slash variant
    if (url.startsWith('/')) {
      legacyKeys.push(url.slice(1));
    }
  }

  return legacyKeys;
}
