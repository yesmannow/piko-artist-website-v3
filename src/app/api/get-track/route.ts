/**
 * API Route: /api/get-track
 * 
 * Resolves local audio URLs for the Studio track library.
 */

import { NextRequest, NextResponse } from 'next/server';
import libraryTracks from '@/data/musician_tracks.json';

type LibraryTrack = {
  trackId: string;
  src?: string;
  stems?: { full?: string };
};

const normalizeFileName = (value: string) => {
  const trimmed = value.replace(/\\/g, '/').split('/').pop() || '';
  const noPrefix = trimmed.replace(/^audio\/tracks\//i, '').replace(/^\/+/, '');
  const safe = noPrefix.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
  return safe;
};

const allowedMap = new Map<string, string>(
  (libraryTracks as LibraryTrack[]).map((track) => {
    const candidate = track.src || track.stems?.full || track.trackId;
    const file = normalizeFileName(candidate);
    const url = `/audio/tracks/${file}`;
    return [file, url];
  })
);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Missing "key" parameter' },
        { status: 400 }
      );
    }

    const file = normalizeFileName(key);
    if (!file) {
      return NextResponse.json(
        { error: 'Invalid "key" parameter' },
        { status: 400 }
      );
    }

    const url = allowedMap.get(file) ?? `/audio/tracks/${file}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error('[API] Error resolving local track URL:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
