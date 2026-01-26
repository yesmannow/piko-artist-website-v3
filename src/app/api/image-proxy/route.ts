import { NextResponse } from 'next/server';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const decodeTargetUrl = (value: string) => {
  let decoded = value;
  for (let i = 0; i < 2; i += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
};

const getYouTubeFallback = (target: URL) => {
  const host = target.hostname;
  if (host !== 'img.youtube.com' && host !== 'i.ytimg.com') return null;
  if (!target.pathname.endsWith('/maxresdefault.jpg')) return null;
  const fallback = new URL(target.toString());
  fallback.pathname = fallback.pathname.replace('/maxresdefault.jpg', '/hqdefault.jpg');
  return fallback;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url query param' }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    const decoded = decodeTargetUrl(url);
    targetUrl = new URL(decoded);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (!ALLOWED_PROTOCOLS.has(targetUrl.protocol)) {
    return NextResponse.json({ error: 'Only http/https are allowed' }, { status: 400 });
  }

  try {
    let upstream = await fetch(targetUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: { 'User-Agent': 'piko-image-proxy' },
    });

    if (!upstream.ok) {
      const fallback = getYouTubeFallback(targetUrl);
      if (fallback) {
        upstream = await fetch(fallback.toString(), {
          method: 'GET',
          cache: 'no-store',
          headers: { 'User-Agent': 'piko-image-proxy' },
        });
      }
    }

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
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch (error) {
    console.error('[image-proxy] fetch failed', error);
    return NextResponse.json({ error: 'Proxy request failed' }, { status: 502 });
  }
}
