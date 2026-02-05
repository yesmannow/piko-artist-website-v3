/**
 * Phase 5 Batch 4: Tempo Sync Hook
 *
 * React hook for managing deck synchronization state.
 * Handles master/slave relationships and sync operations.
 */

import { useState, useCallback, useMemo } from "react";
import type { BeatGridData } from "@/lib/audio/beatDetection";
import {
  SyncMode,
  TempoRange,
  type MasterDeck,
  type DeckSyncState,
  calculateSync,
  nudgePhase,
  getEffectiveBPM,
  isInSync,
  getSyncStatus,
  isWithinTempoRange,
} from "@/lib/audio/tempoSync";

// ============================================================================
// Hook Interface
// ============================================================================

export interface UseTempoSyncReturn {
  // Master deck control
  masterDeck: MasterDeck;
  setMasterDeck: (deck: MasterDeck) => void;
  toggleMaster: (deckId: "A" | "B") => void; // Click to set as master

  // Deck A state
  deckA: DeckSyncState;
  setDeckASyncMode: (mode: SyncMode) => void;
  setDeckAKeylock: (enabled: boolean) => void;
  setDeckATempoRange: (range: TempoRange) => void;
  toggleDeckASync: () => void; // Quick toggle sync on/off

  // Deck B state
  deckB: DeckSyncState;
  setDeckBSyncMode: (mode: SyncMode) => void;
  setDeckBKeylock: (enabled: boolean) => void;
  setDeckBTempoRange: (range: TempoRange) => void;
  toggleDeckBSync: () => void;

  // Sync operations
  syncDeck: (
    deckId: "A" | "B",
    beatGridA: BeatGridData | null,
    beatGridB: BeatGridData | null,
    currentTimeA: number,
    currentTimeB: number
  ) => { playbackRate: number; seekTime: number | null } | null;

  nudgeDeck: (
    deckId: "A" | "B",
    direction: -1 | 1,
    currentTime: number,
    beatGrid: BeatGridData | null
  ) => number | null;

  // Status
  isSyncEnabled: (deckId: "A" | "B") => boolean;
  getSyncStatusDisplay: (
    deckId: "A" | "B",
    beatGridA: BeatGridData | null,
    beatGridB: BeatGridData | null,
    currentTimeA: number,
    currentTimeB: number
  ) => { label: string; color: string; icon: string };
}

// ============================================================================
// Default State
// ============================================================================

const createDefaultDeckState = (deckId: "A" | "B"): DeckSyncState => ({
  deckId,
  syncMode: SyncMode.OFF,
  isMaster: deckId === "A", // Deck A is master by default
  keylock: true, // Keylock enabled by default
  tempoRange: TempoRange.MEDIUM, // ±16% default
  currentBPM: 0,
  targetBPM: 0,
  phaseOffset: 0,
});

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for tempo sync state and operations
 *
 * @returns Tempo sync controls and operations
 */
