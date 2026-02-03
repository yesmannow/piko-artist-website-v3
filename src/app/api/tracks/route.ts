/**
 * GET /api/tracks
 *
 * Canonical track endpoint for Studio.
 * Returns local static MP3 files from /public/audio/tracks/*.mp3
 * with deterministic artwork assignments.
 *
 * Usage:
 * - GET /api/tracks → returns { tracks: StudioTrack[], count: number }
 * - GET /api/tracks?trackId=te-perdi → returns { track: StudioTrack }
 */

import { NextResponse } from "next/server";
import { STUDIO_TRACKS, STUDIO_TRACK_MAP } from "@/lib/studioTrackManifest";

export const runtime = "nodejs"; // safe default

function normalizeTrackId(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\.(mp3)$/i, "")
    .replace(/^\/audio\/tracks\//i, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackIdRaw = searchParams.get("trackId");

  // Resolve single track by id
  if (trackIdRaw) {
    const id = normalizeTrackId(trackIdRaw);
    const track = STUDIO_TRACK_MAP.get(id);
    if (!track) {
      return NextResponse.json({ error: "Invalid trackId" }, { status: 404 });
    }
    return NextResponse.json({ track }, { headers: { "Cache-Control": "no-store" }});
  }

  // Return full list
  return NextResponse.json(
    { tracks: STUDIO_TRACKS, count: STUDIO_TRACKS.length },
    { headers: { "Cache-Control": "no-store" } }
  );
}
