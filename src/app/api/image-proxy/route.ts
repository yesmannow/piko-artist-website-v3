import { NextResponse } from 'next/server';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url query param' }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (!ALLOWED_PROTOCOLS.has(targetUrl.protocol)) {
    return NextResponse.json({ error: 'Only http/https are allowed' }, { status: 400 });
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: { 'User-Agent': 'piko-image-proxy' },
    });

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';

    if (!upstream.ok) {
      return NextResponse.json(
        { error: 'Upstream request failed', status: upstream.status },
        { status: upstream.status }
      );
    }

    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[image-proxy] fetch failed', error);
    return NextResponse.json({ error: 'Proxy request failed' }, { status: 502 });
  }
}
