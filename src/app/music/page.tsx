import type { Metadata } from "next";
import { fetchVaultTracks } from "@/lib/vaultSync";
import { MusicPlayer } from "@/components/MusicPlayer";

/**
 * Dynamic metadata – reflects the latest vault tracks in social-share previews.
 * Because this file is a Server Component the metadata can be generated at
 * request time (ISR revalidation = 60 s, same as the vault fetch).
 */
export async function generateMetadata(): Promise<Metadata> {
  const tracks = await fetchVaultTracks();
  const latestTitle = tracks[0]?.title ?? "Latest Tracks";

  return {
    title: `${latestTitle} | Piko Music`,
    description: `Stream the latest tracks from Piko. Now playing: ${latestTitle}`,
    openGraph: {
      title: `${latestTitle} | Piko Music`,
      description: `Stream the latest tracks from Piko. Now playing: ${latestTitle}`,
      images: tracks[0]?.coverArt?.startsWith("http")
        ? [{ url: tracks[0].coverArt, alt: tracks[0].title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${latestTitle} | Piko Music`,
      description: `Stream the latest tracks from Piko. Now playing: ${latestTitle}`,
    },
  };
}

/**
 * Music Page — Server Component wrapper.
 *
 * Fetches the dynamic track manifest from the piko-media R2 bucket (with
 * 60-second ISR revalidation) then hands the list to the interactive
 * MusicPlayer client component.
 */
export default async function MusicPage() {
  const tracks = await fetchVaultTracks();
  return <MusicPlayer tracks={tracks} />;
}
