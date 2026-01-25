/**
 * API Route: /api/get-track
 * 
 * Generates presigned URLs for secure streaming from Cloudflare R2
 * Expiration: 1 hour (3600 seconds)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUrl } from '@/lib/r2/client';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    let key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Missing "key" parameter' },
        { status: 400 }
      );
    }

    // R2 bucket stores tracks under 'audio/' prefix
    // If key doesn't start with 'audio/', add it
    if (!key.startsWith('audio/')) {
      key = `audio/${key}`;
    }

    // Generate presigned URL (expires in 1 hour)
    const url = await getPresignedUrl(key, 3600);

    if (!url) {
      return NextResponse.json(
        { error: 'Failed to generate presigned URL. R2 client may not be configured.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error('[API] Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
