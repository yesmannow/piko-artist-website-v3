"use client";

import { memo } from "react";

export const TrackSkeleton = memo(function TrackSkeleton() {
  return (
    <div className="group relative flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg border border-gray-800 animate-pulse">
      <div className="w-16 h-16 flex-shrink-0 rounded bg-gray-700" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-800 rounded w-1/2" />
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <div className="w-10 h-10 bg-gray-700 rounded" />
        <div className="w-10 h-10 bg-gray-700 rounded" />
      </div>
    </div>
  );
});

export function TrackLibrarySkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <TrackSkeleton key={i} />
      ))}
    </div>
  );
}
