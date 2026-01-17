"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { tracks } from "@/lib/data";
import { useVideo } from "@/context/VideoContext";

/**
 * VaultVisuals - CCTV Monitor Wall for Videos Section
 *
 * Urban Syndicate aesthetic: Security monitor grid with REC dots,
 * grayscale-to-color transitions, and scanline overlays.
 */
export function VaultVisuals() {
  const { playVideo } = useVideo();
  const videos = tracks.filter((t) => t.type === "video").slice(0, 6);

  const cctvAssets = [
    "/images/tracks/dj-2581269_1280.jpg", // Session 1
    "/images/tracks/graffiti-3750912_1280.jpg", // Session 2
    "/images/tracks/vinyl-1595847_1280.jpg", // Session 3
    "/images/tracks/skateboard-447147_1280.jpg", // Session 4
    "/images/tracks/street-art-1499524_1280.jpg", // Session 5
    "/images/tracks/abstract-1846847_1280.jpg", // Session 6
  ];

  const [dynamicCctv, setDynamicCctv] = useState<string[]>([]);
  const [clock, setClock] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(
      `/api/visuals?theme=${encodeURIComponent("graffiti hip hop rap street urban neon")}&count=6`,
      {
        signal: controller.signal,
        cache: "no-store",
      },
    )
      .then((r) => r.json())
      .then((d) => {
        const list: string[] = Array.isArray(d?.images)
          ? d.images
              .map((it: any) => String(it?.src))
              .filter((s: string) => !!s)
          : [];
        setDynamicCctv(list);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    // Set time on client only
    const update = () =>
      setClock(new Date().toLocaleTimeString("en-US", { hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      id="recent-sightings"
      className="relative py-24 bg-[#050505] border-t-2 border-[#E0E0E0]/10 px-6"
    >
      {/* Graffiti Wall Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/bg/graffiti-wall-3.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/85" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header with Stencil Style */}
        <div className="mb-16 text-center">
          <h2
            className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase text-[#E0E0E0]"
            style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
          >
            VAULT_<span className="text-[#FFD700]">VISUALS</span>
          </h2>
          <div className="flex justify-center items-center gap-4 mt-4 opacity-50">
            <span className="h-[2px] w-12 bg-[#FFD700]" />
            <span className="text-xs font-mono tracking-widest uppercase">
              Live Surveillance Feed
            </span>
            <span className="h-[2px] w-12 bg-[#FFD700]" />
          </div>
        </div>

        {/* Monitor Wall Grid - Industrial Bezel */}
        <div className="relative p-4 bg-[#000] border-4 border-[#E0E0E0]">
          {/* Chrome Bolts - Corners */}
          <div
            className="absolute -top-2 -left-2 w-4 h-4 bg-[#E0E0E0] border-2 border-black"
            style={{ clipPath: "circle(50%)" }}
          />
          <div
            className="absolute -top-2 -right-2 w-4 h-4 bg-[#E0E0E0] border-2 border-black"
            style={{ clipPath: "circle(50%)" }}
          />
          <div
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#E0E0E0] border-2 border-black"
            style={{ clipPath: "circle(50%)" }}
          />
          <div
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#E0E0E0] border-2 border-black"
            style={{ clipPath: "circle(50%)" }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
            {videos.map((video, index) => {
              const cctvBackground =
                dynamicCctv[index] ||
                cctvAssets[index] ||
                "/images/placeholder.jpg";

              // Extract YouTube ID from src for thumbnail fallback
              const youtubeId = video.src.includes("youtube.com/watch?v=")
                ? video.src.split("v=")[1]?.split("&")[0]
                : video.src.includes("youtu.be/")
                  ? video.src.split("youtu.be/")[1]?.split("?")[0]
                  : null;

              const thumbnailUrl = youtubeId
                ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
                : cctvBackground;

              return (
                <motion.div
                  key={video.id}
                  whileHover={{ scale: 0.98 }}
                  className="group relative aspect-video bg-black border border-white/5 overflow-hidden cursor-pointer"
                  onClick={() => playVideo(video.id)}
                >
                  {/* CCTV Overlays */}
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-[10px] font-mono text-white/70 uppercase">
                      REC: {video.title}
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4 z-20 text-[10px] font-mono text-white/40">
                    {clock}
                    {/* CAM_{String(index + 1).padStart(2, "0")} */}
                  </div>

                  {/* Video Thumbnail with Urban Filter - Grayscale by default, color on hover */}
                  <div className="relative w-full h-full">
                    {/* Background image layer */}
                    <div
                      className="absolute inset-0 transition-all duration-500 [filter:grayscale(100%)_contrast(1.2)_brightness(0.8)] group-hover:[filter:grayscale(0%)_contrast(1.2)_brightness(0.8)]"
                      style={{
                        backgroundImage: `url(${cctvBackground})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    {/* YouTube thumbnail overlay (if available) */}
                    {youtubeId && (
                      <Image
                        src={thumbnailUrl}
                        alt={video.title}
                        fill
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity [filter:grayscale(100%)_contrast(1.2)_brightness(0.8)] group-hover:[filter:grayscale(0%)_contrast(1.2)_brightness(0.8)]"
                      />
                    )}
                    {/* CRT Scanline Overlay */}
                    <div
                      className="absolute inset-0 pointer-events-none z-10"
                      style={{
                        background: `linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.1) 50%), linear-gradient(90deg, rgba(255,0,0,0.03), rgba(0,255,0,0.01), rgba(0,0,255,0.03))`,
                        backgroundSize: "100% 4px, 3px 100%",
                      }}
                    />
                  </div>

                  {/* Play Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30">
                    <div className="w-16 h-16 border-2 border-[#FFD700] text-[#FFD700] flex items-center justify-center">
                      <span className="text-xl">▶</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/videos"
            className="px-12 py-4 border-2 border-[#E0E0E0] text-[#E0E0E0] font-black italic uppercase skew-x-[-12deg] hover:bg-[#FFD700] hover:text-black hover:border-[#FFD700] transition-all"
            style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
          >
            ACCESS FULL ARCHIVE
          </Link>
        </div>
      </div>
    </section>
  );
}
