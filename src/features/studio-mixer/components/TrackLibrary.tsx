"use client";

import { useState, useMemo, memo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useMixerStore, MixerTrackItem } from "../stores/useMixerStore";
import { TrackLibrarySkeleton } from "@/components/LoadingSkeleton";

function isImagePath(coverArt?: string) {
  return !!coverArt && coverArt.startsWith("/");
}

const TrackRow = memo(function TrackRow({
  track,
  onLoadA,
  onLoadB,
}: {
  track: MixerTrackItem;
  onLoadA: () => void;
  onLoadB: () => void;
}) {
  return (
    <div
      className="group relative flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg border transition-all cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-[#00ff00] focus-within:ring-offset-2 focus-within:ring-offset-[#0a0a0a] border-gray-800 hover:border-gray-600 hover:shadow-[0_0_12px_rgba(0,255,0,0.15)]"
      tabIndex={0}
    >
      <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded bg-[#0a0a0a]">
        {isImagePath(track.coverArt) ? (
          <Image
            alt={track.title}
            src={track.coverArt!}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-700" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-barlow uppercase text-gray-300 truncate" title={track.title}>
          {track.title}
        </div>
        <div className="text-xs font-barlow text-gray-500 truncate" title={track.artist}>
          {track.artist}
        </div>
      </div>

      <div className="flex gap-2 z-10 flex-shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLoadA();
          }}
          className="px-3 py-1.5 text-xs font-barlow uppercase bg-[#2a2a2a] hover:bg-[#00d9ff] text-gray-400 hover:text-white rounded transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00d9ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] min-h-[44px] active:scale-95"
          aria-label={`Load ${track.title} to Deck A`}
        >
          A
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLoadB();
          }}
          className="px-3 py-1.5 text-xs font-barlow uppercase bg-[#2a2a2a] hover:bg-[#ff00d9] text-gray-400 hover:text-white rounded transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff00d9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] min-h-[44px] active:scale-95"
          aria-label={`Load ${track.title} to Deck B`}
        >
          B
        </button>
      </div>
    </div>
  );
});

export function TrackLibrary() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const allTracks = useMixerStore((s) => s.libraryTracks);
  const search = useMixerStore((s) => s.search);
  const vibeFilter = useMixerStore((s) => s.vibeFilter);
  const setSearch = useMixerStore((s) => s.setSearch);
  const setVibeFilter = useMixerStore((s) => s.setVibeFilter);
  const setDeckTrack = useMixerStore((s) => s.setDeckTrack);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allTracks.filter((t) => {
      const matchesQ =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.vibe ?? "").toLowerCase().includes(q);
      const matchesVibe = vibeFilter === "all" ? true : (t.vibe ?? "") === vibeFilter;
      return matchesQ && matchesVibe;
    });
  }, [allTracks, search, vibeFilter]);

  return (
    <aside
      className={`hidden lg:block flex-shrink-0 border-r border-gray-800 bg-[#0a0a0a] overflow-hidden h-full sticky top-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-16" : "w-80 xl:w-96"
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-800 flex-shrink-0">
          {!isCollapsed && (
            <h2 className="text-xl font-barlow uppercase tracking-wider text-gray-300">
              TRACK LIBRARY
            </h2>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-all touch-manipulation ml-auto"
            aria-label={isCollapsed ? "Expand Track Library" : "Collapse Track Library"}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tracks..."
                  aria-label="Search tracks"
                  className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-800 rounded text-white placeholder-gray-500 font-barlow text-sm focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-[#00ff00] transition-colors"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <select
                  className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded text-white font-barlow text-xs focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-[#00ff00] transition-colors"
                  aria-label="Filter by vibe"
                  value={vibeFilter}
                  onChange={(e) => setVibeFilter(e.target.value)}
                >
                  <option value="all">All Vibes</option>
                  <option value="chill">Chill</option>
                  <option value="hype">Hype</option>
                  <option value="storytelling">Storytelling</option>
                  <option value="classic">Classic</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {allTracks.length === 0 ? (
                <TrackLibrarySkeleton count={5} />
              ) : visible.length > 0 ? (
                visible.map((t) => (
                  <TrackRow
                    key={t.id}
                    track={t}
                    onLoadA={() => setDeckTrack("A", t)}
                    onLoadB={() => setDeckTrack("B", t)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-white/40">
                  <p className="text-sm font-barlow uppercase">No tracks found</p>
                </div>
              )}
            </div>

            <div className="mt-4 text-xs font-barlow text-gray-500 text-center pt-4 border-t border-gray-800">
              {visible.length} track{visible.length === 1 ? "" : "s"}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export function TrackLibraryMobile() {
  const allTracks = useMixerStore((s) => s.libraryTracks);
  const search = useMixerStore((s) => s.search);
  const vibeFilter = useMixerStore((s) => s.vibeFilter);
  const setSearch = useMixerStore((s) => s.setSearch);
  const setVibeFilter = useMixerStore((s) => s.setVibeFilter);
  const setDeckTrack = useMixerStore((s) => s.setDeckTrack);

  const visible = useMemo(() => {
    if (!allTracks || allTracks.length === 0) {
      return [];
    }
    const q = search.trim().toLowerCase();
    return allTracks.filter((t) => {
      const matchesQ =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.vibe ?? "").toLowerCase().includes(q);
      const matchesVibe = vibeFilter === "all" ? true : (t.vibe ?? "") === vibeFilter;
      return matchesQ && matchesVibe;
    });
  }, [allTracks, search, vibeFilter]);

  return (
    <div className="lg:hidden">
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search tracks..."
            aria-label="Search tracks"
            className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-gray-800 rounded text-white placeholder-gray-500 font-barlow text-sm focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-[#00ff00] transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded text-white font-barlow text-xs focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-[#00ff00] transition-colors"
          aria-label="Filter by vibe"
          value={vibeFilter}
          onChange={(e) => setVibeFilter(e.target.value)}
        >
          <option value="all">All Vibes</option>
          <option value="chill">Chill</option>
          <option value="hype">Hype</option>
          <option value="storytelling">Storytelling</option>
          <option value="classic">Classic</option>
        </select>
      </div>

      <div className="mt-4 space-y-2">
        {visible.length > 0 ? (
          visible.map((t) => (
            <TrackRow
              key={t.id}
              track={t}
              onLoadA={() => setDeckTrack("A", t)}
              onLoadB={() => setDeckTrack("B", t)}
            />
          ))
        ) : (
          <div className="text-center py-12 text-white/60">
            <div className="text-sm font-barlow uppercase tracking-wider mb-2">
              {allTracks.length === 0
                ? "No tracks available"
                : search.trim() || vibeFilter !== "all"
                  ? "No tracks match your filters"
                  : "Loading tracks..."}
            </div>
            {allTracks.length === 0 && (
              <div className="text-xs font-mono text-white/40 mt-2">
                Check that audio tracks are configured in the data file.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs font-barlow text-gray-500 text-center pt-4 border-t border-gray-800">
        {visible.length} of {allTracks.length} track{allTracks.length === 1 ? "" : "s"}
        {search.trim() && ` matching "${search}"`}
        {vibeFilter !== "all" && ` (${vibeFilter} vibe)`}
      </div>
    </div>
  );
}

