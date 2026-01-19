"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { tracks } from "@/lib/data";
import { useAudio } from "@/context/AudioContext";
import { useHaptic } from "@/hooks/useHaptic";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  Download,
  ExternalLink,
  Mail,
  Music,
  Play,
  Send,
  Video,
} from "lucide-react";

type InquiryType = "booking" | "collab" | "press" | "licensing" | "other";
type PreferredContact = "email" | "phone" | "whatsapp";

const PRESS_PHOTOS = [
  { src: "/images/artist/bio-portrait.jpg", label: "BIO_PORTRAIT" },
  { src: "/images/artist/portrait-close.jpg", label: "PORTRAIT_CLOSE" },
  { src: "/images/artist/outdoor-squating.jpg", label: "OUTDOOR" },
  { src: "/images/artist/studio-mic.jpg", label: "STUDIO_MIC" },
];

const INQUIRY_BENTO: {
  type: InquiryType;
  title: string;
  subtitle: string;
  hint: string;
}[] = [
  { type: "booking", title: "Booking", subtitle: "Live / DJ / Showcase", hint: "Date • city • capacity • budget" },
  { type: "collab", title: "Collab", subtitle: "Features / production", hint: "Links • deadline • deliverables" },
  { type: "press", title: "Press", subtitle: "Interviews / blogs", hint: "Outlet • angle • publish date" },
  { type: "licensing", title: "Licensing", subtitle: "Sync / brand use", hint: "Usage • territory • term" },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hashToBars(seed: string, count: number) {
  // Lightweight deterministic hash → barcode-like bars.
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    h ^= h << 13;
    h ^= h >> 17;
    h ^= h << 5;
    bars.push((h >>> 0) % 10); // 0-9 thickness weight
  }
  return bars;
}

function Barcode({ seed }: { seed: string }) {
  const bars = useMemo(() => hashToBars(seed, 48), [seed]);
  const total = bars.reduce((a, b) => a + (b === 0 ? 1 : b), 0);
  let x = 0;
  return (
    <svg viewBox={`0 0 ${total} 24`} className="w-full h-6" aria-hidden="true">
      {bars.map((w, i) => {
        const width = w === 0 ? 1 : w;
        const rect = (
          <rect
            key={i}
            x={x}
            y={0}
            width={width}
            height={24}
            fill={i % 3 === 0 ? "rgba(255,215,0,0.85)" : "rgba(224,224,224,0.85)"}
          />
        );
        x += width;
        return rect;
      })}
    </svg>
  );
}

function scoreInquiry(data: {
  inquiryType: InquiryType;
  name: string;
  email: string;
  message: string;
  targetDate: string;
  city: string;
  budget: string;
  venueCapacity: string;
}) {
  // Not a "credit score"—just a pre-qual completeness meter.
  let score = 0;
  if (data.name.trim().length >= 2) score += 15;
  if (data.email.includes("@")) score += 15;
  if (data.message.trim().length >= 20) score += 15;
  if (data.inquiryType !== "other") score += 10;
  if (data.targetDate) score += 15;
  if (data.city.trim().length >= 2) score += 10;
  if (data.budget.trim().length >= 1) score += 10;
  if (data.venueCapacity.trim().length >= 1) score += 10;
  return clamp(score, 0, 100);
}

