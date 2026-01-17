import { NextRequest, NextResponse } from "next/server";

/**
 * Model Proxy API Route - Option C: Same-origin proxy for ONNX model
 *
 * This route proxies the external ONNX model through the same origin,
 * eliminating cross-origin restrictions under COEP (Cross-Origin-Embedder-Policy).
 *
 * Usage:
 * - Set NEXT_PUBLIC_MODEL_URL to external URL (e.g., R2/S3/CDN)
 * - Worker requests /api/model (same-origin)
 * - This route fetches and streams the model server-side
 *
 * Benefits:
 * - Works under COEP/COOP isolation (required for SharedArrayBuffer)
 * - No CORS issues
 * - Can add caching, authentication, or rate limiting
 * - Optional hostname allowlist for security
 */

export const runtime = "nodejs"; // Use Node.js runtime for streaming

/**
 * Check if URL hostname is in allowlist
 */
function isHostnameAllowed(url: string, allowlist?: string): boolean {
  if (!allowlist) return true; // No allowlist = allow all

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const allowedHosts = allowlist.split(",").map((h) => h.trim());

    return allowedHosts.some(
      (allowed) => hostname === allowed || hostname.endsWith("." + allowed),
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  // Get model URL from env or query parameter
  let modelUrl = process.env.NEXT_PUBLIC_MODEL_URL || process.env.MODEL_URL;

  // Support query parameter for flexibility: /api/model?url=ENCODED_URL
  const { searchParams } = new URL(request.url);
  const queryUrl = searchParams.get("url");
  if (queryUrl) {
    try {
      modelUrl = decodeURIComponent(queryUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL parameter" },
        { status: 400 },
      );
    }
  }

  // Validate URL is set
  if (!modelUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_MODEL_URL not set" },
      { status: 400 },
    );
  }

  // Validate URL is http(s)
  if (!modelUrl.startsWith("http://") && !modelUrl.startsWith("https://")) {
    return NextResponse.json(
      { error: "Model URL must be http:// or https://" },
      { status: 400 },
    );
  }

  // Check hostname allowlist if configured
  const allowlist = process.env.MODEL_HOST_ALLOWLIST;
  if (allowlist && !isHostnameAllowed(modelUrl, allowlist)) {
    return NextResponse.json(
      {
        error: "Model hostname not in allowlist",
        hostname: new URL(modelUrl).hostname,
        allowlist: allowlist.split(",").map((h) => h.trim()),
      },
      { status: 403 },
    );
  }

  try {
    // Fetch the model from external source
    const response = await fetch(modelUrl, {
      headers: {
        "User-Agent": "Piko-Artist-Website/1.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch model: ${response.status} ${response.statusText}`,
        },
        { status: response.status },
      );
    }

    // Get headers from upstream
    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    const contentLength = response.headers.get("content-length");

    // Stream the response (don't buffer whole file)
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Return streamed response with appropriate headers
    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        ...(contentLength && { "Content-Length": contentLength }),
        // Cache for 24 hours (models are immutable)
        "Cache-Control": "public, max-age=86400, immutable",
        // Required for COEP compatibility
        "Cross-Origin-Resource-Policy": "cross-origin",
      },
    });
  } catch (error) {
    console.error("[Model Proxy] Error fetching model:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch model",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
