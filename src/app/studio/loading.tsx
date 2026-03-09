"use client";

export default function StudioLoading() {
  return (
    <div className="studio-loading">
      <div className="studio-loading-content">
        <div className="studio-loading-spinner" />
        <h2>Loading Studio...</h2>
        <p>Initializing audio engine and track library</p>
      </div>

      <style jsx>{`
        .studio-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-primary, #0a0a0a);
          color: var(--color-text-primary, #ffffff);
        }

        .studio-loading-content {
          text-align: center;
          max-width: 400px;
          padding: 2rem;
        }

        .studio-loading-spinner {
          width: 48px;
          height: 48px;
          margin: 0 auto 1.5rem;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: var(--color-accent, #00ff88);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
        }

        p {
          color: var(--color-text-secondary, rgba(255, 255, 255, 0.6));
          margin: 0;
        }
      `}</style>
    </div>
  );
}
