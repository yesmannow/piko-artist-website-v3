"use client";

/**
 * LibraryRow - Bottom Track Library & Browser
 *
 * Provides access to:
 * - Track Library with search/filter
 * - Playlists and crates
 * - Track preview and metadata
 *
 * Collapses when not in use to maximize performance controls
 */

import { TrackLibrary } from "@/components/studio/ui/TrackLibrary";
import { useStudioStore } from "@/store/useStudioStore";

export function LibraryRow() {
  const libraryOpen = useStudioStore((state) => state.libraryOpen);
  const setLibraryOpen = useStudioStore((state) => state.setLibraryOpen);

  const handleOpenLibrary = () => setLibraryOpen(true);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenLibrary();
    }
  };

  if (!libraryOpen) {
    return (
      <button
        type="button"
        className="w-full flex items-center justify-center border-t border-white/5 bg-(--bg-secondary) cursor-pointer hover:bg-(--bg-tertiary) transition-colors"
        onClick={handleOpenLibrary}
        onKeyDown={handleKeyDown}
        aria-label="Open track library"
      >
        <div className="text-xs font-mono uppercase tracking-[0.3em] text-(--text-secondary)">
          Click to open library
        </div>
      </button>
    );
  }

  return (
    <section
      className="flex flex-col border-t border-white/5 bg-(--bg-secondary) overflow-hidden h-full"
      aria-label="Track Library"
    >
      {/* Library Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-(--text-secondary)">
          Track Library
        </h2>
        <button
          onClick={() => setLibraryOpen(false)}
          className="text-xs font-mono uppercase tracking-wider text-(--text-secondary) hover:text-(--text-primary) transition-colors px-2 py-1 rounded border border-white/5 hover:border-white/10"
        >
          Close
        </button>
      </div>

      {/* Library Content */}
      <div className="flex-1 overflow-auto">
        <TrackLibrary isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} />
      </div>
    </section>
  );
}
