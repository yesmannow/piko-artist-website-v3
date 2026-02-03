import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import withSerwistInit from '@serwist/next';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // Serwist does not support Turbopack in dev yet; disable outside production.
  disable: process.env.NODE_ENV !== 'production',
  // Increase the maximum file size to cache for large WASM files
  maximumFileSizeToCacheInBytes: 30 * 1024 * 1024, // Ensure large WASM files are cached
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Strict Mode to prevent double-initialization of AudioContext and WebGL Canvases
  reactStrictMode: false,
  // Exclude scripts directory from Next.js compilation
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // TypeScript will handle exclusions via tsconfig.json
  // ESLint configuration - allow warnings but catch errors
  eslint: {
    ignoreDuringBuilds: true, // Temporarily disabled - TODO: Fix 28 remaining errors in non-studio files
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
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
    // NOTE: COOP/COEP headers require all external resources to have CORP headers.
    // YouTube images are automatically proxied through /api/image-proxy for compatibility.
    // All components using YouTube thumbnails have been updated to use the proxy utility.
  },
  // External packages that should not be bundled (for Node.js sidecar scripts and browser-only packages)
  serverExternalPackages: ['prolink-connect', 'essentia.js'],
  // Transpile Tailwind v4 packages and ONNX Runtime for Turbopack compatibility
  transpilePackages: ['@tailwindcss/postcss', '@tailwindcss/node', 'onnxruntime-web'],
  outputFileTracingRoot: __dirname,
  webpack: (config, { isServer, dev }) => {
    if (!dev && process.env.VERCEL_ENV === 'production' && process.env.NEXT_PUBLIC_ENABLE_TEST_HELPERS === 'true') {
      throw new Error('Test helpers must not be enabled in production builds. Unset NEXT_PUBLIC_ENABLE_TEST_HELPERS.');
    }
    // Enable async WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true, // Required for some WASM builds
    };

    // Ensure .wasm files are emitted as static assets (never inlined)
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/wasm/[name][contenthash][ext]',
      },
    });

    // Copy Essentia WASM to public/wasm for worker-side direct loading fallback
    const wasmSource = path.resolve(__dirname, 'node_modules/essentia.js/dist/essentia-wasm.web.wasm');
    const wasmTargetDir = path.resolve(__dirname, 'public/wasm');
    if (fs.existsSync(wasmSource)) {
      fs.mkdirSync(wasmTargetDir, { recursive: true });
      const dest = path.join(wasmTargetDir, 'essentia-wasm.web.wasm');
      const sourceMTime = fs.statSync(wasmSource).mtimeMs;
      const needsCopy = !fs.existsSync(dest) || fs.statSync(dest).mtimeMs < sourceMTime;
      if (needsCopy) {
        fs.copyFileSync(wasmSource, dest);
      }
    }

    // Fix for Essentia.js "fs" module resolution in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Resolve path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    if (!dev && !process.env.NEXT_PUBLIC_ENABLE_TEST_HELPERS) {
      config.resolve.alias['@/utils/testHelpers'] = false;
    }
    return config;
  },
};

export default withSerwist(nextConfig);
