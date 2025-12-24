"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error with strong prefix for production diagnostics
    console.error("[GLOBAL_ERROR_BOUNDARY]", {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <h1 className="text-4xl font-header text-foreground">Critical Error</h1>
            <p className="text-foreground/60 font-industrial">
              A critical error occurred. Please reload the page.
            </p>
            {error.digest && (
              <p className="text-xs text-foreground/40 font-mono">
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              className="px-6 py-3 bg-toxic-lime text-black font-bold rounded-full hover:bg-toxic-lime/80 transition-colors min-h-[44px]"
            >
              Reload Page
            </button>
            <p className="text-xs text-foreground/40">
              Check the browser console for error details.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

