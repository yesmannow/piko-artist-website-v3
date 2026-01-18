"use client";

import type { ComponentType, ReactNode } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Download,
  Headphones,
  Music2,
  Play,
  Radio,
  Sparkles,
  Video,
  Waves,
} from "lucide-react";
import { ArtistSignalMeter } from "@/components/visual/ArtistSignalMeter";
import { tracks } from "@/lib/data";

type FeatureCardProps = {
  title: string;
  href: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  pill: string;
  accent: string;
};

function useLastSession() {
  const [lastTrack, setLastTrack] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("lastTrack");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      setLastTrack(parsed?.title ?? parsed?.name ?? String(saved));
    } catch {
      setLastTrack(saved);
    }
  }, []);

  return lastTrack;
}

function CtaButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center gap-3 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black";
  const variants = {
    primary:
      "bg-gradient-to-r from-[#facc15] via-[#c1ff00] to-[#7c3aed] text-black shadow-[0_10px_60px_rgba(193,255,0,0.35)] hover:brightness-105",
    ghost:
      "border border-white/20 text-white hover:border-[#c1ff00]/60 hover:text-[#c1ff00] bg-white/5",
  };
  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
      <Link href={href} className={`${base} ${variants[variant]}`}>
        {children}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

function FeatureCard({
  title,
  href,
  description,
  icon: Icon,
  pill,
  accent,
}: FeatureCardProps) {
  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5"
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${accent}`}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#c1ff00]">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
          {pill}
        </span>
      </div>
      <div className="relative mt-4 space-y-2">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-sm text-white/70 leading-relaxed">{description}</p>
      </div>
      <Link
        href={href}
        className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#c1ff00]"
      >
        Enter
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.article>
  );
}

function SectionHeading({
  overline,
  title,
  kicker,
}: {
  overline: string;
  title: string;
  kicker?: string;
}) {
  return (
    <div className="space-y-2">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/70">
        <Sparkles className="h-4 w-4 text-[#c1ff00]" aria-hidden />
        {overline}
      </span>
      <h2 className="text-3xl font-black leading-tight sm:text-4xl text-white">
        {title}
      </h2>
      {kicker ? (
        <p className="text-white/60 text-sm sm:text-base">{kicker}</p>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const lastTrack = useLastSession();
  const audioCount = useMemo(
    () => tracks.filter((t) => t.type === "audio").length,
    [],
  );
  const videoCount = useMemo(
    () => tracks.filter((t) => t.type === "video").length,
    [],
  );
  const featuredTrack = useMemo(
    () => tracks.find((t) => t.type === "audio"),
    [],
  );
  const featuredVideo = useMemo(
    () => tracks.filter((t) => t.type === "video").at(-1),
    [],
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        router.push("/studio");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router]);

  const featureCards: FeatureCardProps[] = [
    {
      title: "Music Library",
      href: "/music",
      description:
        "Stream the artist catalog with Camelot keys, vibe tags, and instant playback controls.",
      icon: Headphones,
      pill: "Listen Now",
      accent: "from-[#c1ff00]/15 via-transparent to-[#7c3aed]/10",
    },
    {
      title: "Visual Archive",
      href: "/videos",
      description:
        "Watch the latest sessions and dig through the archive with category filters.",
      icon: Video,
      pill: "Sessions",
      accent: "from-[#7c3aed]/18 via-transparent to-[#22d3ee]/12",
    },
    {
      title: "DJ Studio",
      href: "/studio",
      description:
        "Launch the deck-ready studio with live waveforms, signal metering, and key detection.",
      icon: Waves,
      pill: "Interactive",
      accent: "from-[#22d3ee]/18 via-transparent to-[#c1ff00]/12",
    },
    {
      title: "Install Piko DJ",
      href: "/install",
      description:
        "Add the PWA for offline stems, low-latency playback, and one-tap studio access.",
      icon: Download,
      pill: "PWA",
      accent: "from-[#facc15]/16 via-transparent to-[#7c3aed]/12",
    },
  ];

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#040404] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(193,255,0,0.12),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(124,58,237,0.18),transparent_32%),radial-gradient(circle_at_50%_80%,rgba(34,211,238,0.14),transparent_36%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:120px_120px]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-white/70">
              Artist First • Hip Hop • Visuals
            </div>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
              Piko Artist Studio
            </h1>
            <p className="text-lg text-white/70 sm:text-xl">
              Restore the full experience: music, visuals, and live DJ tools
              with the studio signal meter front and center.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <CtaButton href="/music">
                <Headphones className="h-4 w-4" />
                Listen Now
              </CtaButton>
              <CtaButton href="/studio" variant="ghost">
                <Waves className="h-4 w-4" />
                Launch DJ Studio
              </CtaButton>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                  Tracks
                </p>
                <p className="text-2xl font-semibold">{audioCount}</p>
                <p className="text-xs text-white/50">Camelot tagged library</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                  Videos
                </p>
                <p className="text-2xl font-semibold">{videoCount}</p>
                <p className="text-xs text-white/50">Storytelling archive</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                  Resume
                </p>
                <p className="text-sm font-semibold text-[#c1ff00]">
                  {lastTrack ?? "Load any deck"}
                </p>
                <p className="text-xs text-white/50">Press S to open Studio</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-[36px] bg-gradient-to-b from-[#c1ff00]/18 via-transparent to-[#7c3aed]/20 blur-3xl" />
            <ArtistSignalMeter className="relative" />
          </motion.div>
        </section>

        <section className="space-y-6">
          <SectionHeading
            overline="Destinations"
            title="Music, Visuals, Studio, Install"
            kicker="Jump straight into the rebuilt pages—optimized for mobile-first navigation."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((card) => (
              <FeatureCard key={card.href} {...card} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/10 via-transparent to-[#c1ff00]/10" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                  Music Library
                </p>
                <h3 className="text-2xl font-semibold">
                  {featuredTrack?.title ?? "Featured track"}
                </h3>
                <p className="text-white/70 text-sm">
                  Stream, download, and share with vibe tags and key badges.
                </p>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
                  <span className="rounded-full bg-white/10 px-2 py-1 text-white">
                    Camelot
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-white">
                    Vibe
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-white">
                    Download
                  </span>
                </div>
              </div>
              <Link
                href="/music"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em]"
              >
                <Music2 className="h-4 w-4" />
                Open Music
              </Link>
            </div>
            {featuredTrack?.coverArt ? (
              <div className="relative mt-4 h-48 overflow-hidden rounded-2xl border border-white/10">
                <Image
                  src={featuredTrack.coverArt}
                  alt={featuredTrack.title}
                  fill
                  className="object-cover opacity-80"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>
            ) : null}
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-[#22d3ee]/10 via-transparent to-[#7c3aed]/14" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                  Visual Archive
                </p>
                <h3 className="text-2xl font-semibold">
                  {featuredVideo?.title ?? "Latest session"}
                </h3>
                <p className="text-white/70 text-sm">
                  Featured drop plus a grid of archive videos with vibe filters.
                </p>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
                  <span className="rounded-full bg-white/10 px-2 py-1 text-white">
                    Chill
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-white">
                    Hype
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-white">
                    Storytelling
                  </span>
                </div>
              </div>
              <Link
                href="/videos"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em]"
              >
                <Radio className="h-4 w-4" />
                View Videos
              </Link>
            </div>
            <div className="relative mt-4 h-48 overflow-hidden rounded-2xl border border-white/10">
              {featuredVideo?.id ? (
                <Image
                  src={`https://i.ytimg.com/vi/${featuredVideo.id}/hqdefault.jpg`}
                  alt={featuredVideo.title}
                  fill
                  className="object-cover opacity-80"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-black/50 text-white/50">
                  Thumbnail coming soon
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#0f172a] via-[#0b0f1c] to-[#111827] p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(193,255,0,0.12),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(34,211,238,0.14),transparent_40%)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                Install Piko DJ
              </p>
              <h3 className="text-2xl font-semibold text-white">
                Add the PWA for one-tap studio access
              </h3>
              <p className="text-white/70 text-sm max-w-2xl">
                Install the app to keep the rebuilt Home, Music, Videos, and
                Studio experiences pinned with offline stems and haptics.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/install"
                className="inline-flex items-center gap-2 rounded-full bg-[#c1ff00] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black shadow-[0_10px_40px_rgba(193,255,0,0.3)]"
              >
                <Download className="h-4 w-4" />
                Install Piko DJ
              </Link>
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em]"
              >
                <Play className="h-4 w-4" />
                Open Studio
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
