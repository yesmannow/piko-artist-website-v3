"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error with strong prefix for production diagnostics
    console.error("[APP_ERROR_BOUNDARY]", {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-4xl font-header text-foreground">Something went wrong</h1>
        <p className="text-foreground/60 font-industrial">
          An unexpected error occurred. Please try reloading the page.
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
          If the problem persists, check the browser console for details.
        </p>
      </div>
    </div>
  );
}

