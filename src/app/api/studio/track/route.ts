import { NextResponse } from "next/server";
import pikoTracks from "@/data/piko-tracks.json";

type PikoTrack = {
  trackId: string;
  src?: string;
};

const normalizeFileName = (value: string) => {
  const trimmed = value.replace(/\\/g, '/').split('/').pop() || '';
  const noPrefix = trimmed.replace(/^audio\/tracks\//i, '').replace(/^\/+/, '');
  return noPrefix.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
};

const trackMap = new Map<string, string>(
  (pikoTracks as PikoTrack[]).map((track) => {
    const file = normalizeFileName(track.src || track.trackId);
    return [file, `/audio/tracks/${file}`];
  })
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get("trackId");

    if (!trackId) {
      return NextResponse.json(
        { error: "Track ID is required" },
        { status: 400 }
      );
    }

    const normalized = normalizeFileName(trackId);
    const url = trackMap.get(normalized);

    // Validate trackId against the manifest to prevent unauthorized file access
    if (!url) {
      return NextResponse.json(
        { error: "Invalid track ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Track resolution error:", error);
    return NextResponse.json(
      { error: "Failed to resolve track URL" },
      { status: 500 }
    );
  }
}
