"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Contact } from "@/components/Contact";
import GuestbookPreview from "@/components/guestbook/GuestbookPreview";
import { Zap, Mic, Music2 } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#050505] pt-24">
      {/* Hero */}
      <section className="relative py-14 md:py-20 border-b-4 border-[#FFD700] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255, 215, 0, 0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 215, 0, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black font-mono text-xs uppercase tracking-wider mb-5 border-2 border-black"
            style={{ boxShadow: "4px 4px 0px #000" }}
          >
            Syndicate Channel
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl md:text-6xl font-black italic text-white mb-4"
            style={{ fontFamily: "var(--font-lexend), system-ui, sans-serif" }}
          >
            Book / Collab / Connect
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white/70 max-w-2xl mb-8"
          >
            Looking to bring heat to your record, lock a set, or build something wild? Pick your lane and drop the details.
          </motion.p>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact?type=collab"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black uppercase tracking-wider text-xs transition-colors"
            >
              <Zap className="w-4 h-4" /> Start a Collab Request
            </Link>
            <Link
              href="/contact?type=feature"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black uppercase tracking-wider text-xs transition-colors"
            >
              <Mic className="w-4 h-4" /> Request a Feature
            </Link>
            <Link
              href="/contact?type=production"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black uppercase tracking-wider text-xs transition-colors"
            >
              <Music2 className="w-4 h-4" /> Beat / Production
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <div className="relative">
        <Contact />
      </div>

      {/* Guestbook Preview */}
      <GuestbookPreview />
    </main>
  );
}
