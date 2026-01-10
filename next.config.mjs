import path from 'path';
import { fileURLToPath } from 'url';
import withSerwistInit from '@serwist/next';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV !== 'production',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(process.env.VERCEL ? {} : { distDir: 'dist' }),
  // Ignore ESLint warnings during build (warnings are non-blocking)
  eslint: {
    ignoreDuringBuilds: false, // Keep false to catch real errors, but warnings won't block
  },
  // Ignore TypeScript errors during build (should be false for production)
  typescript: {
    ignoreBuildErrors: false, // Keep false to catch type errors
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // YouTube image domains
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      // Local development
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      // Unsplash
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      // Pexels
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      // Pixabay
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'pixabay.com',
      },
    ],
  },
  async rewrites() {
    return [
      // Fix case mismatch in dev/prod for Fallé track
      {
        source: '/audio/tracks/falle.mp3',
        destination: '/audio/tracks/Falle.mp3',
      },
      // Serve SVG icon as favicon to avoid 404s
      {
        source: '/favicon.ico',
        destination: '/icon.svg',
      },
    ];
  },
  async headers() {
    const headers = [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
        ],
      },
    ];
    // Note: COOP/COEP headers are now set only for studio routes via middleware
    // to enable SharedArrayBuffer support without breaking other routes
    return headers;
  },
  experimental: {
    // Vercel deployment configuration
  },
  outputFileTracingRoot: __dirname,
  webpack: (config, { isServer }) => {
    // Resolve path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

export default withSerwist(nextConfig);
