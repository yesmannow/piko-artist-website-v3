"use client";

/**
 * StudioGrid - Phase 5: Mobile Landscape Workstation + Portrait Pocket Tabs
 *
 * Professional DJ mixer layout based on CDJ/DJM setup:
 *
 * DESKTOP (≥768px / Pro Mode):
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Row 1: Dual Waveforms + Rhythm Stripe (beatmatching focus) │ Fixed 140px
 * ├─────────────────────────────────────────────────────────────┤
 * │ Row 2: Deck A | Mixer Center | Deck B (hardware layout)    │ Flex-1
 * ├─────────────────────────────────────────────────────────────┤
 * │ Row 3: Library (search + load + drag/drop)                 │ Fixed 280px or 48px collapsed
 * └─────────────────────────────────────────────────────────────┘
 *
 * MOBILE LANDSCAPE (<768px, landscape):
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Row 1: Compact Waveforms                                    │ Fixed 96px
 * ├─────────────────────────────────────────────────────────────┤
 * │ Row 2: Deck A | Mixer | Deck B (condensed)                 │ Flex-1
 * ├─────────────────────────────────────────────────────────────┤
 * │ Row 3: Library (latched, collapsed)                        │ Fixed 48px or 220px
 * └─────────────────────────────────────────────────────────────┘
 *
 * MOBILE PORTRAIT (<768px, portrait):
 * - Tab-based view switcher (DECKS | MIXER | LIBRARY)
 * - Single active view at a time (Pocket Studio)
 * - Swipe between decks in DECKS view
 *
 * KEY FEATURES:
 * - Zero vertical scrolling (locked viewport)
 * - Mixer always visible and centered
 * - Symmetrical deck layout (muscle memory)
 * - Library scrolls internally (not page)
 * - State preserved across rotation
 *
 * Design Philosophy: djay/VirtualDJ inspired
 * - Ergonomics over gimmicks
 * - View modes / progressive disclosure
 * - Modular architecture (skins/add-ons)
 */

import type * as Tone from "tone";
import { useState, useEffect } from "react";
import { DeckWaveformWS } from "@/components/studio/deck/DeckWaveformWS"; // Phase 6: WaveSurfer integration
import { PerformanceRow } from "./PerformanceRow";
import { LibraryRow } from "./LibraryRow";
import { useStudioStore } from "@/store/useStudioStore";
import { useMobileLandscape } from "@/hooks/ui/useMobileLandscape";
import { MobileLandscapeWorkstation } from "./MobileLandscapeWorkstation";
import { MobilePortraitPocketStudio } from "./MobilePortraitPocketStudio";
import { Zap, Layout } from "lucide-react";

interface StudioGridProps {
  readonly masterBus?: Tone.Gain | null;
  readonly masterPostFx?: Tone.Gain | null;
  readonly masterProgress: number;
}

type MobileTab = 'DECKS' | 'MIXER' | 'LIBRARY';

