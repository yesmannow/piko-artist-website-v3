import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) return new NextResponse('Missing URL', { status: 400 });
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new NextResponse(blob, {
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'image/jpeg' },
    });
  } catch {
    return new NextResponse('Failed', { status: 500 });
  }
}