export function useTempoSync(): UseTempoSyncReturn {
  // Master deck state
  const [masterDeck, setMasterDeck] = useState<MasterDeck>("A");

  // Deck states
  const [deckA, setDeckA] = useState<DeckSyncState>(createDefaultDeckState("A"));
  const [deckB, setDeckB] = useState<DeckSyncState>(createDefaultDeckState("B"));

  // Update master status when master deck changes
  const updateMasterDeck = useCallback((deck: MasterDeck) => {
    setMasterDeck(deck);
    setDeckA((prev) => ({ ...prev, isMaster: deck === "A" }));
    setDeckB((prev) => ({ ...prev, isMaster: deck === "B" }));
  }, []);

  const toggleMaster = useCallback((deckId: "A" | "B") => {
    updateMasterDeck(deckId);
  }, [updateMasterDeck]);

  // Deck A controls
  const setDeckASyncMode = useCallback((mode: SyncMode) => {
    setDeckA((prev) => ({ ...prev, syncMode: mode }));
  }, []);

  const setDeckAKeylock = useCallback((enabled: boolean) => {
    setDeckA((prev) => ({ ...prev, keylock: enabled }));
  }, []);

  const setDeckATempoRange = useCallback((range: TempoRange) => {
    setDeckA((prev) => ({ ...prev, tempoRange: range }));
  }, []);

  const toggleDeckASync = useCallback(() => {
    setDeckA((prev) => ({
      ...prev,
      syncMode: prev.syncMode === SyncMode.OFF ? SyncMode.BEAT : SyncMode.OFF,
    }));
  }, []);

  // Deck B controls
  const setDeckBSyncMode = useCallback((mode: SyncMode) => {
    setDeckB((prev) => ({ ...prev, syncMode: mode }));
  }, []);

  const setDeckBKeylock = useCallback((enabled: boolean) => {
    setDeckB((prev) => ({ ...prev, keylock: enabled }));
  }, []);

  const setDeckBTempoRange = useCallback((range: TempoRange) => {
    setDeckB((prev) => ({ ...prev, tempoRange: range }));
  }, []);

  const toggleDeckBSync = useCallback(() => {
    setDeckB((prev) => ({
      ...prev,
      syncMode: prev.syncMode === SyncMode.OFF ? SyncMode.BEAT : SyncMode.OFF,
    }));
  }, []);

  // Sync operations
  const syncDeck = useCallback(
    (
      deckId: "A" | "B",
      beatGridA: BeatGridData | null,
      beatGridB: BeatGridData | null,
      currentTimeA: number,
      currentTimeB: number
    ): { playbackRate: number; seekTime: number | null } | null => {
      if (!beatGridA || !beatGridB) return null;

      const slaveState = deckId === "A" ? deckA : deckB;
      const slaveBeatGrid = deckId === "A" ? beatGridA : beatGridB;
      const masterBeatGrid = deckId === "A" ? beatGridB : beatGridA;
      const slaveCurrentTime = deckId === "A" ? currentTimeA : currentTimeB;
      const masterCurrentTime = deckId === "A" ? currentTimeB : currentTimeA;

      const result = calculateSync(
        slaveState,
        slaveBeatGrid,
        masterBeatGrid,
        slaveCurrentTime,
        masterCurrentTime
      );

      return {
        playbackRate: result.playbackRate,
        seekTime: result.seekTime,
      };
    },
    [deckA, deckB]
  );

  const nudgeDeck = useCallback(
    (
      deckId: "A" | "B",
      direction: -1 | 1,
      currentTime: number,
      beatGrid: BeatGridData | null
    ): number | null => {
      if (!beatGrid) return null;

      return nudgePhase(currentTime, beatGrid, direction);
    },
    []
  );

  // Status checks
  const isSyncEnabled = useCallback(
    (deckId: "A" | "B"): boolean => {
      const deck = deckId === "A" ? deckA : deckB;
      return deck.syncMode !== SyncMode.OFF;
    },
    [deckA, deckB]
  );

  const getSyncStatusDisplay = useCallback(
    (
      deckId: "A" | "B",
      beatGridA: BeatGridData | null,
      beatGridB: BeatGridData | null,
      currentTimeA: number,
      currentTimeB: number
    ): { label: string; color: string; icon: string } => {
      const slaveState = deckId === "A" ? deckA : deckB;

      if (!beatGridA || !beatGridB) {
        return {
          label: "No Beatgrid",
          color: "var(--studio-gray-500)",
          icon: "⚠",
        };
      }

      // Calculate phase offset for status
      const slaveBeatGrid = deckId === "A" ? beatGridA : beatGridB;
      const masterBeatGrid = deckId === "A" ? beatGridB : beatGridA;
      const phaseOffset = 0; // Simplified - would need getPhaseOffset() call

      return getSyncStatus(slaveState, phaseOffset);
    },
    [deckA, deckB]
  );

  return {
    // Master deck control
    masterDeck,
    setMasterDeck: updateMasterDeck,
    toggleMaster,

    // Deck A state
    deckA,
    setDeckASyncMode,
    setDeckAKeylock,
    setDeckATempoRange,
    toggleDeckASync,

    // Deck B state
    deckB,
    setDeckBSyncMode,
    setDeckBKeylock,
    setDeckBTempoRange,
    toggleDeckBSync,

    // Sync operations
    syncDeck,
    nudgeDeck,

    // Status
    isSyncEnabled,
    getSyncStatusDisplay,
  };
}
