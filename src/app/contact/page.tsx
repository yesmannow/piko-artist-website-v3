"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Heart,
  MapPin,
  MessageSquare,
  Mic,
  Music2,
  Send,
  Zap,
} from "lucide-react";
import { Contact } from "@/components/content/Contact";

const quickActions = [
  {
    label: "Start a Collab",
    href: "/contact?type=collab",
    icon: Zap,
    description: "Exchange stems, build verses, and lock in timelines.",
  },
  {
    label: "Request a Feature",
    href: "/contact?type=feature",
    icon: Mic,
    description: "Book a verse, hooks, or ad-libs for your next drop.",
  },
  {
    label: "Beat / Production",
    href: "/contact?type=production",
    icon: Music2,
    description: "Custom beats, sound design, and arrangement support.",
  },
];

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

const vibeOptions: { value: GuestbookEntry["vibe"]; label: string }[] = [
  { value: "fire", label: "Fire" },
  { value: "hype", label: "Hype" },
  { value: "chill", label: "Chill" },
  { value: "real", label: "Real" },
];

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

function GuestbookWidget() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [form, setForm] = useState({
    name: "",
    location: "",
    message: "",
    vibe: "fire" as GuestbookEntry["vibe"],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("piko-guestbook");
      if (raw) setEntries(JSON.parse(raw));
    } catch {}

    const handleStorage = () => {
      try {
        const raw = localStorage.getItem("piko-guestbook");
        if (raw) setEntries(JSON.parse(raw));
      } catch {}
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const latest = useMemo(() => entries.slice(0, 5), [entries]);

  const saveEntries = (next: GuestbookEntry[]) => {
    localStorage.setItem("piko-guestbook", JSON.stringify(next));
    setEntries(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return;
    setSubmitting(true);
    const newEntry: GuestbookEntry = {
      id: Date.now().toString(),
      name: form.name.trim(),
      location: form.location.trim() || "Unknown",
      message: form.message.trim(),
      timestamp: Date.now(),
      likes: 0,
      vibe: form.vibe,
    };
    saveEntries([newEntry, ...entries]);
    setForm({ name: "", location: "", message: "", vibe: "fire" });
    setSubmitting(false);
  };

  return (
    <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/60">
            Guestbook
          </p>
          <h3 className="text-2xl font-black text-white">
            Sign & Leave a Note
          </h3>
          <p className="text-white/60 text-sm">
            Entries save locally and sync with the main guestbook.
          </p>
        </div>
        <Link
          href="/guestbook"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
        >
          <MessageSquare className="h-4 w-4" /> View All
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Name"
              required
              className="rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder:text-white/40 focus:border-[#c1ff00] focus:outline-none"
            />
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
              placeholder="Location"
              className="rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder:text-white/40 focus:border-[#c1ff00] focus:outline-none"
            />
          </div>
          <textarea
            name="message"
            value={form.message}
            onChange={(e) =>
              setForm((f) => ({ ...f, message: e.target.value }))
            }
            placeholder="Drop your message"
            required
            rows={4}
            className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder:text-white/40 focus:border-[#c1ff00] focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            {vibeOptions.map((option) => {
              const active = form.vibe === option.value;
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setForm((f) => ({ ...f, vibe: option.value }))}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                    active
                      ? "border-[#c1ff00] bg-[#c1ff00]/20 text-white"
                      : "border-white/15 bg-white/5 text-white/70"
                  }`}
                >
                  {vibeEmojis[option.value]} {option.label}
                </button>
              );
            })}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-[#c1ff00] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black shadow-[0_10px_30px_rgba(193,255,0,0.35)] disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Sending" : "Sign Guestbook"}
          </button>
        </form>

        <div className="space-y-3">
          {latest.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-white/70">
              No signatures yet. Be the first.
            </div>
          ) : (
            latest.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-white/10 bg-black/40 p-4 text-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden>
                      {vibeEmojis[entry.vibe]}
                    </span>
                    <div>
                      <p className="font-semibold">{entry.name}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/60">
                        {entry.location || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs uppercase tracking-[0.18em] text-white/60">
                    {timeAgo(entry.timestamp)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/80">{entry.message}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/60">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {entry.location || "Unknown"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {timeAgo(entry.timestamp)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" /> {entry.likes}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default function ContactPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] pb-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(193,255,0,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.16),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(34,211,238,0.12),transparent_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:120px_120px]" />
      </div>

      <section className="px-4 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6 rounded-3xl border border-white/10 bg-gradient-to-br from-black/70 via-black/50 to-black/70 p-6 sm:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/70">
            Syndicate Channel
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl">
              Book / Collab / Connect
            </h1>
            <p className="text-white/70 text-base sm:text-lg">
              Choose your lane, lock the details, and we will reply with next
              steps and availability.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-[#c1ff00]/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#c1ff00]">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {action.label}
                    </p>
                    <p className="text-xs text-white/60">
                      Tap to pre-fill form
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-white/60">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-white/60">
              Booking & Contact
            </p>
            <h2 className="text-2xl font-black text-white">
              Project Intake Form
            </h2>
            <p className="text-white/60 text-sm">
              Submit a collab, feature, or production request. We respond via
              email with availability and rate cards.
            </p>
          </div>
          <Contact />
        </div>
      </section>

      <section className="mt-10 px-4 sm:px-6 lg:px-8">
        <GuestbookWidget />
      </section>
    </main>
  );
}
