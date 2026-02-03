import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware - Route redirects and request handling
 *
 * V3 Urban Syndicate: Redirects /beatmaker to /studio for unified console
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /beatmaker to /studio
  if (pathname.startsWith("/beatmaker")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace("/beatmaker", "/studio");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Only run middleware for /beatmaker routes, not for static assets or API routes
  matcher: ["/beatmaker/:path*"],
};

