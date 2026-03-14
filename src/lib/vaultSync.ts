import { MediaItem, tracks as staticTracks } from "@/lib/data";

/**
 * Shape of a single track entry in the piko-media R2 library.json manifest.
 * All fields except `id`, `title`, and `src` are optional so the schema
 * stays forward-compatible as new metadata is added to the bucket.
 */
export interface VaultTrack {
  id: string;
  title: string;
  artist?: string;
  type?: "audio" | "video";
  src: string;
  coverArt?: string;
  vibe?: "chill" | "hype" | "storytelling" | "classic";
  uploadedAt?: string; // ISO-8601 date string – used for descending sort
}

/**
 * Raw shape returned by the R2 library.json manifest.
 */
interface VaultManifest {
  tracks: VaultTrack[];
}

/**
 * Base URL of the R2 public bucket.
 * Set `NEXT_PUBLIC_VAULT_URL` (or `VAULT_URL`) to the URL of the
 * `library.json` file, e.g. https://media.piko.art/library.json
 */
const VAULT_MANIFEST_URL =
  process.env.VAULT_URL ||
  process.env.NEXT_PUBLIC_VAULT_URL ||
  "";

/**
 * Normalise a raw VaultTrack into the MediaItem shape expected by the rest
 * of the application. Sensible defaults are applied for optional fields.
 */
function toMediaItem(vt: VaultTrack): MediaItem {
  return {
    id: vt.id,
    title: vt.title,
    artist: vt.artist ?? "Piko",
    type: vt.type ?? "audio",
    src: vt.src,
    coverArt: vt.coverArt ?? "from-zinc-700 to-zinc-900",
    vibe: vt.vibe ?? "chill",
  };
}

/**
 * Fetch the track manifest from the piko-media R2 public bucket.
 *
 * • Uses `{ next: { revalidate: 60 } }` so Next.js ISR refreshes the list
 *   every 60 seconds without requiring a redeploy.
 * • Falls back to the static `tracks` array (audio-only) when the URL is
 *   not configured or the remote fetch fails, so local development and
 *   build-time rendering always succeed.
 *
 * @returns An array of MediaItem records sorted newest-first (by uploadedAt).
 */
export async function fetchVaultTracks(): Promise<MediaItem[]> {
  if (!VAULT_MANIFEST_URL) {
    // No R2 URL configured – return the built-in audio tracks.
    return staticTracks.filter((t) => t.type === "audio");
  }

  try {
    const res = await fetch(VAULT_MANIFEST_URL, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Vault manifest responded with status ${res.status}`);
    }

    const manifest: VaultManifest = await res.json();

    const items = manifest.tracks
      .filter((vt) => (vt.type ?? "audio") === "audio")
      .map(toMediaItem);

    // Build an O(1) lookup map for uploadedAt before sorting.
    const uploadedAtMap = new Map<string, string>(
      manifest.tracks.map((vt) => [vt.id, vt.uploadedAt ?? ""])
    );

    // Sort descending by uploadedAt so the newest track appears first.
    items.sort((a, b) => {
      const va = uploadedAtMap.get(a.id) ?? "";
      const vb = uploadedAtMap.get(b.id) ?? "";
      if (!va && !vb) return 0;
      if (!va) return 1;
      if (!vb) return -1;
      return vb.localeCompare(va);
    });

    return items;
  } catch (err) {
    // Log in development; silently fall back to static tracks in production.
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("[vaultSync] Failed to fetch vault manifest, falling back to static tracks.", err);
    }
    return staticTracks.filter((t) => t.type === "audio");
  }
}
