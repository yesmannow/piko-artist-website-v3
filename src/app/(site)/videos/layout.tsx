import type { Metadata } from "next";
import videosData from "@/lib/data/videos.json";

export async function generateMetadata(): Promise<Metadata> {
  const videos = (videosData || []) as Array<{ id: string; title: string; thumbnail: string }>;
  const latestVideo = videos[0];

  const title = "Piko FG // The Vault";
  const description = latestVideo
    ? `Latest video: ${latestVideo.title}. Watch Piko FG's official video archive.`
    : "Piko FG // The Vault - Official video archive";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    ...(latestVideo && {
      other: {
        "video:url": `https://www.youtube.com/watch?v=${latestVideo.id}`,
        "video:title": latestVideo.title,
      },
    }),
  };
}

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
