import path from 'path';
import { fileURLToPath } from 'url';
import withSerwistInit from '@serwist/next';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // Serwist does not support Turbopack in dev yet; disable outside production.
  disable: process.env.NODE_ENV !== 'production',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Exclude scripts directory from Next.js compilation
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // TypeScript will handle exclusions via tsconfig.json
  // ESLint configuration - allow warnings but catch errors
  eslint: {
    ignoreDuringBuilds: false, // Keep false to catch real errors
    // Warnings won't block build, only errors will
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
    ],
    // Configure local image paths for Next.js 15+ compatibility
    // When localPatterns is defined, all local image paths must be explicitly allowed
    localPatterns: [
      {
        pathname: '/api/image-proxy',
        // Allow query strings (e.g., ?url=...)
      },
      {
        pathname: '/images/**',
        // Allow all images in the public/images directory (matches /images/anything)
      },
    ],
  },
  async headers() {
    return [
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
            // Studio needs microphone for voiceover recording.
            // Keep camera/geolocation disabled site-wide.
            value: 'camera=(), microphone=(self), geolocation=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp', // Required for SharedArrayBuffer (WASM threads)
          },
        ],
      },
    ];
    // NOTE: COOP/COEP headers require all external resources to have CORP headers.
    // YouTube images are automatically proxied through /api/image-proxy for compatibility.
    // All components using YouTube thumbnails have been updated to use the proxy utility.
  },
  experimental: {
    // Vercel deployment configuration
  },
  // External packages that should not be bundled (for Node.js sidecar scripts)
  serverExternalPackages: ['prolink-connect'],
  // Transpile Tailwind v4 packages and ONNX Runtime for Turbopack compatibility
  transpilePackages: ['@tailwindcss/postcss', '@tailwindcss/node', 'onnxruntime-web'],
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
