import { defaultCache } from "@serwist/next/worker";
import type {
  PrecacheEntry,
  SerwistGlobalConfig,
  RuntimeCaching,
} from "serwist";
import {
  Serwist,
  CacheFirst,
  NetworkOnly,
  StaleWhileRevalidate,
  ExpirationPlugin,
  RangeRequestsPlugin,
} from "serwist";

// =============== Size Metadata Plugin (LRU by size) ===============
const METADATA_CACHE = "cache-metadata";
interface MetaRecord { cacheName: string; url: string; size: number; ts: number }
async function deleteMeta(cacheName: string, url: string) {
  try {
    const metaCache = await caches.open(METADATA_CACHE);
    const key = new Request(
      `https://cache-meta.local/${encodeURIComponent(cacheName)}/${encodeURIComponent(url)}`,
    );
    await metaCache.delete(key);
  } catch {}
}

async function putMeta(cacheName: string, url: string, size: number) {
  try {
    const metaCache = await caches.open(METADATA_CACHE);
    const key = new Request(
      `https://cache-meta.local/${encodeURIComponent(cacheName)}/${encodeURIComponent(url)}`,
    );
    const rec: MetaRecord = { cacheName, url, size, ts: Date.now() };
    await metaCache.put(
      key,
      new Response(JSON.stringify(rec), {
        headers: { "content-type": "application/json" },
      }),
    );
  } catch {}
}

async function getAllMeta(): Promise<MetaRecord[]> {
  try {
    const metaCache = await caches.open(METADATA_CACHE);
    const keys = await metaCache.keys();
    const records: MetaRecord[] = [];
    for (const k of keys) {
      try {
        const res = await metaCache.match(k);
        if (!res) continue;
        const rec = await res.json();
        if (rec && typeof rec === "object" && rec.cacheName && rec.url)
          records.push(rec as MetaRecord);
      } catch {}
    }
    return records;
  } catch {
    return [];
  }
}

const SizeMetadataPlugin = {
  async cacheDidUpdate({
    cacheName,
    request,
    response,
  }: {
    cacheName: string;
    request: Request;
    response?: Response;
  }) {
    try {
      if (!response) return;
      // Estimate size from header if available, otherwise fallback to blob length (avoid on huge assets when possible)
      let size = 0;
      const header = response.headers.get("content-length");
      if (header) {
        size = parseInt(header, 10) || 0;
      } else {
        try {
          const clone = response.clone();
          const blob = await clone.blob();
          size = blob.size;
        } catch {}
      }
      await putMeta(cacheName, request.url, size);
    } catch {}
  },
};

