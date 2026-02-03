"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("[Studio Error]", error);
  }, [error]);

  return (
    <div className="studio-error">
      <div className="studio-error-content">
        <div className="studio-error-icon">
          <AlertCircle size={48} strokeWidth={1.5} />
        </div>

        <h2>Studio Error</h2>

        <p className="studio-error-message">
          {error.message || "Something went wrong loading the studio"}
        </p>

        {error.digest && (
          <p className="studio-error-digest">
            Error ID: {error.digest}
          </p>
        )}

        <button
          onClick={reset}
          className="studio-error-button"
          type="button"
        >
          <RefreshCw size={16} />
          Try again
        </button>

        <Link href="/" className="studio-error-link">
          Return to homepage
        </Link>
      </div>

      <style jsx>{`
        .studio-error {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-primary, #0a0a0a);
          color: var(--color-text-primary, #ffffff);
          padding: 2rem;
        }

        .studio-error-content {
          text-align: center;
          max-width: 500px;
        }

        .studio-error-icon {
          color: var(--color-error, #ff4444);
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }

        h2 {
          font-size: 1.75rem;
          font-weight: 600;
          margin: 0 0 1rem;
        }

        .studio-error-message {
          color: var(--color-text-secondary, rgba(255, 255, 255, 0.7));
          margin: 0 0 0.5rem;
          line-height: 1.6;
        }

        .studio-error-digest {
          font-size: 0.875rem;
          color: var(--color-text-tertiary, rgba(255, 255, 255, 0.4));
          font-family: monospace;
          margin: 0 0 2rem;
        }

        .studio-error-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: var(--color-accent, #00ff88);
          color: #000;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
          margin-bottom: 1rem;
        }

        .studio-error-button:hover {
          transform: translateY(-1px);
          opacity: 0.9;
        }

        .studio-error-button:active {
          transform: translateY(0);
        }

        .studio-error-link {
          display: block;
          color: var(--color-text-secondary, rgba(255, 255, 255, 0.6));
          text-decoration: underline;
          font-size: 0.875rem;
          transition: color 0.2s;
        }

        .studio-error-link:hover {
          color: var(--color-text-primary, #ffffff);
        }
      `}</style>
    </div>
  );
}
