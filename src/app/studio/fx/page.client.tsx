"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FXPresetEditor } from "@/components/studio/FXPresetEditor";
import TimelineOverlay from "@/components/studio/timeline/TimelineOverlay";
import { FXSessionRecorder } from "@/components/studio/fx/FXSessionRecorder";
import { useUIStore } from "@/store/useUIStore";

/**
 * Studio FX Page Client - Labs-gated FX preset editor
 *
 * Features:
 * - FX parameter control (delay, reverb, filter)
 * - Preset management (save/load/delete)
 * - Timeline player for automation
 * - Deck selection (A/B)
 *
 * Access: Requires Labs mode to be enabled
 */
export default function FXPageClient() {
  const router = useRouter();
  const labs = useUIStore((s) => s.labsEnabled);

  useEffect(() => {
    if (!labs) router.replace("/studio");
  }, [labs, router]);

  if (!labs) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <p className="text-lg">Labs mode required</p>
          <p className="text-sm text-white/60 mt-2">Redirecting...</p>
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
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/70">
            Labs Feature
          </div>
          <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl">
            FX Preset Editor
          </h1>
          <p className="text-white/70 text-base sm:text-lg">
            Create, save, and automate FX presets for your mixes.
          </p>
        </div>

        <FXPresetEditor />

        {/* Floating Timeline Overlay */}
        <TimelineOverlay />

        {/* Session Recorder */}
        <FXSessionRecorder />
      </div>
    </main>
  );
}
