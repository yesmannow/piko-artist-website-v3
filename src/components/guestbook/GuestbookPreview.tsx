"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, MapPin, Clock, Heart } from "lucide-react";

interface GuestbookEntry {
  id: string;
  name: string;
  location: string;
  message: string;
  timestamp: number;
  likes: number;
  vibe: "fire" | "chill" | "hype" | "real";
}

const vibeEmojis: Record<GuestbookEntry["vibe"], string> = {
  fire: "🔥",
  chill: "😎",
  hype: "⚡",
  real: "💯",
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export function GuestbookPreview() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("piko-guestbook");
      if (raw) setEntries(JSON.parse(raw));
    } catch {}
  }, []);

  const latest = useMemo(() => entries.slice(0, 6), [entries]);

  return (
    <section className="relative py-16 md:py-24 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className="px-3 py-1 bg-[#FFD700] text-black font-mono text-[11px] uppercase border-2 border-black"
              style={{ boxShadow: "4px 4px 0 #000" }}
            >
              Community
            </div>
            <h2
              className="text-2xl md:text-4xl font-black italic text-white"
              style={{
                fontFamily: "var(--font-lexend), system-ui, sans-serif",
              }}
            >
              Latest Signatures
            </h2>
          </div>
          <Link
            href="/guestbook"
            className="px-4 py-2 text-sm font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
          >
            Read All
          </Link>
        </div>

        {latest.length === 0 ? (
          <div className="text-center py-12 text-white/70">
            <p className="mb-6 text-lg">
              No signatures yet. Be the first to drop a line.
            </p>
            <Link
              href="/guestbook"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#FFD700] text-black font-black uppercase tracking-wider border-2 border-black"
              style={{ boxShadow: "6px 6px 0 #000" }}
            >
              <MessageSquare className="w-4 h-4" /> Sign Guestbook
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latest.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group relative p-4 bg-[#0b0b0b] border-2 border-white/10 hover:border-[#FFD700] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden>
                      {vibeEmojis[e.vibe]}
                    </span>
                    <span className="font-black text-white">{e.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/50">
                    <Clock className="w-3.5 h-3.5" /> {timeAgo(e.timestamp)}
                  </div>
                </div>

                <p className="text-white/80 leading-relaxed line-clamp-3 mb-4">
                  {e.message}
                </p>

                <div className="flex items-center justify-between text-xs text-white/50">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="uppercase tracking-wide">
                      {e.location || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" /> {e.likes}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default GuestbookPreview;
