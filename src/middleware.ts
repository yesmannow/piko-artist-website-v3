import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware - Route redirects and request handling
 *
 * V3 Urban Syndicate:
 * - Redirects /beatmaker to /studio for unified console
 * - Device-aware routing: mobile UA -> /studio-v2, desktop UA -> /studio
 * - Enables SharedArrayBuffer via Cross-Origin-Isolation headers on studio routes
 *
 * CRITICAL: COOP/COEP Headers
 * - Sets Cross-Origin-Opener-Policy: same-origin
 * - Sets Cross-Origin-Embedder-Policy: require-corp
 * - Required for crossOriginIsolated=true and SharedArrayBuffer support
 * - Only applied to /studio* routes to avoid breaking other pages
 * - Service worker must NOT cache /studio* or /worklets/* routes (see sw.ts)
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

  // Device-aware routing for /studio routes
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
  matcher: ["/beatmaker/:path*", "/studio/:path*", "/studio-v2/:path*"],
};

