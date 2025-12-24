"use client";

import { useEffect } from "react";

/**
 * ProdRuntimeGuards - Production runtime error and chunk load diagnostics
 *
 * Monitors for:
 * - Window errors (uncaught exceptions)
 * - Unhandled promise rejections
 * - Chunk load failures (common in production)
 *
 * Logs with strong prefixes for easy filtering in production logs.
 */
export function ProdRuntimeGuards() {
  useEffect(() => {
    // Only run in production or when explicitly enabled
    if (typeof window === "undefined") return;

    // Window error handler
    const handleWindowError = (event: ErrorEvent) => {
      console.error("[WINDOW_ERROR]", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
      });
    };

    // Unhandled rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("[UNHANDLED_REJECTION]", {
        reason: event.reason,
        error: event.reason instanceof Error ? {
          message: event.reason.message,
          stack: event.reason.stack,
        } : event.reason,
        timestamp: new Date().toISOString(),
      });
    };

    // Chunk load failure detection
    const handleChunkLoadError = (event: ErrorEvent) => {
      // Check if error is related to chunk loading
      const isChunkError =
        event.message?.includes("Loading chunk") ||
        event.message?.includes("Failed to fetch dynamically imported module") ||
        event.filename?.includes("_next/static/chunks/") ||
        event.filename?.includes("_next/static/css/");

      if (isChunkError) {
        console.error("[CHUNK_LOAD_FAIL]", {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: new Date().toISOString(),
        });

        // Optionally reload on chunk load failure (common fix)
        // Uncomment if you want automatic reload on chunk failures
        // window.location.reload();
      }
    };

    // Attach event listeners
    window.addEventListener("error", handleWindowError);
    window.addEventListener("error", handleChunkLoadError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("error", handleChunkLoadError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}

