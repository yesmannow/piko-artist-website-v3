"use client";

/**
 * OrientationCoach - First-visit overlay explaining mobile orientation behavior
 *
 * Phase 1: Performance Surface Layout
 *
 * Shows once per browser session to teach users:
 * - Landscape = Performance mode (full mixer controls)
 * - Portrait = Pocket mode (tab-based views)
 *
 * Dismisses after 5 seconds or on user interaction
 */

import { useState, useEffect, useCallback } from 'react';
import { Smartphone, MonitorSmartphone } from 'lucide-react';
import { useMediaQuery } from '@/hooks/ui/useMediaQuery';

const COACH_STORAGE_KEY = 'studio_orientation_coach_seen';

export function OrientationCoach() {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    sessionStorage.setItem(COACH_STORAGE_KEY, 'true');
  }, []);

  useEffect(() => {
    // Only show on mobile devices
    if (!isMobile) return;

    // Check if already seen this session
    const hasSeenCoach = sessionStorage.getItem(COACH_STORAGE_KEY);
    if (hasSeenCoach) return;

    // Show after short delay to avoid flash
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    // Auto-dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, 6000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [isMobile, handleDismiss]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleDismiss}
      role="dialog"
      aria-label="Orientation guide"
    >
      <div className="mx-4 max-w-sm space-y-6 rounded-xl border border-white/20 bg-linear-to-br from-[#1a1a2e] to-[#0f0f1e] p-6 shadow-2xl">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">
            Mobile Studio Modes
          </h2>
          <p className="mt-1 text-sm text-white/60">
            Rotate your device for best experience
          </p>
        </div>

        {/* Mode Cards */}
        <div className="space-y-4">
          {/* Landscape Mode */}
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="shrink-0 rounded-lg bg-emerald-500/20 p-2">
              <MonitorSmartphone className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Landscape</h3>
              <p className="mt-1 text-sm text-white/70">
                Full mixer + dual decks
                <br />
                <span className="text-xs text-emerald-400">→ Performance Mode</span>
              </p>
            </div>
          </div>

          {/* Portrait Mode */}
          <div className="flex items-start gap-3 rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
            <div className="shrink-0 rounded-lg bg-purple-500/20 p-2">
              <Smartphone className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Portrait</h3>
              <p className="mt-1 text-sm text-white/70">
                Tabs: Decks | Mixer | Library
                <br />
                <span className="text-xs text-purple-400">→ Pocket Mode</span>
              </p>
            </div>
          </div>
        </div>

        {/* Dismiss Hint */}
        <p className="text-center text-xs text-white/40">
          Tap anywhere to dismiss
        </p>
      </div>
    </div>
  );
}