export default function ContactPage() {
  const { triggerHaptic } = useHaptic();
  const { playTrack } = useAudio();
  const searchParams = useSearchParams();

  const CALENDAR_URL = process.env.NEXT_PUBLIC_BOOKING_CALENDAR_URL || "";

  const topAudio = useMemo(() => tracks.filter((t) => t.type === "audio").slice(0, 6), []);
  const topVideos = useMemo(() => tracks.filter((t) => t.type === "video").slice(0, 2), []);
  const audioCount = useMemo(() => tracks.filter((t) => t.type === "audio").length, []);
  const videoCount = useMemo(() => tracks.filter((t) => t.type === "video").length, []);

  const proofTicker = useMemo(() => {
    const items = [
      `CATALOG: ${audioCount} TRACKS`,
      `LIVE SESSIONS: ${videoCount} VIDEOS`,
      "RESPONSE: 24-48H",
      "LANG: ES / EN",
      "ASSET: EPK READY",
      "MODE: BUSINESS-FIRST",
    ];
    // repeat for seamless marquee
    return [...items, ...items];
  }, [audioCount, videoCount]);

  const [form, setForm] = useState({
    inquiryType: "booking" as InquiryType,
    name: "",
    email: "",
    phone: "",
    company: "",
    city: "",
    country: "",
    eventType: "club",
    targetDate: "",
    venue: "",
    venueCapacity: "",
    budget: "",
    travel: "TBD",
    preferredContact: "email" as PreferredContact,
    links: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeStep, setActiveStep] = useState<"brief" | "epk" | "proof" | "form">("brief");
  const formRef = useRef<HTMLDivElement | null>(null);

  // Allow /contact?inquiry=booking|collab|press|licensing to preselect the router (used by home teaser links)
  useEffect(() => {
    const q = (searchParams.get("inquiry") || "").toLowerCase();
    if (q === "booking" || q === "collab" || q === "press" || q === "licensing" || q === "other") {
      setForm((p) => ({ ...p, inquiryType: q as InquiryType }));
    }
  }, [searchParams]);

  const completeness = scoreInquiry({
    inquiryType: form.inquiryType,
    name: form.name,
    email: form.email,
    message: form.message,
    targetDate: form.targetDate,
    city: form.city,
    budget: form.budget,
    venueCapacity: form.venueCapacity,
  });

  useEffect(() => {
    const ids: Array<"brief" | "epk" | "proof" | "form"> = ["brief", "epk", "proof", "form"];
    const els = ids
      .map((id) => ({ id, el: document.getElementById(id) }))
      .filter((x): x is { id: typeof ids[number]; el: HTMLElement } => Boolean(x.el));

    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
        if (!visible) return;
        const id = (visible.target as HTMLElement).id as typeof ids[number];
        setActiveStep(id);
      },
      { root: null, threshold: [0.15, 0.25, 0.35], rootMargin: "-25% 0px -60% 0px" }
    );

    els.forEach(({ el }) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "hub", ...form }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed to submit form" }));
        setSubmitStatus("error");
        setErrorMessage(err.error || "Failed to submit form. Please try again.");
        return;
      }

      const result = await response.json();
      if (result.success) {
        setSubmitStatus("success");
      } else {
        setSubmitStatus("error");
        setErrorMessage(result.error || "Failed to submit form. Please try again.");
      }
    } catch {
      setSubmitStatus("error");
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0]">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <Image
            src="/images/bg/graffiti-wall-1.jpg"
            alt=""
            fill
            priority
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-black/80" />
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(224,224,224,0.08) 0px, rgba(224,224,224,0.08) 1px, transparent 2px, transparent 4px)",
              mixBlendMode: "overlay",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-14 md:py-20">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black bg-[#FFD700] text-black font-mono text-[10px] uppercase tracking-[0.25em]">
                BOOKING_TERMINAL
              </div>
              <h1 className="mt-4 text-4xl md:text-6xl font-black italic uppercase">
                Contact & Booking Hub
              </h1>
              <p className="mt-3 max-w-2xl text-white/70 font-industrial">
                Not just a form—this page is built to pre-qualify inquiries and give promoters/collaborators everything
                they need (press photos, media, links) in one place.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/music"
                className="px-4 py-3 border-2 border-white/15 bg-black/40 hover:bg-white/10 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em]"
              >
                <Music className="w-4 h-4" />
                Music
              </Link>
              <Link
                href="/videos"
                className="px-4 py-3 border-2 border-white/15 bg-black/40 hover:bg-white/10 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em]"
              >
                <Video className="w-4 h-4" />
                Videos
              </Link>
              {CALENDAR_URL ? (
                <a
                  href={CALENDAR_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3 border-2 border-black bg-[#FFD700] text-black hover:bg-[#E0E0E0] inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em]"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <div
                  className="px-4 py-3 border-2 border-white/15 bg-black/30 text-white/50 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em]"
                  title="Set NEXT_PUBLIC_BOOKING_CALENDAR_URL to enable"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule
                </div>
              )}
            </div>
          </div>

          {/* Collage: candid camera roll + analog grit */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
            <div className="border-2 border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-4">
                <div className="text-xs font-mono uppercase tracking-[0.25em] text-white/60">
                  CAMERA_ROLL // GRIT
                </div>
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">
                  harsh flash • behind scenes
                </div>
              </div>
              {/* Mobile-first: grid layout (no horizontal scroll needed) */}
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PRESS_PHOTOS.map((p, idx) => (
                    <motion.div
                      key={p.src}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: Math.min(idx * 0.06, 0.3) }}
                      className="relative border-2 border-black bg-black/30 min-w-0"
                      style={{
                        boxShadow: "6px 6px 0px rgba(0,0,0,1)",
                        transform: `rotate(${idx % 2 === 0 ? -1.0 : 0.9}deg)`,
                      }}
                    >
                      <div className="relative w-full h-[200px] sm:h-[220px]">
                        <Image
                          src={p.src}
                          alt={p.label}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 25vw"
                          style={{ filter: "contrast(1.15) grayscale(0.15) brightness(0.92)" }}
                        />
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            mixBlendMode: "overlay",
                            opacity: 0.22,
                            background:
                              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.22) 0%, rgba(0,0,0,0) 55%)",
                          }}
                        />
                      </div>
                      <div className="px-3 py-2 border-t border-black/60 bg-[#E0E0E0] text-black">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] truncate">
                          {p.label}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Micro-industrial card */}
            <div className="border-2 border-white/10 bg-white/5 backdrop-blur-xl p-4">
              <div className="text-xs font-mono uppercase tracking-[0.25em] text-white/60">
                INDUSTRIAL_LABEL
              </div>
              <div className="mt-2 text-2xl font-black italic uppercase">Fast Verification</div>
              <div className="mt-3 text-sm text-white/70">
                Promoters: everything needed is above the form. Use the barcode ID in your subject line if you want.
              </div>
              <div className="mt-4 border border-white/10 bg-black/30 p-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/60">ASSET_ID</div>
                <div className="mt-2">
                  <Barcode seed={`PIKO-${audioCount}-${videoCount}`} />
                </div>
                <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/50">
                  PIKO-{audioCount}-{videoCount}-2026
                </div>
              </div>
              <div className="mt-4 text-[10px] font-mono uppercase tracking-[0.25em] text-white/50">
                Tip: add “capacity + budget + date” for priority.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN GRID */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14 overflow-x-hidden">
        {/* Mobile-first: 1 col; Desktop: 2 cols; XL: add scrolly sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] xl:grid-cols-[240px_minmax(0,1fr)_minmax(0,420px)] gap-8 lg:gap-10">
          {/* SCROLLY SIDEBAR */}
          <aside className="hidden xl:block min-w-0">
            <div className="sticky top-28 border-2 border-white/10 bg-white/5 backdrop-blur-xl p-4">
              <div id="brief" className="text-xs font-mono uppercase tracking-[0.25em] text-white/60">
                MISSION_BRIEF
              </div>
              <div className="mt-2 text-lg font-black italic uppercase">Scrollytelling</div>
              <div className="mt-3 space-y-2">
                {([
                  { id: "epk", label: "EPK + ASSETS" },
                  { id: "proof", label: "SOCIAL PROOF" },
                  { id: "form", label: "BOOKING FORM" },
                ] as const).map((s) => {
                  const active = activeStep === s.id;
                  return (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className={[
                        "block px-3 py-2 border-2 font-mono text-[11px] uppercase tracking-[0.25em]",
                        active ? "border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]" : "border-white/10 hover:border-white/20 text-white/70",
                      ].join(" ")}
                    >
                      {s.label}
                    </a>
                  );
                })}
              </div>
              <div className="mt-4 text-[10px] font-mono uppercase tracking-[0.25em] text-white/50">
                Micro-interactions + glass depth (sharp corners).
              </div>
            </div>
          </aside>

          {/* LEFT: EPK + MEDIA */}
          <div className="space-y-8 min-w-0">
            {/* Bento inquiry router */}
            <div className="border-2 border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-[0.25em] text-white/60">INQUIRY_ROUTER</div>
                  <div className="text-2xl font-black italic uppercase">Pick your lane</div>
                  <div className="text-sm text-white/70">
                    Bento grid for clear pathways (Booking / Press / Collab / Licensing).
                  </div>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {INQUIRY_BENTO.map((i) => (
                  <button
                    key={i.type}
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setForm((p) => ({ ...p, inquiryType: i.type }));
                      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={[
                      "text-left p-4 border-2 transition-all",
                      "bg-black/30 hover:bg-white/5",
                      form.inquiryType === i.type ? "border-[#FFD700]" : "border-white/10 hover:border-white/20",
                    ].join(" ")}
                    style={{ boxShadow: "6px 6px 0px rgba(0,0,0,1)" }}
                    aria-label={`Select ${i.title} inquiry`}
                  >
                    <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/60">{i.subtitle}</div>
                    <div className="mt-1 text-xl font-black italic uppercase">{i.title}</div>
                    <div className="mt-2 text-sm text-white/70">{i.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* EPK PANEL */}
            <div id="epk" className="border-2 border-white/10 bg-white/5 backdrop-blur-xl">
              <div className="p-4 md:p-5 border-b border-white/10 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-[0.25em] text-white/60">
                    EPK // PRESS_ASSETS
                  </div>
                  <div className="text-2xl font-black italic uppercase">Media Kit</div>
                  <div className="text-sm text-white/70">
                    Press photos + quick facts. Download links below are direct files.
                  </div>
                </div>
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/50">
                  Tip: right click → save
                </div>
              </div>

              <div className="p-4 md:p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                {PRESS_PHOTOS.map((p) => (
                  <div key={p.src} className="border border-white/10 bg-black/20">
                    <div className="relative aspect-[4/5]">
                      <Image src={p.src} alt={p.label} fill className="object-cover" />
                    </div>
                    <div className="p-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/70 truncate">
                        {p.label}
                      </div>
                      <a
                        href={p.src}
                        download
                        className="p-2 border border-white/15 bg-black/40 hover:bg-white/10"
                        aria-label={`Download ${p.label}`}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 md:p-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-white/10 bg-black/20 p-4">
                  <div className="text-xs font-mono uppercase tracking-[0.25em] text-white/60">Quick Facts</div>
                  <div className="mt-2 space-y-2 text-sm text-white/75">
                    <div className="flex justify-between gap-3">
                      <span className="text-white/50">Artist</span>
                      <span className="font-mono">PIKO</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/50">Genres</span>
                      <span className="font-mono">HIP-HOP / URBAN</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/50">Languages</span>
                      <span className="font-mono">ES / EN</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/50">Services</span>
                      <span className="font-mono">LIVE / DJ / COLLAB</span>
                    </div>
                  </div>
                </div>

                <div className="border border-white/10 bg-black/20 p-4">
                  <div className="text-xs font-mono uppercase tracking-[0.25em] text-white/60">Fast Track</div>
                  <div className="mt-2 text-sm text-white/75">
                    To get a faster response, include: <span className="text-[#FFD700] font-mono">date</span>,{" "}
                    <span className="text-[#FFD700] font-mono">city</span>,{" "}
                    <span className="text-[#FFD700] font-mono">budget</span>, and{" "}
                    <span className="text-[#FFD700] font-mono">capacity</span>.
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-white/70" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/60">
                      We aim to respond within 24–48h.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* MEDIA PREVIEW */}
            <div id="proof" className="border-2 border-white/10 bg-white/5 backdrop-blur-xl">
              <div className="p-4 md:p-5 border-b border-white/10">
                <div className="text-xs font-mono uppercase tracking-[0.25em] text-white/60">SOCIAL_PROOF</div>
                <div className="text-2xl font-black italic uppercase">Recent Drops / Live Sessions</div>
                <div className="text-sm text-white/70">
                  Quick preview for promoters and collaborators.
                </div>
              </div>

              {/* Social proof ticker (real counts) */}
              <div className="border-b border-white/10 bg-black/30 overflow-hidden">
                <div className="whitespace-nowrap py-2">
                  <div className="animate-marquee">
                    {proofTicker.map((t, idx) => (
                      <span
                        key={`${t}-${idx}`}
                        className="inline-flex items-center gap-2 px-4 text-[10px] font-mono uppercase tracking-[0.25em] text-white/70"
                      >
                        <span className="w-2 h-2 bg-[#FFD700]" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-white/10 bg-black/20 p-4">
                  <div className="text-xs font-mono uppercase tracking-[0.25em] text-white/60 mb-3">
                    Top Tracks
                  </div>
                  <div className="space-y-2">
                    {topAudio.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic();
                          playTrack(t);
                        }}
                        className="w-full text-left px-3 py-3 border-2 border-white/10 hover:border-white/20 bg-black/20 hover:bg-white/5 transition-colors flex items-center gap-3"
                      >
                        <div className="w-10 h-10 relative border border-white/10 overflow-hidden">
                          <Image src={t.coverArt} alt="" fill className="object-cover" sizes="40px" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-bold">{t.title}</div>
                          <div className="truncate text-white/60 text-sm">{t.vibe.toUpperCase()}</div>
                        </div>
                        <div className="p-2 border border-white/10 bg-black/30">
                          <Play className="w-4 h-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-white/10 bg-black/20 p-4">
                  <div className="text-xs font-mono uppercase tracking-[0.25em] text-white/60 mb-3">
                    Live Video
                  </div>
                  <div className="space-y-3">
                    {topVideos.map((v) => (
                      <div key={v.id} className="border border-white/10 bg-black/30">
                        <div className="relative aspect-video">
                          <iframe
                            className="absolute inset-0 w-full h-full"
                            src={v.src}
                            title={v.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <div className="p-3 border-t border-white/10">
                          <div className="font-bold truncate">{v.title}</div>
                          <div className="text-white/60 text-sm truncate">{v.vibe.toUpperCase()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-5 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
                <Link
                  href="/music"
                  className="px-4 py-3 border-2 border-white/15 bg-black/40 hover:bg-white/10 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em]"
                >
                  <Music className="w-4 h-4" />
                  Full Music Library
                </Link>
                <Link
                  href="/videos"
                  className="px-4 py-3 border-2 border-white/15 bg-black/40 hover:bg-white/10 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em]"
                >
                  <Video className="w-4 h-4" />
                  Full Videos
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT: FORM */}
          <div id="form" ref={formRef} className="border-2 border-white/10 bg-white/5 backdrop-blur-xl h-fit min-w-0">
            <div className="p-4 md:p-5 border-b border-white/10">
              <div className="text-xs font-mono uppercase tracking-[0.25em] text-white/60">
                INQUIRY_FORM // PRE-QUAL
              </div>
              <div className="text-2xl font-black italic uppercase">Send a Request</div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-2 bg-white/10">
                  <div
                    className="h-full bg-[#FFD700]"
                    style={{ width: `${completeness}%` }}
                    aria-label="Inquiry completeness"
                  />
                </div>
                <div className="text-xs font-mono text-white/70">{completeness}%</div>
              </div>
            </div>

            <div className="p-4 md:p-5 space-y-4">
              {/* TYPE */}
              <div>
                <label className="block mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                  Inquiry Type
                </label>
                <select
                  value={form.inquiryType}
                  onChange={(e) => setForm((p) => ({ ...p, inquiryType: e.target.value as InquiryType }))}
                  className="w-full px-4 py-3 bg-gray-300 text-black font-mono font-bold uppercase tracking-wider border-2 border-black"
                >
                  <option value="booking">Booking</option>
                  <option value="collab">Collab</option>
                  <option value="press">Press</option>
                  <option value="licensing">Licensing</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* CONTACT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                    Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-300 text-black font-mono font-bold uppercase tracking-wider border-2 border-black"
                    placeholder="Your name"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-300 text-black font-mono font-bold tracking-wider border-2 border-black"
                    placeholder="you@domain.com"
                    maxLength={254}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                    Phone (optional)
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-300 text-black font-mono font-bold tracking-wider border-2 border-black"
                    placeholder="+1 ..."
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                    Company / Entity (optional)
                  </label>
                  <input
                    value={form.company}
                    onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-300 text-black font-mono font-bold uppercase tracking-wider border-2 border-black"
                    placeholder="Promoter / Brand"
                    maxLength={120}
                  />
                </div>
              </div>

              {/* BOOKING DETAILS */}
              <div className="border border-white/10 bg-black/20 p-4">
                <div className="text-xs font-mono uppercase tracking-[0.25em] text-white/60 mb-3">
                  Booking Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                      City
                    </label>
                    <input
                      value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-300 text-black font-mono font-bold uppercase tracking-wider border-2 border-black"
                      placeholder="City"
                      maxLength={80}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                      Country (optional)
                    </label>
                    <input
                      value={form.country}
                      onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-300 text-black font-mono font-bold uppercase tracking-wider border-2 border-black"
                      placeholder="Country"
                      maxLength={80}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                      Event Type
                    </label>
                    <select
                      value={form.eventType}
                      onChange={(e) => setForm((p) => ({ ...p, eventType: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-300 text-black font-mono font-bold uppercase tracking-wider border-2 border-black"
                    >
                      <option value="club">Club</option>
                      <option value="festival">Festival</option>
                      <option value="private">Private</option>
                      <option value="corporate">Corporate</option>
                      <option value="showcase">Showcase</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={form.targetDate}
                      onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-300 text-black font-mono font-bold tracking-wider border-2 border-black"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                      Venue (optional)
                    </label>
                    <input
                      value={form.venue}
                      onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-300 text-black font-mono font-bold uppercase tracking-wider border-2 border-black"
                      placeholder="Venue / address"
                      maxLength={140}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                      Capacity
                    </label>
                    <input
                      value={form.venueCapacity}
                      onChange={(e) => setForm((p) => ({ ...p, venueCapacity: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-300 text-black font-mono font-bold tracking-wider border-2 border-black"
                      placeholder="e.g. 250"
                      maxLength={20}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                      Budget / Offer
                    </label>
                    <input
                      value={form.budget}
                      onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-300 text-black font-mono font-bold tracking-wider border-2 border-black"
                      placeholder="e.g. $1500 + travel"
                      maxLength={60}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                      Travel / Hospitality (optional)
                    </label>
                    <input
                      value={form.travel}
                      onChange={(e) => setForm((p) => ({ ...p, travel: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-300 text-black font-mono font-bold tracking-wider border-2 border-black"
                      placeholder="TBD / provided / not needed"
                      maxLength={80}
                    />
                  </div>
                </div>
              </div>

              {/* PREFERRED + LINKS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                    Preferred Contact
                  </label>
                  <select
                    value={form.preferredContact}
                    onChange={(e) => setForm((p) => ({ ...p, preferredContact: e.target.value as PreferredContact }))}
                    className="w-full px-4 py-3 bg-gray-300 text-black font-mono font-bold uppercase tracking-wider border-2 border-black"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                    Links (optional)
                  </label>
                  <input
                    value={form.links}
                    onChange={(e) => setForm((p) => ({ ...p, links: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-300 text-black font-mono font-bold tracking-wider border-2 border-black"
                    placeholder="IG / website / refs"
                    maxLength={300}
                  />
                </div>
              </div>

              {/* MESSAGE */}
              <div>
                <label className="block mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                  Message
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-300 text-black font-mono font-bold tracking-wider border-2 border-black min-h-[140px] resize-none"
                  placeholder="What are you looking for? Include timelines, expectations, deliverables."
                  minLength={10}
                  maxLength={5000}
                  required
                />
              </div>

              {/* SUBMIT */}
              <motion.button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  void handleSubmit();
                }}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="w-full px-6 py-4 border-2 border-black bg-[#FFD700] text-black font-mono font-bold uppercase tracking-[0.2em] hover:bg-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? "TRANSMITTING..." : "Send Inquiry"}
              </motion.button>

              {/* RESULT */}
              {submitStatus === "success" && (
                <div className="border-2 border-[#FFD700] bg-[#FFD700]/10 p-4">
                  <div className="font-black italic uppercase">✓ Transmission Secure</div>
                  <div className="text-sm text-white/70 mt-1">
                    We received your message. If this is time-sensitive, include a date + budget + capacity next time.
                  </div>
                  {CALENDAR_URL && (
                    <a
                      href={CALENDAR_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 px-4 py-3 border-2 border-black bg-[#FFD700] text-black hover:bg-[#E0E0E0] font-mono text-xs uppercase tracking-[0.2em]"
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule a Call
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {submitStatus === "error" && (
                <div className="border-2 border-red-600 bg-red-600/10 p-4">
                  <div className="font-black italic uppercase">✗ Signal Lost</div>
                  <div className="text-sm text-red-200 mt-1">{errorMessage || "Please try again."}</div>
                </div>
              )}

              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/50">
                This form emails the team via `/api/send-email` (rate limited).
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.25em] text-white/60">NEXT_STEP</div>
            <div className="text-2xl font-black italic uppercase">Want the best pitch?</div>
            <div className="text-sm text-white/70">
              Use the template: date • city • capacity • budget • set length • tech needs.
            </div>
          </div>
          <Link
            href="/music"
            className="px-5 py-4 border-2 border-white/15 bg-black/40 hover:bg-white/10 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em]"
          >
            <Music className="w-4 h-4" />
            Listen First
          </Link>
        </div>
      </section>
    </div>
  );
}

