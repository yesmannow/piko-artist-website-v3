/**
 * API Route: /api/studio/track
 *
 * DEPRECATED — Permanently redirects (308) to /api/tracks
 *
 * This legacy endpoint now redirects to the canonical track endpoint.
 * All query parameters are preserved.
 *
 * Example:
 * - GET /api/studio/track?trackId=te-perdi
 * - → 308 Permanent Redirect
 * - → /api/tracks?trackId=te-perdi
 */

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dest = new URL("/api/tracks", url.origin);

  // Preserve all query params (trackId and any others)
  for (const [key, value] of url.searchParams.entries()) {
    dest.searchParams.set(key, value);
  }

  return NextResponse.redirect(dest, 308);
}
