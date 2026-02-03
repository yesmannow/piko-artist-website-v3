import { TRACK_IMAGE_POOL } from "./studioTrackImages";
import { hashStringToInt } from "./hash";

export function getTrackArtworkUrl(trackId: string): string {
  const idx = Math.abs(hashStringToInt(trackId)) % TRACK_IMAGE_POOL.length;
  return TRACK_IMAGE_POOL[idx];
}
