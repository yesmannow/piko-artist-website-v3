/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    // Disable experimental flags not supported by Cloudflare Workers
  },
};

export default nextConfig;
