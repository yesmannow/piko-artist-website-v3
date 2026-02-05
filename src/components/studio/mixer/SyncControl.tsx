/**
 * Phase 5 Batch 4: Sync Control Component
 *
 * UI controls for tempo sync in Studio mixer panel.
 * Professional sync controls matching hardware DJ controllers.
 */

"use client";

import React from "react";
import { SyncMode, TempoRange } from "@/lib/audio/tempoSync";
import type { UseTempoSyncReturn } from "@/hooks/audio/useTempoSync";

// ============================================================================
// Types
// ============================================================================

interface SyncControlProps {
  deckId: "A" | "B";
  tempoSync: UseTempoSyncReturn;
  compact?: boolean; // Compact mode for mobile
}

// ============================================================================
// Component
// ============================================================================

export function SyncControl({ deckId, tempoSync, compact = false }: SyncControlProps) {
  const deckState = deckId === "A" ? tempoSync.deckA : tempoSync.deckB;
  const isMaster = deckState.isMaster;
  const isEnabled = tempoSync.isSyncEnabled(deckId);

  // Actions
  const toggleSync = deckId === "A" ? tempoSync.toggleDeckASync : tempoSync.toggleDeckBSync;
  const setSyncMode = deckId === "A" ? tempoSync.setDeckASyncMode : tempoSync.setDeckBSyncMode;
  const setKeylock = deckId === "A" ? tempoSync.setDeckAKeylock : tempoSync.setDeckBKeylock;
  const setTempoRange = deckId === "A" ? tempoSync.setDeckATempoRange : tempoSync.setDeckBTempoRange;

  // Get deck color
  const deckColor = deckId === "A" ? "var(--studio-deck-a)" : "var(--studio-deck-b)";

  return (
    <div
      className={`sync-control ${compact ? "compact" : ""}`}
      style={{
        display: "flex",
        flexDirection: compact ? "row" : "column",
        gap: compact ? "8px" : "12px",
        padding: compact ? "8px" : "12px",
        backgroundColor: "var(--studio-surface-elevated)",
        borderRadius: "var(--studio-radius-md)",
        border: `1px solid ${isMaster ? deckColor : "var(--studio-border)"}`,
        position: "relative",
      }}
    >
      {/* Master indicator badge */}
      {isMaster && (
        <div
          style={{
            position: "absolute",
            top: "-8px",
            right: "-8px",
            padding: "2px 6px",
            backgroundColor: deckColor,
            color: "var(--studio-text-on-accent)",
            borderRadius: "var(--studio-radius-sm)",
            fontSize: "9px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            boxShadow: "var(--studio-shadow-md)",
          }}
        >
          Master
        </div>
      )}

      {/* Header */}
      {!compact && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--studio-text-secondary)",
            }}
          >
            Sync - Deck {deckId}
          </div>
          <button
            onClick={() => tempoSync.toggleMaster(deckId)}
            style={{
              padding: "2px 6px",
              backgroundColor: isMaster ? deckColor : "var(--studio-surface)",
              color: isMaster ? "var(--studio-text-on-accent)" : "var(--studio-text-secondary)",
              border: `1px solid ${isMaster ? "transparent" : "var(--studio-border)"}`,
              borderRadius: "var(--studio-radius-sm)",
              fontSize: "9px",
              fontWeight: 600,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
            title={`Set Deck ${deckId} as master tempo`}
          >
            {isMaster ? "Master" : "Set Master"}
          </button>
        </div>
      )}

      {/* Sync Mode Button */}
      <button
        onClick={toggleSync}
        disabled={isMaster}
        className="sync-mode-button"
        style={{
          padding: compact ? "8px 16px" : "12px 20px",
          backgroundColor: isEnabled && !isMaster
            ? deckColor
            : "var(--studio-surface)",
          color: isEnabled && !isMaster
            ? "var(--studio-text-on-accent)"
            : "var(--studio-text-secondary)",
          border: `2px solid ${isEnabled && !isMaster ? "transparent" : "var(--studio-border)"}`,
          borderRadius: "var(--studio-radius-md)",
          fontSize: compact ? "14px" : "16px",
          fontWeight: 700,
          cursor: isMaster ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          textTransform: "uppercase",
          letterSpacing: "1px",
          opacity: isMaster ? 0.5 : 1,
          position: "relative",
          overflow: "hidden",
        }}
        title={isMaster ? "Master deck cannot sync" : "Toggle sync (TEMPO or BEAT mode)"}
      >
        {isEnabled ? (
          <>
            <span style={{ fontSize: "18px", marginRight: "8px" }}>✓</span>
            SYNC
          </>
        ) : (
          "SYNC OFF"
        )}
        
        {/* Pulse animation when syncing */}
        {isEnabled && !isMaster && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(255, 255, 255, 0.1)",
              animation: "sync-pulse 2s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
        )}
      </button>

      {/* Sync Mode Selector */}
      {!compact && !isMaster && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "6px",
          }}
        >
          {[SyncMode.OFF, SyncMode.TEMPO, SyncMode.BEAT].map((mode) => (
            <button
              key={mode}
              onClick={() => setSyncMode(mode)}
              className={`sync-mode-option ${deckState.syncMode === mode ? "active" : ""}`}
              style={{
                padding: "8px",
                backgroundColor:
                  deckState.syncMode === mode
                    ? `${deckColor}20`
                    : "var(--studio-surface)",
                color:
                  deckState.syncMode === mode
                    ? deckColor
                    : "var(--studio-text-secondary)",
                border: `1px solid ${
                  deckState.syncMode === mode ? deckColor : "var(--studio-border)"
                }`,
                borderRadius: "var(--studio-radius-sm)",
                fontSize: "11px",
                fontWeight: deckState.syncMode === mode ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s ease",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
              title={getModeDescription(mode)}
            >
              {getModeLabel(mode)}
            </button>
          ))}
        </div>
      )}

      {/* Keylock Toggle */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: compact ? "4px" : "8px",
          backgroundColor: deckState.keylock ? `${deckColor}10` : "var(--studio-surface)",
          borderRadius: "var(--studio-radius-sm)",
          border: `1px solid ${deckState.keylock ? deckColor : "var(--studio-border)"}`,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        <input
          type="checkbox"
          checked={deckState.keylock}
          onChange={(e) => setKeylock(e.target.checked)}
          style={{
            accentColor: deckColor,
            cursor: "pointer",
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: compact ? "11px" : "12px",
              fontWeight: 600,
              color: deckState.keylock ? deckColor : "var(--studio-text-primary)",
            }}
          >
            Keylock
          </div>
          {!compact && (
            <div
              style={{
                fontSize: "10px",
                color: "var(--studio-text-secondary)",
                marginTop: "2px",
              }}
            >
              Preserve pitch when changing tempo
            </div>
          )}
        </div>
        {deckState.keylock && (
          <span style={{ fontSize: "14px", color: deckColor }}>🔒</span>
        )}
      </label>

      {/* Tempo Range Selector */}
      {!compact && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label
            style={{
              fontSize: "11px",
              color: "var(--studio-text-secondary)",
            }}
          >
            Tempo Range
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "4px",
            }}
          >
            {[TempoRange.NARROW, TempoRange.MEDIUM, TempoRange.WIDE].map((range) => (
              <button
                key={range}
                onClick={() => setTempoRange(range)}
                className={`tempo-range-option ${deckState.tempoRange === range ? "active" : ""}`}
                style={{
                  padding: "6px",
                  backgroundColor:
                    deckState.tempoRange === range
                      ? `${deckColor}20`
                      : "var(--studio-surface)",
                  color:
                    deckState.tempoRange === range
                      ? deckColor
                      : "var(--studio-text-secondary)",
                  border: `1px solid ${
                    deckState.tempoRange === range ? deckColor : "var(--studio-border)"
                  }`,
                  borderRadius: "var(--studio-radius-sm)",
                  fontSize: "11px",
                  fontWeight: deckState.tempoRange === range ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontVariantNumeric: "tabular-nums",
                }}
                title={`Allow tempo deviation up to ±${range}%`}
              >
                ±{range}%
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes sync-pulse {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }

        .sync-mode-button:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: var(--studio-shadow-md);
        }

        .sync-mode-button:not(:disabled):active {
          transform: translateY(0);
        }

        .sync-mode-option:hover,
        .tempo-range-option:hover {
          background-color: var(--studio-surface-hover) !important;
        }

        .sync-mode-option:active,
        .tempo-range-option:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getModeLabel(mode: SyncMode): string {
  switch (mode) {
    case SyncMode.OFF:
      return "Off";
    case SyncMode.TEMPO:
      return "Tempo";
    case SyncMode.BEAT:
      return "Beat";
  }
}

function getModeDescription(mode: SyncMode): string {
  switch (mode) {
    case SyncMode.OFF:
      return "No sync (manual mixing)";
    case SyncMode.TEMPO:
      return "Sync BPM only (manual phase alignment)";
    case SyncMode.BEAT:
      return "Sync BPM + phase (full auto beatmatch)";
  }
}
