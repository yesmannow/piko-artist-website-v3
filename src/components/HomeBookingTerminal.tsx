"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Download, ExternalLink, Mail, Sparkles } from "lucide-react";

const PRESS_TEASER = [
  { src: "/images/artist/bio-portrait.jpg", label: "BIO" },
  { src: "/images/artist/portrait-close.jpg", label: "PORTRAIT" },
  { src: "/images/artist/studio-mic.jpg", label: "STUDIO" },
];

type Inquiry = "booking" | "collab" | "press" | "licensing";

const INQUIRIES: { type: Inquiry; title: string; hint: string }[] = [
  { type: "booking", title: "BOOKING", hint: "DATE • CITY • CAPACITY • BUDGET" },
  { type: "collab", title: "COLLAB", hint: "LINKS • DEADLINE • DELIVERABLES" },
  { type: "press", title: "PRESS", hint: "OUTLET • ANGLE • PUBLISH DATE" },
  { type: "licensing", title: "LICENSING", hint: "USAGE • TERRITORY • TERM" },
];

export function HomeBookingTerminal() {
  const calendarUrl = process.env.NEXT_PUBLIC_BOOKING_CALENDAR_URL || "";

  return (
    <section className="relative py-12 md:py-20 px-4 md:px-8 overflow-hidden border-t-2 border-[#E0E0E0]/10 bg-[#050505]">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/images/bg/graffiti-wall-1.jpg"
          alt=""
          fill
          className="object-cover opacity-30"
          priority={false}
        />
        <div className="absolute inset-0 bg-black/85" />
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(224,224,224,0.08) 0px, rgba(224,224,224,0.08) 1px, transparent 2px, transparent 4px)",
            mixBlendMode: "overlay",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 md:mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black bg-[#FFD700] text-black font-mono text-[10px] uppercase tracking-[0.25em]">
            BOOKING_TERMINAL
          </div>
          <h2 className="mt-4 text-4xl md:text-6xl font-black italic uppercase text-[#E0E0E0]">
            Contact & Booking Hub
          </h2>
          <p className="mt-3 max-w-3xl text-[#E0E0E0]/70 font-industrial">
            The old “contact form” is gone. This is a business-first hub with EPK assets, proof, and a pre-qual booking
            workflow.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-10 items-start">
          {/* Left: CTA + quick assets */}
          <div className="border-2 border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="p-4 md:p-5 border-b border-white/10 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-[0.25em] text-white/60">FAST_ACTIONS</div>
                <div className="text-2xl font-black italic uppercase">Start here</div>
                <div className="text-sm text-white/70">
                  Promoters: hit the hub and you’ll have everything you need in one page.
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">
                <Sparkles className="w-4 h-4" />
                2026 FLOW
              </div>
            </div>

            <div className="p-4 md:p-5 flex flex-col gap-3">
              <Link
                href="/contact"
                className="px-6 py-4 border-2 border-black bg-[#FFD700] text-black hover:bg-[#E0E0E0] inline-flex items-center justify-center gap-2 font-mono font-bold uppercase tracking-[0.2em]"
              >
                <Mail className="w-4 h-4" />
                Open Contact Hub
              </Link>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {calendarUrl ? (
                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-4 border-2 border-white/15 bg-black/40 hover:bg-white/10 inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.2em]"
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <div
                    className="px-5 py-4 border-2 border-white/15 bg-black/30 text-white/50 inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.2em]"
                    title="Set NEXT_PUBLIC_BOOKING_CALENDAR_URL to enable"
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule
                  </div>
                )}

                <a
                  href="/images/artist/bio-portrait.jpg"
                  download
                  className="px-5 py-4 border-2 border-white/15 bg-black/40 hover:bg-white/10 inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.2em]"
                >
                  <Download className="w-4 h-4" />
                  Press Photo
                </a>
              </div>

              {/* Small collage strip */}
              <div className="mt-2 overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 min-w-[520px]">
                  {PRESS_TEASER.map((p, idx) => (
                    <div
                      key={p.src}
                      className="w-[160px] border-2 border-black bg-black/30"
                      style={{
                        boxShadow: "6px 6px 0px rgba(0,0,0,1)",
                        transform: `rotate(${idx === 1 ? 1.1 : -0.9}deg)`,
                      }}
                    >
                      {/* Use explicit height to avoid any aspect-ratio/auto-sizing edge cases */}
                      <div className="relative w-full h-[200px]">
                        <Image
                          src={p.src}
                          alt={p.label}
                          fill
                          className="object-cover"
                          style={{ filter: "contrast(1.15) grayscale(0.15) brightness(0.92)" }}
                        />
                      </div>
                      <div className="px-3 py-2 bg-[#E0E0E0] text-black border-t-2 border-black">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] truncate">
                          {p.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: inquiry router bento */}
          <div className="border-2 border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="p-4 md:p-5 border-b border-white/10">
              <div className="text-xs font-mono uppercase tracking-[0.25em] text-white/60">INQUIRY_ROUTER</div>
              <div className="text-2xl font-black italic uppercase">Pick your lane</div>
              <div className="text-sm text-white/70">
                Booking, collab, press, licensing—each route lands on the right section in the hub.
              </div>
            </div>
            <div className="p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INQUIRIES.map((q) => (
                <Link
                  key={q.type}
                  href={`/contact?inquiry=${q.type}#form`}
                  className="p-4 border-2 border-white/10 hover:border-white/20 bg-black/30 hover:bg-white/5 transition-all"
                  style={{ boxShadow: "6px 6px 0px rgba(0,0,0,1)" }}
                >
                  <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/60">{q.hint}</div>
                  <div className="mt-1 text-xl font-black italic uppercase text-white">{q.title}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

