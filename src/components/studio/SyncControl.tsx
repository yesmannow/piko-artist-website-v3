"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Link2 } from "lucide-react";
import { getStudioEngine } from "@/engine/rt/StudioEngine";
import type { DeckId } from "@/engine/rt/control/ControlLayout";

export type SyncMode = "tempo-only" | "tempo+phase";

interface SyncControlProps {
  deckId: DeckId;
  masterDeckId?: DeckId;
  className?: string;
}

/**
 * SyncControl - UI component for enabling/disabling phase sync
 *
 * Phase 9B: Upgraded from tempo-only to full phase sync
 *
 * Features:
 * - Toggle sync ON/OFF
 * - Shows sync status
 * - Handles missing beat grids gracefully
 */
export function SyncControl({
  deckId,
  masterDeckId,
  className = "",
}: SyncControlProps) {
  const [isSynced, setIsSynced] = useState(false);
  const [syncMode, setSyncMode] = useState<SyncMode>("tempo-only");
  const [syncError, setSyncError] = useState<string | null>(null);

  // Check sync state on mount and when it changes
  useEffect(() => {
    const checkSyncState = () => {
      try {
        const studio = getStudioEngine();
        const syncState = studio.getSyncState();
        setIsSynced(syncState.enabled && syncState.slaveDeck === deckId);
        setSyncError(null);
      } catch (error) {
        // Engine might not be initialized
        setIsSynced(false);
      }
    };

    checkSyncState();
    const interval = setInterval(checkSyncState, 500); // Check every 500ms
    return () => clearInterval(interval);
  }, [deckId]);

  const handleToggleSync = () => {
    try {
      const studio = getStudioEngine();

      if (studio.state !== "ready") {
        setSyncError("Studio engine not ready");
        return;
      }

      // Determine master deck
      const master = masterDeckId || (deckId === "A" ? "B" : "A");

      // Check if both decks are loaded
      if (!studio.isLoaded(deckId) || !studio.isLoaded(master)) {
        setSyncError("Both decks must have tracks loaded");
        return;
      }

      // Toggle sync
      const currentState = studio.getSyncState();
      const shouldEnable =
        !currentState.enabled || currentState.slaveDeck !== deckId;

      // Enable/disable sync with current mode
      studio.setSyncEnabled(deckId, shouldEnable, master, syncMode);

      setIsSynced(shouldEnable);
      setSyncError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sync failed";
      setSyncError(errorMessage);
      setIsSynced(false);
      console.error("[SyncControl] Sync toggle failed:", error);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Mode Toggle (only show when not synced) */}
      {!isSynced && (
        <div className="flex gap-2">
          <button
            onClick={() => setSyncMode("tempo-only")}
            className={`
              flex-1 px-3 py-2 text-xs font-mono uppercase
              border-2 transition-all
              ${
                syncMode === "tempo-only"
                  ? "border-[#FFD700] text-[#FFD700] bg-black/50"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
              }
            `}
          >
            TEMPO
          </button>
          <button
            onClick={() => setSyncMode("tempo+phase")}
            className={`
              flex-1 px-3 py-2 text-xs font-mono uppercase
              border-2 transition-all
              ${
                syncMode === "tempo+phase"
                  ? "border-[#FFD700] text-[#FFD700] bg-black/50"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
              }
            `}
          >
            TEMPO+PHASE
          </button>
        </div>
      )}

      {/* Sync Toggle Button */}
      <motion.button
        onClick={handleToggleSync}
        className={`
          w-full px-6 py-3
          bg-black/80 backdrop-blur-sm
          border-2 font-mono text-sm uppercase tracking-wider
          transition-all duration-200
          flex items-center justify-center gap-2
          min-h-[48px]
          ${
            isSynced
              ? "border-green-500 text-green-400 hover:border-green-400"
              : "border-[#FFD700] text-[#FFD700] hover:border-[#FFD700]/80 hover:bg-black/90"
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isSynced ? (
          <>
            <Lock className="w-4 h-4" />
            <span>
              SYNC ON ({syncMode === "tempo-only" ? "TEMPO" : "TEMPO+PHASE"})
            </span>
          </>
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            <span>
              SYNC ({syncMode === "tempo-only" ? "TEMPO ONLY" : "TEMPO + PHASE"}
              )
            </span>
          </>
        )}
      </motion.button>

      {/* Error Message */}
      {syncError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 bg-red-900/20 border border-red-500/50 text-red-400 text-xs font-mono"
        >
          {syncError}
        </motion.div>
      )}

      {/* Sync Status */}
      {isSynced && (
        <div className="px-4 py-2 bg-green-900/20 border border-green-500/50 text-green-400 text-xs font-mono">
          Phase-locked to {masterDeckId || (deckId === "A" ? "B" : "A")}
        </div>
      )}
    </div>
  );
}
