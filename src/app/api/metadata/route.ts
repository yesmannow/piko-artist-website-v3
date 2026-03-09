/**
 * AcoustID Metadata Intelligence — Server Route
 *
 * POST /api/metadata
 * Body: { duration: number, fingerprint: string }
 *
 * Securely queries the AcoustID API using process.env.ACOUSTID_API_KEY.
 * Returns matched recording metadata for track verification.
 */

import { NextRequest, NextResponse } from 'next/server';

const ACOUSTID_API_URL = 'https://api.acoustid.org/v2/lookup';

interface AcoustIDApiResponse {
  status: string;
  results?: Array<{
    id: string;
    score: number;
    recordings?: Array<{
      id: string;
      title: string;
      artists?: Array<{ id: string; name: string }>;
    }>;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ACOUSTID_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ACOUSTID_API_KEY not configured' },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { duration, fingerprint } = body;

    if (!duration || !fingerprint) {
      return NextResponse.json(
        { error: 'Missing required fields: duration, fingerprint' },
        { status: 400 },
      );
    }

    // Query AcoustID API
    const params = new URLSearchParams({
      client: apiKey,
      meta: 'recordings',
      duration: String(Math.round(duration)),
      fingerprint: fingerprint,
    });

    const acoustRes = await fetch(`${ACOUSTID_API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!acoustRes.ok) {
      console.error('[AcoustID API] Response:', acoustRes.status, acoustRes.statusText);
      return NextResponse.json(
        { error: 'AcoustID API request failed', status: acoustRes.status },
        { status: 502 },
      );
    }

    const data: AcoustIDApiResponse = await acoustRes.json();

    if (data.status !== 'ok' || !data.results?.length) {
      return NextResponse.json({ result: null });
    }

    // Return the highest-confidence result
    const best = data.results.reduce((a, b) => (a.score > b.score ? a : b));

    return NextResponse.json({
      result: {
        id: best.id,
        score: best.score,
        recordings: best.recordings?.map(r => ({
          id: r.id,
          title: r.title,
          artists: r.artists?.map(a => ({ name: a.name })),
        })),
      },
    });
  } catch (err) {
    console.error('[AcoustID API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
