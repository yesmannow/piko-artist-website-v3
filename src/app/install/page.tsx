"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Download,
  Info,
  Sparkles,
  Waves,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export default function InstallPage() {
  const router = useRouter();
  const { installAvailable, isInstalled, triggerInstall } = usePwaInstall();
  const [status, setStatus] = useState<"idle" | "installed" | "fallback">(
    isInstalled ? "installed" : "idle",
  );

  useEffect(() => {
    if (isInstalled) setStatus("installed");
  }, [isInstalled]);

  const handleInstall = async () => {
    const outcome = await triggerInstall();
    if (outcome === "accepted") {
      setStatus("installed");
    } else if (outcome === "unavailable") {
      setStatus("fallback");
      router.push("/install#manual");
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white pb-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(193,255,0,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.16),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(34,211,238,0.12),transparent_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:120px_120px]" />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pt-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 hover:border-[#c1ff00]/40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 hover:border-[#c1ff00]/40"
          >
            <Waves className="h-4 w-4" />
            Launch Studio
          </Link>
        </div>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/70">
              <Sparkles className="h-3.5 w-3.5 text-[#c1ff00]" />
              Install Piko DJ
            </span>
            {status === "installed" ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                <Check className="h-3.5 w-3.5" /> Installed
              </span>
            ) : null}
          </div>
          <h1 className="text-3xl font-black leading-tight sm:text-4xl">
            Add the PWA for one-tap Studio access
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-2xl">
            Get offline stems, faster boot, and direct access to Studio, Music,
            and Videos from your home screen. If your browser supports the
            install prompt, we will trigger it below—otherwise follow the quick
            steps in the manual section.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex items-center gap-2 rounded-full bg-[#c1ff00] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black shadow-[0_10px_40px_rgba(193,255,0,0.3)] hover:brightness-110"
            >
              <Download className="h-4 w-4" />
              {installAvailable ? "Install App" : "Check Install Options"}
            </button>
            <Link
              href="/music"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em]"
            >
              <Sparkles className="h-4 w-4" />
              Explore Library
            </Link>
          </div>

          {status === "fallback" ? (
            <p className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
              Install prompt not available here. Follow the manual steps below
              to add the app from your browser menu.
            </p>
          ) : null}
          {!installAvailable && !isInstalled && status === "idle" ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              Browser did not expose an install prompt. Use the manual guide
              below or open the app directly.
            </div>
          ) : null}
        </section>

        <section
          id="manual"
          className="grid gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-[#0b0f1c] via-[#0b1224] to-[#0f172a] p-6 sm:grid-cols-2 sm:p-8"
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/70">
              <Info className="h-4 w-4" />
              Manual Install
            </div>
            <h2 className="text-2xl font-black text-white">
              If the prompt doesn't show
            </h2>
            <p className="text-white/65 text-sm">
              iOS Safari: tap <strong>Share</strong> →{" "}
              <strong>Add to Home Screen</strong>. Chrome/Android: tap the menu
              (⋮) → <strong>Install App</strong>.
            </p>
            <p className="text-white/65 text-sm">
              After installing, reopen Piko to jump straight into Studio and
              your library.
            </p>
          </div>
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/60">
              Quick Links
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
              >
                <Waves className="h-4 w-4" />
                Open Studio
              </Link>
              <Link
                href="/videos"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
              >
                <Sparkles className="h-4 w-4" />
                Latest Videos
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
              >
                <Download className="h-4 w-4" />
                Contact
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
