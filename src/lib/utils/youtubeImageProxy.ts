/**
 * YouTube Image Proxy Utility
 *
 * Proxies YouTube thumbnail URLs through /api/image-proxy to ensure
 * COOP/COEP compatibility. YouTube's CDN doesn't send Cross-Origin-Resource-Policy
 * headers, so direct image requests are blocked when COEP: require-corp is enabled.
 *
 * @param videoId - YouTube video ID
 * @param quality - Thumbnail quality: 'default', 'mqdefault', 'hqdefault', 'sddefault', 'maxresdefault'
 * @returns Proxied image URL
 */
export function getYouTubeThumbnailProxy(
  videoId: string,
  quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'
): string {
  const youtubeUrl = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
  const encodedUrl = encodeURIComponent(youtubeUrl);
  return `/api/image-proxy?url=${encodedUrl}`;
}

/**
 * Alternative: Use i.ytimg.com domain
 */
export function getYouTubeThumbnailProxyAlt(
  videoId: string,
  quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'maxresdefault'
): string {
  const youtubeUrl = `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
  const encodedUrl = encodeURIComponent(youtubeUrl);
  return `/api/image-proxy?url=${encodedUrl}`;
}