export function StudioGrid({ masterBus: _masterBus, masterPostFx: _masterPostFx, masterProgress }: Readonly<StudioGridProps>) {
  const libraryOpen = useStudioStore((state) => state.libraryOpen);
  const setLibraryOpen = useStudioStore((state) => state.setLibraryOpen);
  const settingsOpen = useStudioStore((state) => state.settingsOpen);
  const layoutMode = useStudioStore((state) => state.layoutMode);
  const setLayoutMode = useStudioStore((state) => state.setLayoutMode);
  const [mobileTab, setMobileTab] = useState<MobileTab>('DECKS');

  // Phase 5: Detect mobile landscape mode
  const { isMobileLandscape } = useMobileLandscape(300);

  // Clamp progress for UI display (0-1 range)
  const progressClamped = Math.max(0, Math.min(1, masterProgress ?? 0));

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[StudioGrid] progress percent", Math.round(progressClamped * 100));
    }
  }, [progressClamped]);

  // Desktop keyboard shortcuts for library drawer
  useEffect(() => {
    const isEditableTarget = () => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (el.isContentEditable) return true;
      return false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // desktop only
      if (globalThis.window === undefined) return;
      console.debug("[StudioGrid] window width", globalThis.window?.innerWidth);
      if ((globalThis.window?.innerWidth ?? 0) < 768) return;

      // don't steal input typing
      if (isEditableTarget()) return;

      // don't fight other overlays
      if (settingsOpen) return;

      // ignore modified shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // L toggles library
      if (e.code === "KeyL") {
        e.preventDefault();
        setLibraryOpen(!libraryOpen);
        return;
      }

      // Esc closes if open
      if (e.key === "Escape" && libraryOpen) {
        e.preventDefault();
        setLibraryOpen(false);
      }
    };

    if (globalThis.window === undefined) {
      return undefined;
    }

    console.debug("[StudioGrid] keydown listener attached");
    globalThis.window.addEventListener("keydown", onKeyDown);
    return () => globalThis.window?.removeEventListener("keydown", onKeyDown);
  }, [libraryOpen, setLibraryOpen, settingsOpen]);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          DESKTOP PRO: Fixed 3-Row Workstation (md+) - ZERO PAGE SCROLL
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="hidden md:grid fixed inset-0 h-dvh w-screen overflow-hidden"
        style={{
          gridTemplateRows: '140px 1fr auto',
          background: '#0a0a0c',
        }}
      >
        {/* Surveillance Grid Overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(0,242,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
            zIndex: 0,
            animation: 'surveillance-drift 120s linear infinite',
          }}
        />

        {/* ─────────────────────────────────────────────────────────────────
            ROW 1: WAVEFORMS & RHYTHM STRIPE (Beatmatching Focus)
            Phase 6: Using WaveSurfer for visuals-only rendering
            ───────────────────────────────────────────────────────────────── */}
        <section
          className={`flex gap-3 p-3 border-b min-h-0 overflow-hidden transition-all duration-500`}
          style={{
            borderBottomColor: 'rgba(0,242,255,0.06)',
            height: layoutMode === 'Performance' ? '100px' : '140px',
          }}
          aria-label="Deck Waveforms"
        >
          {/* Performance Mode Toggle (Floating) */}
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <button
              onClick={() => setLayoutMode(layoutMode === 'Performance' ? 'Library-Heavy' : 'Performance')}
              className={`flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 ${layoutMode === 'Performance' ? 'text-[#00F2FF]' : 'text-white/40'
                }`}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: 'rgba(15,15,20,0.7)',
                boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.8)',
                border: `1px solid ${layoutMode === 'Performance' ? 'rgba(0,242,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                letterSpacing: '0.15em',
              }}
            >
              {layoutMode === 'Performance' ? <Zap size={12} fill="currentColor" /> : <Layout size={12} />}
              {layoutMode} MODE
            </button>
          </div>

          {/* Deck A Waveform */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.2em',
              color: 'rgba(226,232,240,0.4)',
              textTransform: 'uppercase',
              padding: '0 8px',
            }}>
              DECK A
            </div>
            <div className="flex-1 min-h-0">
              <DeckWaveformWS deckId="A" />
            </div>
          </div>

          {/* Deck B Waveform */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.2em',
              color: 'rgba(226,232,240,0.4)',
              textTransform: 'uppercase',
              padding: '0 8px',
            }}>
              DECK B
            </div>
            <div className="flex-1 min-h-0">
              <DeckWaveformWS deckId="B" />
            </div>
          </div>
        </section>

        {/* Global Transport / Progress Strip */}
        {layoutMode !== 'Performance' && (
          <div className="hidden md:block px-3 py-2 bg-black/20 animate-in fade-in slide-in-from-top-1 duration-500"
            style={{ borderBottom: '1px solid rgba(0,242,255,0.06)' }}
          >
            <progress
              className="sr-only"
              value={Math.round(progressClamped * 100)}
              max={100}
              aria-label="Master progress"
            />
            <div
              className="relative h-1.5 overflow-hidden"
              style={{
                background: 'rgba(0,242,255,0.05)',
                border: '1px solid rgba(0,242,255,0.08)',
              }}
              aria-hidden="true"
            >
              {/* Progress fill */}
              <div
                className="h-full transition-[width] duration-100 ease-linear"
                style={{
                  width: `${progressClamped * 100}%`,
                  background: 'linear-gradient(90deg, #00f2ff, #a855f7)',
                }}
              />
              {/* Playhead marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5"
                style={{
                  left: `${progressClamped * 100}%`,
                  background: '#e2e8f0',
                  boxShadow: '0 0 6px rgba(226,232,240,0.6)',
                }}
              />
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            ROW 2: PERFORMANCE CONTROLS — Accordion Layout
            Scales from 1.0 → 1.25 when library is minimized
            ───────────────────────────────────────────────────────────────── */}
        <div
          className="min-h-0 overflow-hidden"
          style={{
            transform: (!libraryOpen && layoutMode !== 'Performance') ? 'scale(1.02)' : 'scale(1)',
            transformOrigin: 'center center',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <PerformanceRow />
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            ROW 3: LIBRARY & BROWSER (Collapsible with Smooth Transition)
            ───────────────────────────────────────────────────────────────── */}
        <div
          className={`min-h-0 overflow-hidden transition-all duration-500 ease-out ${layoutMode === 'Performance' ? 'h-0 opacity-0' : (libraryOpen ? 'h-70 opacity-100' : 'h-12 opacity-100')
            }`}
        >
          <LibraryRow />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE: Adaptive Layout - Landscape Workstation or Portrait Tabs
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden">
        {isMobileLandscape ? (
          <MobileLandscapeWorkstation />
        ) : (
          <MobilePortraitPocketStudio
            initialTab={mobileTab}
            onTabChange={setMobileTab}
          />
        )}
      </div>
    </>
  );
}

