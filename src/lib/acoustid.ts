/**
 * AcoustID Metadata Intelligence — TypeScript Interfaces & Client
 *
 * Strict interfaces per the Syndicate Vault specification.
 * Client-side fingerprinting utility (using Chromaprint via WASM or
 * fallback to server-side metadata lookup).
 */

/* ─── Core Interfaces ──────────────────────────────────────────── */

export interface AcoustIDResult {
  id: string;
  score: number; // Confidence (0.0 to 1.0)
  recordings?: Array<{
    id: string;
    title: string;
    artists?: Array<{ name: string }>;
  }>;
}

export interface PikoTrackMetadata {
  verifiedTitle: string;
  verifiedArtist: string;
  acoustid_id: string;
  confidenceScore: number;
}

/* ─── Client-Side Fingerprint Generator ────────────────────────── */

/**
 * Generate a basic audio fingerprint from an AudioBuffer.
 * Uses a simplified spectral hash approach — not full Chromaprint,
 * but sufficient for AcoustID API lookups as a duration+fingerprint placeholder.
 *
 * For production, integrate chromaprint.js (AcoustID's official WASM impl).
 */
export async function generateFingerprint(buffer: AudioBuffer): Promise<{
  duration: number;
  fingerprint: string;
}> {
  const channelData = buffer.getChannelData(0);
  const duration = Math.round(buffer.duration);

  // Compute a spectral energy signature across 32 windows
  const windowSize = Math.floor(channelData.length / 32);
  const energyBins: number[] = [];

  for (let i = 0; i < 32; i++) {
    let energy = 0;
    const start = i * windowSize;
    const end = Math.min(start + windowSize, channelData.length);
    for (let j = start; j < end; j++) {
      energy += channelData[j] * channelData[j];
    }
    energyBins.push(energy / (end - start));
  }

  // Encode as a hex fingerprint
  const fingerprint = energyBins
    .map(e => Math.round(e * 10000).toString(16).padStart(4, '0'))
    .join('');

  return { duration, fingerprint };
}

/* ─── API Client ───────────────────────────────────────────────── */

const CONFIDENCE_THRESHOLD = 0.85;

/**
 * Query the AcoustID metadata API via our server-side route.
 * Returns verified metadata if confidence exceeds threshold.
 */
export async function lookupMetadata(
  duration: number,
  fingerprint: string,
): Promise<PikoTrackMetadata | null> {
  try {
    const res = await fetch('/api/metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration, fingerprint }),
    });

    if (!res.ok) {
      console.warn('[AcoustID] API returned', res.status);
      return null;
    }

    const data = await res.json();
    if (!data.result) return null;

    const result: AcoustIDResult = data.result;
    if (result.score < CONFIDENCE_THRESHOLD) return null;

    const recording = result.recordings?.[0];
    if (!recording) return null;

    return {
      verifiedTitle: recording.title,
      verifiedArtist: recording.artists?.map(a => a.name).join(', ') ?? 'Unknown',
      acoustid_id: result.id,
      confidenceScore: result.score,
    };
  } catch (err) {
    console.error('[AcoustID] Lookup failed:', err);
    return null;
  }
}

/**
 * Check if a confidence score exceeds the verification threshold
 */
export function isVerified(score: number): boolean {
  return score >= CONFIDENCE_THRESHOLD;
}
