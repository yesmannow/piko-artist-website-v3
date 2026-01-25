import { Suspense } from 'react';
import type { Metadata } from 'next';
import { YouTubeEmbed } from '@next/third-parties/google';
import { fetchYouTubeVideos } from '@/lib/utils/youtubeRss';
import Link from 'next/link';

// Enable stale-while-revalidate: serve cached content instantly, recheck every hour
export const revalidate = 3600;

// SEO Metadata
export async function generateMetadata(): Promise<Metadata> {
  const videos = await fetchYouTubeVideos();
  const latestVideo = videos[0];

  const title = 'Piko FG // The Vault';
  const description = latestVideo
    ? `Latest video: ${latestVideo.title}. Watch Piko FG's official video archive.`
    : 'Piko FG // The Vault - Official video archive';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    ...(latestVideo && {
      other: {
        'video:url': latestVideo.link,
        'video:title': latestVideo.title,
      },
    }),
  };
}

interface VideoGridProps {
  videos: Array<{ id: string; title: string; link: string; publishedAt: string }>;
}

// Latest Drop - Featured Video Section
function LatestDrop({ video }: { video: { id: string; title: string } }) {
  return (
    <section className="mb-12 md:mb-16">
      <div className="relative w-full aspect-video bg-[#0A0A0A] border border-[#2A2A2A] overflow-hidden shadow-lg">
        <div className="w-full h-full">
          <YouTubeEmbed
            videoid={video.id}
            height={400}
          />
        </div>
      </div>
      <h2 className="mt-4 text-white text-lg md:text-xl font-bold uppercase tracking-tight line-clamp-2">
        {video.title}
      </h2>
    </section>
  );
}

// Video Archives Grid - Responsive Layout
function VideoArchive({ videos }: VideoGridProps) {
  return (
    <section>
      <h2 className="text-white text-xl md:text-2xl font-bold uppercase tracking-tight mb-6 md:mb-8">
        Video Archives
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="group relative aspect-video bg-[#0A0A0A] border border-[#2A2A2A] overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:border-[#FFD400] shadow-lg"
          >
            <div className="w-full h-full">
              <YouTubeEmbed
                videoid={video.id}
                height={400}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
              <h3 className="text-white text-sm md:text-base font-bold uppercase tracking-tight line-clamp-2">
                {video.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Loading Skeleton - Brand-Aligned
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20 md:pt-24 pb-12 md:pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 md:mb-12 pb-6 border-b border-[#2A2A2A]">
          <div className="h-12 w-64 bg-[#2A2A2A] mb-4 md:mb-0" />
          <div className="h-11 w-40 bg-[#2A2A2A]" />
        </header>
        {/* Latest drop skeleton */}
        <div className="mb-12 md:mb-16">
          <div className="w-full aspect-video bg-[#2A2A2A] border border-[#2A2A2A] mb-4" />
          <div className="h-6 w-3/4 bg-[#2A2A2A]" />
        </div>
        {/* Archive grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="aspect-video bg-[#2A2A2A] border border-[#2A2A2A]" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Content Component
async function VideosContent() {
  const videos = await fetchYouTubeVideos();

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-20 md:pt-24 pb-12 md:pb-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 md:mb-12 pb-6 border-b border-[#2A2A2A]">
            <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tighter mb-4 md:mb-0">
              Piko FG // The Vault
            </h1>
            <Link
              href="https://www.youtube.com/@PikoFG?sub_confirmation=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#FFD400] text-black font-bold uppercase tracking-wider transition-colors hover:bg-[#FFD400]/90 focus:outline-none focus:ring-2 focus:ring-[#FFD400] focus:ring-offset-2 focus:ring-offset-[#0A0A0A] min-h-[44px]"
            >
              Subscribe Now
            </Link>
          </header>
          <div className="text-white/60 font-mono text-sm uppercase tracking-wider text-center py-12">
            No videos available.
          </div>
        </div>
      </div>
    );
  }

  // Latest video (featured) + next 14 videos for archive (total 15)
  const latestVideo = videos[0];
  const archiveVideos = videos.slice(1, 15); // Next 14 videos

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20 md:pt-24 pb-12 md:pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 md:mb-12 pb-6 border-b border-[#2A2A2A]">
          <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tighter mb-4 md:mb-0">
            Piko FG // The Vault
          </h1>
          <Link
            href="https://www.youtube.com/@PikoFG?sub_confirmation=1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#FFD400] text-black font-bold uppercase tracking-wider transition-colors hover:bg-[#FFD400]/90 focus:outline-none focus:ring-2 focus:ring-[#FFD400] focus:ring-offset-2 focus:ring-offset-[#0A0A0A] min-h-[44px]"
          >
            Subscribe Now
          </Link>
        </header>

        {/* Latest Drop - Featured Video */}
        <LatestDrop video={latestVideo} />

        {/* Video Archives - Grid of remaining videos */}
        {archiveVideos.length > 0 && <VideoArchive videos={archiveVideos} />}
      </div>
    </div>
  );
}

// Page Component with Suspense
export default function VideosPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VideosContent />
    </Suspense>
  );
}
