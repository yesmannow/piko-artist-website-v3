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
        className="w-full h-full flex items-center justify-center border-t border-white/5 bg-black/20 hover:bg-black/30 transition-colors cursor-pointer"
        onClick={handleOpenLibrary}
        onKeyDown={handleKeyDown}
        aria-label="Open track library"
        aria-expanded={false}
      >
        <div className="text-xs font-mono uppercase tracking-[0.3em] text-white/50 hover:text-white/70 transition-colors">
          Click to open library
        </div>
      </button>
    );
  }

  return (
    <section
      className="flex flex-col min-h-0 border-t border-white/5 bg-black/20 overflow-hidden h-full"
      aria-label="Track Library"
    >
      {/* Library Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-white/50">
          Track Library
        </h2>
        <button
          onClick={() => setLibraryOpen(false)}
          className="text-xs font-mono uppercase tracking-wider text-white/50 hover:text-white/90 transition-colors px-2 py-1 rounded border border-white/5 hover:border-white/10"
          aria-label="Close library"
        >
          Close
        </button>
      </div>

      {/* Library Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        <TrackLibrary isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} />
      </div>
    </section>
  );
}