// Soft byte caps per cache (adaptive cleanup target)
const CACHE_BYTE_LIMITS: Record<string, number> = {
  images: 30 * 1024 * 1024, // 30MB
  "next-static": 50 * 1024 * 1024, // 50MB
  "audio-samples": 25 * 1024 * 1024, // 25MB
  "3d-assets": 60 * 1024 * 1024, // 60MB
  "wasm-assets": 30 * 1024 * 1024, // 30MB
  fonts: 15 * 1024 * 1024, // 15MB
};

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ): void;
  }

  interface ExtendableEvent extends Event {
    waitUntil(f: Promise<unknown>): void;
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
  // CRITICAL: Never cache /worklets/* - these must always fetch fresh to preserve headers
  // Worklets require specific headers (COOP/COEP) that can be lost if cached
  {
    matcher: /\/worklets\/.*/i,
    handler: new NetworkOnly(), // Always fetch from network to preserve headers
  },
  // CRITICAL: Never cache /studio* routes - these require COOP/COEP headers for SharedArrayBuffer
  // Caching these routes can break crossOriginIsolated=true
  {
    matcher: /\/studio.*/i,
    handler: new NetworkOnly(), // Always fetch from network to preserve headers
  },
  // Audio stems - Strict 50-item limit to prevent QuotaExceededError
  // Note: Stems are large files, so we use NetworkOnly to prevent caching
  // If caching is needed in the future, use maxEntries: 50
  {
    matcher: /\/audio\/stems\/.*\.(?:mp3|wav|ogg|m4a)$/i,
    handler: new NetworkOnly(), // Never cache stems - they're too large (prevents quota errors)
  },
  // Regular audio files - CacheFirst with tight limits for offline playbacks
  {
    matcher: /\/audio\/tracks\/.*\.(?:mp3|wav|ogg|m4a)$/i,
    handler: new CacheFirst({
      cacheName: "audio-tracks",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 16,
          maxAgeSeconds: 7 * 24 * 60 * 60,
          maxAgeFrom: "last-used",
        }),
        new RangeRequestsPlugin(),
        SizeMetadataPlugin,
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
        SizeMetadataPlugin,
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
        SizeMetadataPlugin,
      ],
    }),
  },
  // Track artwork and cover images
  {
    matcher: /\/images\/tracks\/.*\.(?:png|jpg|jpeg|webp|avif)$/i,
    handler: new CacheFirst({
      cacheName: "track-art",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60,
          maxAgeFrom: "last-used",
        }),
        SizeMetadataPlugin,
      ],
    }),
  },
  // Mix exports (webm)
  {
    matcher: /\/mixes\/.*\.(?:webm|mp3)$/i,
    handler: new CacheFirst({
      cacheName: "mixes",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 8,
          maxAgeSeconds: 30 * 24 * 60 * 60,
          maxAgeFrom: "last-used",
        }),
        SizeMetadataPlugin,
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
        SizeMetadataPlugin,
      ],
    }),
  },
  // Next.js static assets - capped to avoid space growth
  {
    matcher: ({ url }) => url.pathname.startsWith("/_next/static/"),
    handler: new CacheFirst({
      cacheName: "next-static",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 80,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          maxAgeFrom: "last-used",
        }),
        SizeMetadataPlugin,
      ],
    }),
  },
  // Images - conservative limits
  {
    matcher: /\.(?:png|jpg|jpeg|gif|webp|avif|svg)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "images",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
          maxAgeFrom: "last-used",
        }),
        SizeMetadataPlugin,
      ],
    }),
  },
  // Fonts - small cap with long TTL
  {
    matcher: /\.(?:woff2|woff|ttf|otf)$/i,
    handler: new CacheFirst({
      cacheName: "fonts",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          maxAgeFrom: "last-used",
        }),
        SizeMetadataPlugin,
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

    // 1) Size-aware LRU pruning using metadata
    const meta = await getAllMeta();
    const byCache: Record<string, MetaRecord[]> = {};
    for (const rec of meta) {
      if (!byCache[rec.cacheName]) byCache[rec.cacheName] = [];
      byCache[rec.cacheName].push(rec);
    }

    for (const [name, records] of Object.entries(byCache)) {
      const limit = CACHE_BYTE_LIMITS[name];
      if (!limit || !records.length) continue;
      let total = records.reduce((acc, r) => acc + (r.size || 0), 0);
      if (total > limit) {
        try {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          // LRU first (oldest ts first)
          records.sort((a, b) => a.ts - b.ts);
          const target = Math.floor(limit * 0.85); // prune down to 85% of cap
          let deleted = 0;
          for (const rec of records) {
            if (total <= target) break;
            const key = keys.find((k) => k.url === rec.url);
            if (key) {
              try {
                const ok = await cache.delete(key);
                if (ok) {
                  total -= rec.size || 0;
                  deleted++;
                  await deleteMeta(name, rec.url);
                }
              } catch {}
            }
          }
          if (deleted > 0) {
            console.log(`[SW] Size-pruned ${deleted} entries from ${name}`);
          }
        } catch (error) {
          const errorName =
            error && typeof error === "object" && "name" in error
              ? (error as any).name
              : "";
          const errorMessage =
            error && typeof error === "object" && "message" in error
              ? String((error as any).message)
              : "";
          if (
            errorName === "QuotaExceededError" ||
            errorMessage.includes("quota")
          ) {
            console.warn(
              `[SW] Quota exceeded for ${name}, attempting to delete cache...`,
            );
            try {
              await caches.delete(name);
              console.log(`[SW] Deleted cache ${name} to free space`);
            } catch (deleteError) {
              console.error(
                `[SW] Failed to delete cache ${name}:`,
                deleteError,
              );
            }
          }
        }
      }
    }

    // 2) Fallback: count-based pruning for caches without metadata/limits
    const cacheStats = await Promise.all(
      cacheNames.map(async (name) => {
        try {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          return { name, count: keys.length };
        } catch (error) {
          console.warn(`[SW] Could not open cache ${name}:`, error);
          return { name, count: 0 };
        }
      }),
    );
    cacheStats.sort((a, b) => b.count - a.count);
    for (const { name, count } of cacheStats) {
      if (count <= 0 || CACHE_BYTE_LIMITS[name]) continue; // already handled by size pruning
      try {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        if (count > 20) {
          const toDelete = keys.slice(0, Math.floor(count * 0.25));
          await Promise.all(toDelete.map((key) => cache.delete(key)));
          console.log(
            `[SW] Count-pruned ${toDelete.length} entries from ${name}`,
          );
        }
      } catch (error) {
        const errorName =
          error && typeof error === "object" && "name" in error
            ? (error as any).name
            : "";
        const errorMessage =
          error && typeof error === "object" && "message" in error
            ? String((error as any).message)
            : "";
        if (
          errorName === "QuotaExceededError" ||
          errorMessage.includes("quota")
        ) {
          console.warn(
            `[SW] Quota exceeded for ${name}, attempting to delete cache...`,
          );
          try {
            await caches.delete(name);
            console.log(`[SW] Deleted cache ${name} to free space`);
          } catch (deleteError) {
            console.error(`[SW] Failed to delete cache ${name}:`, deleteError);
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
const filteredPrecacheEntries =
  manifest?.filter((entry) => {
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

// Catch handler: attempt cleanup and fall back to network to reduce noisy quota errors
serwist.setCatchHandler(async ({ request }) => {
  try {
    await cleanupOldCaches();
  } catch {}
  try {
    if (request) return await fetch(request);
  } catch {}
  return Response.error();
});

self.addEventListener("message", (event: Event) => {
  const e = event as any;
  const data = e?.data;
  if (data?.type === "CLEANUP_CACHES") {
    const ev = event as unknown as ExtendableEvent;
    ev.waitUntil(cleanupOldCaches());
  }
});

// Cache cleanup on service worker activation
self.addEventListener("activate", async (event: Event) => {
  const extendableEvent = event as ExtendableEvent;
  extendableEvent.waitUntil(
    (async () => {
      // Clean up old caches on activation
      await cleanupOldCaches();
    })(),
  );
});
