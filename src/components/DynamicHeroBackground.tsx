"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

interface ApiImage {
  id: string;
  src: string;
}

export default function DynamicHeroBackground() {
  const [images, setImages] = useState<ApiImage[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/visuals?theme=${encodeURIComponent("graffiti hip hop rap street urban neon")}&count=6`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => {
        const list: ApiImage[] = Array.isArray(d?.images)
          ? d.images.map((it: any) => ({ id: String(it.id), src: String(it.src) })).filter((x: ApiImage) => x.src)
          : [];
        setImages(list);
      })
      .catch(() => {})
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % images.length), 6000);
    return () => clearInterval(t);
  }, [images.length]);

  const show = useMemo(() => images.slice(0, 6), [images]);

  return (
    <div className="absolute inset-0 z-[5]">
      {show.map((img, i) => (
        <div key={img.id} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: i === index ? 1 : 0 }}>
          <Image
            src={img.src}
            alt=""
            fill
            priority={i === 0}
            className="object-cover"
            sizes="100vw"
            style={{ filter: "grayscale(1) contrast(1.2) brightness(0.8)" }}
          />
        </div>
      ))}
    </div>
  );
}
