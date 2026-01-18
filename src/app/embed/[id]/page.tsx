"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { EmbedPlayer } from "@/components/audio/EmbedPlayer";

export default function EmbedPage({ params }: { params: { id: string } }) {
  const search = useSearchParams();
  const title = search?.get("title") ?? `Piko Mix ${params.id}`;
  const url = search?.get("url") ?? "";
  const cover = search?.get("cover") ?? "/images/tracks/dj-2581269_1280.jpg";

  const meta = useMemo(
    () => ({
      title,
      url,
      cover,
    }),
    [title, url, cover],
  );

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <EmbedPlayer
        title={meta.title}
        audioUrl={meta.url}
        coverArt={meta.cover}
      />
    </div>
  );
}
