import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware - Route redirects and request handling
 *
 * Phase 1: DJ Mixer Enhancement - User-Agent Routing
 *
 * Device-aware routing:
 * - Mobile UA → /mobile (app-like mobile UI)
 * - Desktop UA → /studio (full studio UI)
 * - Legacy: /beatmaker → /studio redirect
 * - Legacy: mobile UA on /studio → /studio-v2 rewrite
 *
 * This enforces separate "app-like" mobile UI and full "studio" UI,
 * preventing mobile devices from downloading heavy desktop code.
 *
 * CRITICAL: COOP/COEP Headers
 * - Sets Cross-Origin-Opener-Policy: same-origin
 * - Sets Cross-Origin-Embedder-Policy: require-corp
 * - Required for crossOriginIsolated=true and SharedArrayBuffer support
 * - Applied to /studio*, /studio-v2*, and /mobile* routes
 * - Service worker must NOT cache these routes or /worklets/* (see sw.ts)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") || "";

  // Redirect /beatmaker to /studio (preserve existing behavior)
  if (pathname.startsWith("/beatmaker")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace("/beatmaker", "/studio");
    return NextResponse.redirect(url);
  }

  // Detect mobile user agents
  const isMobile = /iphone|ipad|ipod|android|mobi/i.test(userAgent);

  // Phase 1: Route mobile requests to /mobile for app-like UI
  // Desktop requests continue to /studio for full studio UI
  // Note: /studio still supports legacy mobile routing to /studio-v2 (see below)

  // Add Cross-Origin-Isolation headers for /mobile route
  if (pathname.startsWith("/mobile")) {
    const response = NextResponse.next();

    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");

    return response;
  }

  // Device-aware routing for /studio routes (legacy support)
  if (pathname.startsWith("/studio") && !pathname.startsWith("/studio-v2")) {
    if (isMobile) {
      // Rewrite mobile requests to /studio-v2 (preserves URL as /studio)
      const url = request.nextUrl.clone();
      url.pathname = pathname.replace("/studio", "/studio-v2");
      const response = NextResponse.rewrite(url);

      // Add Cross-Origin-Isolation headers for SharedArrayBuffer support
      response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
      response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");

      return response;
    } else {
      // Desktop: serve /studio with Cross-Origin-Isolation headers
      const response = NextResponse.next();

      response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
      response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");

      return response;
    }
  }

  // Add Cross-Origin-Isolation headers for direct /studio-v2 access
  if (pathname.startsWith("/studio-v2")) {
    const response = NextResponse.next();

    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/beatmaker/:path*",
    "/studio/:path*",
    "/studio-v2/:path*",
    "/mobile/:path*",
  ],
};
