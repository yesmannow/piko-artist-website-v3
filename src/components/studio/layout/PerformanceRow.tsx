"use client";

/**
 * PerformanceRow - Middle Performance Controls & Mixer
 *
 * 3-Column Layout:
 * - Left: Deck A Controls (Jog Wheel, Transport, StemRack) + Per-Deck FX
 * - Center: Mixer (EQ, Faders, Level Meters)
 * - Right: Deck B Controls (Jog Wheel, Transport, StemRack) + Per-Deck FX
 *
 * Professional DJ layout with tactile hardware-emulated controls
 * Phase V-B: Added per-deck FX racks for independent effect processing
 * Phase 3.2A: Added drag & drop zones for track loading
 * Phase 3: FX moved to deck-level controls (removed master FX rack)
 */

import { DeckControls } from "@/components/studio/ui/DeckControls";
import { DeckFXRack } from "@/components/studio/core/DeckFXRack";
import { DeckDropZone } from "@/components/studio/ui/DeckDropZone";
import { MixerCenter } from "./MixerCenter";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useStore } from "@/store/useStore";
import { useStudioStore } from "@/store/useStudioStore";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { deriveTrackKey } from "@/lib/trackKey"; // Phase S11.2

export function PerformanceRow() {
  const { loadTrack } = useAudioEngine();
  const { setDeckTrack } = useStore();
  const setStems = useStudioStore((state) => state.setStems);
  const markStemsReady = useStudioStore((state) => state.markStemsReady);

  // Live query tracks from IndexedDB for drop resolution
  const dbTracks = useLiveQuery(
    () => db.tracks.toArray(),
    []
  );

  const handleDropTrack = async (deckId: 'A' | 'B', trackId: string) => {
    // Find the track in IndexedDB
    const dbTrack = dbTracks?.find(t => t.url === trackId || t.title === trackId);
    if (!dbTrack) {
      console.error(`[PerformanceRow] Track not found: ${trackId}`);
      return;
    }

    try {
      // Normalize URL (same logic as TrackListing)
      const normalizeFileName = (value: string) => {
        const trimmed = value.replace(/\\/g, '/').split('/').pop() || '';
        const noPrefix = trimmed.replace(/^audio\/tracks\//i, '');
        return noPrefix.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
      };

      const safeFile = normalizeFileName(dbTrack.url);
      const url = `/audio/tracks/${safeFile}`;
      const emptyStems = { vocals: null, drums: null, bass: null, other: null };

      // Load track into audio engine (SAME PATH AS BUTTON CLICK)
      await loadTrack(deckId, url, dbTrack.bpm || 120);

      // Update store with track data
      setDeckTrack(deckId, {
        trackKey: deriveTrackKey(dbTrack), // Phase S11.2: Canonical track identity
        trackId: dbTrack.url, // DEPRECATED: Kept for backward compatibility
        url,
        bpm: dbTrack.bpm || 120,
        title: dbTrack.title,
        artist: dbTrack.artist,
        artUrl: dbTrack.artwork,
        cover: dbTrack.artwork,
        key: dbTrack.key,
        energy: dbTrack.energy || 0.5,
        stems: dbTrack.stemUrls ? {
          full: dbTrack.url,
          vocals: dbTrack.stemUrls[0],
          drums: dbTrack.stemUrls[1],
          other: dbTrack.stemUrls[2],
        } : undefined,
        colorTheme: {
          primary: '#9333ea',
          secondary: '#06b6d4',
        },
      });

      setStems(deckId, emptyStems);
      markStemsReady(dbTrack.url, false);

      console.log(`[PerformanceRow] Loaded ${dbTrack.title} on Deck ${deckId} via drag/drop`);
    } catch (error) {
      console.error(`[PerformanceRow] Failed to load track on Deck ${deckId}:`, error);
      alert(`Failed to load track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  return (
    <section
      className="grid gap-3 p-3 border-b border-white/5 h-full min-h-0 overflow-hidden w-full max-w-studio mx-auto"
      style={{
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 420px) minmax(320px, 1fr)',
      }}
      aria-label="Performance Controls"
    >
      {/* Left Column: Deck A Controls + FX */}
      <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
        <DeckDropZone deckId="A" onDropTrackId={(trackId) => handleDropTrack('A', trackId)}>
          <div className="min-h-0 overflow-y-auto">
            <DeckControls deckId="A" />
            <DeckFXRack deckId="A" />
          </div>
        </DeckDropZone>
      </div>

      {/* Center Column: Mixer (Slightly Elevated) */}
      <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
        <div className="min-h-0 overflow-y-auto bg-(--bg-secondary) rounded-lg border border-white/5 p-4 shadow-lg">
          <MixerCenter />
        </div>
      </div>

      {/* Right Column: Deck B Controls + FX */}
      <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
        <DeckDropZone deckId="B" onDropTrackId={(trackId) => handleDropTrack('B', trackId)}>
          <div className="min-h-0 overflow-y-auto">
            <DeckControls deckId="B" />
            <DeckFXRack deckId="B" />
          </div>
        </DeckDropZone>
      </div>
    </section>
  );
}
