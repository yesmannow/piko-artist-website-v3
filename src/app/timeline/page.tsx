"use client";

import Link from "next/link";
import { ArrowLeft, LayoutTemplate } from "lucide-react";
import { TimelineEditor } from "@/components/studio/timeline/TimelineEditor";
import { GhostDeck } from "@/components/ghost/GhostDeck";
import { useUIStore } from "@/store/useUIStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TimelinePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const labsEnabled = useUIStore((state) => state.labsEnabled);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Guard: only allow when Labs is enabled (client-side check)
  useEffect(() => {
    if (mounted && !labsEnabled) {
      router.replace("/");
    }
  }, [mounted, labsEnabled, router]);

  if (!mounted || !labsEnabled) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#050505] pb-16 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] pb-16 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(193,255,0,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.16),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(34,211,238,0.12),transparent_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:120px_120px]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:border-[#c1ff00]/40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Studio
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white/70">
            <LayoutTemplate className="h-4 w-4 text-[#c1ff00]" />
            Timeline Sync
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black leading-tight sm:text-4xl">
            Ghost Deck Timeline
          </h1>
          <p className="text-white/70 text-sm sm:text-base">
            Drag tracks into the timeline, plan transitions, and visualize
            upcoming blends with the Ghost Deck preview.
          </p>
        </div>

        <GhostDeck />
        <TimelineEditor />
      </div>
    </main>
  );
}
