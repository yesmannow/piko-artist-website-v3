import Parser from 'rss-parser';

export interface YouTubeVideo {
  id: string;
  title: string;
  link: string;
  publishedAt: string;
}

const parser = new Parser();

/**
 * Fetches and parses YouTube RSS feed for Piko FG channel
 * Channel ID: UCjHQIImynicoSZuFmt6Rdig
 * RSS Feed: https://www.youtube.com/feeds/videos.xml?channel_id=UCjHQIImynicoSZuFmt6Rdig
 * 
 * Uses Next.js fetch with cache tags for manual revalidation support.
 */
export async function fetchYouTubeVideos(): Promise<YouTubeVideo[]> {
  try {
    const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCjHQIImynicoSZuFmt6Rdig';
    
    // Use Next.js fetch with cache tags for future manual revalidation
    const response = await fetch(feedUrl, {
      next: {
        revalidate: 3600, // Align with page revalidate
        tags: ['youtube-videos'], // Enable manual revalidation via revalidateTag
      },
    });

    if (!response.ok) {
      console.warn(`YouTube RSS feed returned ${response.status}: ${response.statusText}`);
      return [];
    }

    const xmlText = await response.text();
    const feed = await parser.parseString(xmlText);

    if (!feed.items || feed.items.length === 0) {
      return [];
    }

    const videos: YouTubeVideo[] = feed.items
      .map((item) => {
        // Extract video ID from link
        // Format: https://www.youtube.com/watch?v=VIDEO_ID
        const videoIdMatch = item.link?.match(/[?&]v=([^&]+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;

        if (!videoId || !item.title) {
          return null;
        }

        return {
          id: videoId,
          title: item.title,
          link: item.link || '',
          publishedAt: item.pubDate || item.isoDate || '',
        };
      })
      .filter((video): video is YouTubeVideo => video !== null);

    return videos;
  } catch (error) {
    // Graceful error handling: log but don't crash
    if (error instanceof Error) {
      console.error('Error fetching YouTube RSS feed:', error.message);
    } else {
      console.error('Unknown error fetching YouTube RSS feed:', error);
    }
    return [];
  }
}
