// Homepage prioritizes artist showcase (music, videos, brand)
// DJ Studio is a featured interactive tool, but not the primary identity
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Headphones, Play, Sparkles, Waves, ArrowRight } from "lucide-react";
import { getAudioEngine } from "@/engine/AudioEngine";

const navLinks = [
  { label: "Music", href: "/music" },
  { label: "Videos", href: "/videos" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Studio", href: "/studio" },
];

const secondaryLinks = [
  { label: "Studio V2", href: "/studio-v2" },
  { label: "Vault", href: "/vault" },
  { label: "Install App", href: "/install" },
];

function useLastSession() {
  const [lastTrack, setLastTrack] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("lastTrack");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLastTrack(parsed?.title ?? parsed?.name ?? String(saved));
      } catch {
        setLastTrack(saved);
      }
    }
  }, []);

  return lastTrack;
}

function useRmsMeter() {
  const [rms, setRms] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      try {
        const engine = getAudioEngine();
        const ctxState = engine?.context?.state;
        if (engine?.state === "Running" && ctxState === "running") {
          const level = Math.max(
            engine.getRMS("deckA"),
            engine.getRMS("deckB"),
          );
          setRms(level);
        } else {
          setRms(0);
        }
      } catch {
        setRms(0);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return rms;
}

function CtaButton({
  href,
  label,
  icon: Icon,
  variant = "primary",
}: {
  href: string;
  label: string;
  icon?: typeof Headphones;
  variant?: "primary" | "secondary";
}) {
  const base =
    "relative flex items-center justify-center gap-3 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black";
  const variants = {
    primary:
      "bg-gradient-to-r from-[#facc15] via-[#c1ff00] to-[#7c3aed] text-black shadow-[0_10px_50px_rgba(193,255,0,0.35)] hover:brightness-105",
    secondary:
      "border border-white/20 text-white hover:border-[#c1ff00]/60 hover:text-[#c1ff00] bg-white/5",
  };

  return (
    <motion.div
      whileHover={{ rotate: variant === "primary" ? 0.5 : 0, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
    >
      <Link href={href} className={`${base} ${variants[variant]}`}>
        {Icon ? <Icon className="h-4 w-4" /> : null}
        <span>{label}</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const lastTrack = useLastSession();
  const rms = useRmsMeter();
  const [showLabs, setShowLabs] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        router.push("/studio");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router]);

  const primaryCtas = useMemo(
    () => [
      {
        label: "Listen Now",
        href: "/music",
        icon: Headphones,
        variant: "primary" as const,
      },
      {
        label: "Launch DJ Studio",
        href: "/studio",
        icon: Waves,
        variant: "secondary" as const,
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(193,255,0,0.14),transparent_35%),radial-gradient(circle_at_70%_10%,rgba(124,58,237,0.18),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(250,204,21,0.12),transparent_35%)]" />

      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-[#c1ff00]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Piko Studio
            </p>
            <p className="text-sm font-semibold text-white/90">
              Hip Hop / Visuals / Remix
            </p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm uppercase tracking-[0.16em]">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white/70 hover:text-[#c1ff00] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="px-6 pb-16 md:px-10 lg:px-16">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-black/60 via-black/40 to-black/70 px-6 py-12 shadow-[0_20px_80px_rgba(0,0,0,0.55)] md:px-12 lg:px-16">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-10 top-10 h-48 w-48 rounded-full bg-[#c1ff00]/10 blur-3xl" />
            <div className="absolute right-10 bottom-0 h-64 w-64 rounded-full bg-[#7c3aed]/15 blur-3xl" />
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/70">
                Artist First • Hip Hop • Visuals
              </div>
              <h1 className="text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
                Piko Studio
              </h1>
              <p className="text-lg text-white/70 sm:text-xl">
                Showcasing original hip hop, visuals, and remix-ready audio
                tools. Mix and explore the artist&apos;s world — tracks, videos,
                and collaborations.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {primaryCtas.map((cta) => (
                  <CtaButton key={cta.href} {...cta} />
                ))}
              </div>

              {lastTrack ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c1ff00]/15 text-[#c1ff00]">
                      <Play className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/60">
                        Resume Last Session
                      </p>
                      <p className="text-sm font-semibold text-white/90">
                        {lastTrack}
                      </p>
                    </div>
                  </div>
                  <CtaButton
                    href="/studio"
                    label="Resume DJ Session"
                    icon={Waves}
                    variant="secondary"
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-3 text-sm text-white/70">
                <p className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-[#c1ff00] animate-pulse" />
                  Press S to open Studio
                </p>

                <label className="inline-flex cursor-pointer items-center gap-3 text-white/80">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/40 bg-black/40 text-[#c1ff00] accent-[#c1ff00]"
                    checked={showLabs}
                    onChange={(e) => setShowLabs(e.target.checked)}
                  />
                  <span className="flex items-center gap-2 text-sm">
                    Show Labs{" "}
                    <span className="rounded-full bg-[#7c3aed]/20 px-2 py-0.5 text-xs text-[#c1ff00]">
                      🧪 Labs
                    </span>
                  </span>
                </label>

                {showLabs ? (
                  <div className="inline-flex items-center gap-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-[#c1ff00]" />
                    <Link
                      href="/studio-v2"
                      className="underline decoration-[#c1ff00]/60 underline-offset-4 hover:text-[#c1ff00]"
                    >
                      Jump into Studio V2 Labs
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-b from-[#c1ff00]/15 via-transparent to-[#7c3aed]/25 blur-3xl" />
              <div className="relative rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                      Live Visual Meter
                    </p>
                    <p className="text-xl font-semibold">Artist Signal</p>
                  </div>
                  <Sparkles className="h-5 w-5 text-[#c1ff00]" />
                </div>
                <div className="mt-6 h-40 rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="flex h-full items-end gap-2">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const phase = Math.sin((i / 12) * Math.PI * 2);
                      const height = Math.max(
                        8,
                        Math.min(100, rms * 120 + phase * 20),
                      );
                      return (
                        <motion.div
                          key={i}
                          animate={{ height }}
                          transition={{
                            type: "spring",
                            stiffness: 140,
                            damping: 18,
                          }}
                          className="w-3 rounded-full bg-gradient-to-t from-[#7c3aed] via-[#c1ff00] to-white shadow-[0_0_20px_rgba(193,255,0,0.35)]"
                          aria-hidden
                        />
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-white/60">
                    Live RMS (visual only) — active when audio is running
                  </p>
                </div>

                <div className="mt-6 grid gap-3 text-sm text-white/75">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-[#c1ff00]" />
                    Interactive DJ tools ready to load stems + waveforms
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-[#7c3aed]" />
                    Visual storytelling: videos, collaborations, behind the
                    scenes
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-white/70" />
                    Community ready: producers, rappers, and fans
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/80 sm:grid-cols-2 lg:grid-cols-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-4 py-3 transition-colors hover:border-[#c1ff00]/40 hover:text-white"
            >
              <span>{link.label}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
          {secondaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3 transition-colors hover:border-[#7c3aed]/50 hover:text-white"
            >
              <span>{link.label}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
