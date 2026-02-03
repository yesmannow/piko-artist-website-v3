/**
 * API Route: /api/get-track
 *
 * DEPRECATED: Use /api/tracks?trackId=<id> instead.
 * This endpoint now returns 410 Gone.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  return NextResponse.json(
    {
      error: 'This endpoint is deprecated. Use /api/tracks?trackId=<id> instead.',
      migration: 'GET /api/tracks?trackId=te-perdi'
    },
    { status: 410 }
  );
}
