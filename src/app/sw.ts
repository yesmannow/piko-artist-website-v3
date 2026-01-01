import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import { Serwist, CacheFirst, NetworkOnly, StaleWhileRevalidate, ExpirationPlugin, RangeRequestsPlugin } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

// ServiceWorkerGlobalScope is part of WorkerGlobalScope
declare const self: WorkerGlobalScope;

/**
 * Custom cache configuration with strict limits to prevent QuotaExceededError
 *
 * Key changes:
 * - Excludes audio stems from caching (NetworkOnly)
 * - Limits regular audio cache to 8 entries (reduced from 32)
 * - Limits 3D assets cache to 4 entries
 * - Adds cache cleanup on quota errors
 */
const customRuntimeCaching: RuntimeCaching[] = [
  // Audio stems - Strict 50-item limit to prevent QuotaExceededError
  // Note: Stems are large files, so we use NetworkOnly to prevent caching
  // If caching is needed in the future, use maxEntries: 50
  {
    matcher: /\/audio\/stems\/.*\.(?:mp3|wav|ogg|m4a)$/i,
    handler: new NetworkOnly(), // Never cache stems - they're too large (prevents quota errors)
  },
  // Regular audio files - strict limit to prevent quota errors
  {
    matcher: /\/audio\/tracks\/.*\.(?:mp3|wav|ogg|m4a)$/i,
    handler: new CacheFirst({
      cacheName: "audio-tracks",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 25, // CRITICAL: Strict limit to prevent QuotaExceededError
          maxAgeSeconds: 86400, // 24 hours (optimal for social sharing)
          maxAgeFrom: "last-used",
        }),
        new RangeRequestsPlugin(), // Support audio seeking
      ],
    }),
  },
  // Audio samples - even stricter limit
  {
    matcher: /\/audio\/samples\/.*\.(?:mp3|wav|ogg|m4a)$/i,
    handler: new CacheFirst({
      cacheName: "audio-samples",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 16, // Small samples can have more entries
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          maxAgeFrom: "last-used",
        }),
        new RangeRequestsPlugin(),
      ],
    }),
  },
  // 3D assets - strict limit
  {
    matcher: /\.(?:glb|gltf)$/i,
    handler: new CacheFirst({
      cacheName: "3d-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 4, // CRITICAL: Only cache 4 GLB files max
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  // WebAssembly - strict limit
  {
    matcher: /\.(?:wasm)$/i,
    handler: new CacheFirst({
      cacheName: "wasm-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 4, // Only cache 4 WASM files max
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  // Use defaultCache for everything else (fonts, images, JS, CSS, etc.)
  ...defaultCache,
];

// Cache cleanup utility - runs when quota is exceeded
// Wraps all cache operations in try-catch to handle QuotaExceededError gracefully
async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const cacheStats = await Promise.all(
      cacheNames.map(async (name) => {
        try {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          return { name, count: keys.length };
        } catch (error) {
          // If we can't open a cache (quota exceeded), return 0
          console.warn(`[SW] Could not open cache ${name}:`, error);
          return { name, count: 0 };
        }
      })
    );

    // Sort by count (descending) and remove oldest entries from largest caches
    cacheStats.sort((a, b) => b.count - a.count);

    for (const { name, count } of cacheStats) {
      if (count > 0) {
        try {
          const cache = await caches.open(name);
          const keys = await cache.keys();

          // Remove oldest 25% of entries if cache is getting large
          if (count > 20) {
            const toDelete = keys.slice(0, Math.floor(count * 0.25));
            await Promise.all(toDelete.map((key) => {
              try {
                return cache.delete(key);
              } catch (error) {
                // Ignore individual delete errors
                return Promise.resolve();
              }
            }));
            console.log(`[SW] Cleaned ${toDelete.length} entries from ${name}`);
          }
        } catch (error) {
          // If quota is exceeded, try to delete the entire cache
          const errorName = error && typeof error === "object" && "name" in error ? error.name : "";
          const errorMessage = error && typeof error === "object" && "message" in error ? String(error.message) : "";
          if (errorName === "QuotaExceededError" || errorMessage.includes("quota")) {
            console.warn(`[SW] Quota exceeded for ${name}, attempting to delete cache...`);
            try {
              await caches.delete(name);
              console.log(`[SW] Deleted cache ${name} to free space`);
            } catch (deleteError) {
              console.error(`[SW] Failed to delete cache ${name}:`, deleteError);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("[SW] Cache cleanup failed:", error);
  }
}

// Filter precache manifest to exclude large audio stems
// Stems are too large and will cause quota errors if pre-cached
const manifest = self.__SW_MANIFEST;
const filteredPrecacheEntries = manifest?.filter((entry) => {
  const url = typeof entry === "string" ? entry : entry.url;
  // Exclude audio stems from pre-caching
  return !url.includes("/audio/stems/");
}) || manifest;

const serwist = new Serwist({
  precacheEntries: filteredPrecacheEntries,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: customRuntimeCaching,
});

serwist.addEventListeners();

// Cache cleanup on service worker activation
self.addEventListener("activate", async (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches on activation
      await cleanupOldCaches();
    })()
  );
});

