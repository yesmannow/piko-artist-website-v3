export type VisualProvider = "pexels" | "unsplash" | "pixabay";

export interface VisualImage {
  id: string;
  src: string; // direct image URL suitable for <Image src="..." />
  width?: number;
  height?: number;
  photographer?: string;
  provider: VisualProvider;
  color?: string | null;
}

function shuffle<T>(arr: T[]): T[] {
  // Fisher-Yates
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DEFAULT_QUERY = "graffiti hip hop rap street urban neon";

async function fetchPexels(
  query: string,
  perPage: number,
  page: number,
): Promise<VisualImage[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", String(page));

  const res = await fetch(url.toString(), {
    headers: { Authorization: key },
    // 10s timeout safeguard via signal if desired
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data: any = await res.json();
  const photos: any[] = Array.isArray(data?.photos) ? data.photos : [];
  return photos
    .map((p) => ({
      id: String(p.id),
      src: p.src?.large2x || p.src?.large || p.src?.original,
      width: p.width,
      height: p.height,
      photographer: p.photographer,
      provider: "pexels" as const,
      color: p.avg_color ?? null,
    }))
    .filter((x: VisualImage) => Boolean(x.src));
}

async function fetchUnsplash(
  query: string,
  perPage: number,
  page: number,
): Promise<VisualImage[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", String(page));
  // Sort by relevance for aesthetic
  url.searchParams.set("order_by", "relevant");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${key}` },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data: any = await res.json();
  const results: any[] = Array.isArray(data?.results) ? data.results : [];
  return results
    .map((r) => ({
      id: String(r.id),
      src: r.urls?.regular || r.urls?.full || r.urls?.small,
      width: r.width,
      height: r.height,
      photographer: r.user?.name,
      provider: "unsplash" as const,
      color: r.color ?? null,
    }))
    .filter((x: VisualImage) => Boolean(x.src));
}

async function fetchPixabay(
  query: string,
  perPage: number,
  page: number,
): Promise<VisualImage[]> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return [];
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", key);
  url.searchParams.set("q", query);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", String(page));
  url.searchParams.set("safesearch", "true");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const data: any = await res.json();
  const hits: any[] = Array.isArray(data?.hits) ? data.hits : [];
  return hits
    .map((h) => ({
      id: String(h.id),
      // Prefer large image url if available, else webformatURL
      src: h.largeImageURL || h.webformatURL,
      width: h.imageWidth,
      height: h.imageHeight,
      photographer: h.user,
      provider: "pixabay" as const,
      color: null,
    }))
    .filter((x: VisualImage) => Boolean(x.src));
}

export interface SearchParams {
  theme?: string;
  count?: number; // total images desired
  page?: number;
}

export async function searchVisuals({
  theme = DEFAULT_QUERY,
  count = 12,
  page = 1,
}: SearchParams = {}): Promise<VisualImage[]> {
  const query = theme.trim() || DEFAULT_QUERY;

  // Determine distribution across providers based on which keys exist
  const candidates: readonly {
    name: VisualProvider;
    fn: (q: string, per: number, p: number) => Promise<VisualImage[]>;
    hasKey: boolean;
  }[] = [
    { name: "pexels", fn: fetchPexels, hasKey: !!process.env.PEXELS_API_KEY },
    {
      name: "unsplash",
      fn: fetchUnsplash,
      hasKey: !!process.env.UNSPLASH_ACCESS_KEY,
    },
    {
      name: "pixabay",
      fn: fetchPixabay,
      hasKey: !!process.env.PIXABAY_API_KEY,
    },
  ] as const;

  const availableProviders = candidates.filter(
    (p): p is (typeof candidates)[number] => p.hasKey,
  );

  const perProvider =
    availableProviders.length > 0
      ? Math.max(1, Math.floor(count / availableProviders.length))
      : count;

  const results = availableProviders.length
    ? await Promise.allSettled(
        availableProviders.map((p) => p.fn(query, perProvider, page)),
      )
    : [];

  const images = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : ([] as VisualImage[]),
  );

  // Dedupe by src
  const seen = new Set<string>();
  const deduped = images.filter((img) => {
    if (!img.src || seen.has(img.src)) return false;
    seen.add(img.src);
    return true;
  });

  // If we got less than requested and at least one provider exists, try another page fetch to fill
  if (deduped.length < count && availableProviders.length) {
    const fill = await Promise.allSettled(
      availableProviders.map((p) =>
        p.fn(query, count - deduped.length, page + 1),
      ),
    );
    for (const r of fill) {
      if (r.status === "fulfilled") {
        for (const img of r.value) {
          if (img.src && !seen.has(img.src)) {
            deduped.push(img);
            seen.add(img.src);
          }
          if (deduped.length >= count) break;
        }
      }
      if (deduped.length >= count) break;
    }
  }

  // Shuffle to mix providers, then slice
  return shuffle(deduped).slice(0, count);
}
