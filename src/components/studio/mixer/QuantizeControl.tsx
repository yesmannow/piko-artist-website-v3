/**
 * Phase 5 Batch 3: Quantize Control Component
 *
 * UI controls for quantize settings in Studio mixer panel.
 * Matches professional DJ software quantize controls.
 */

"use client";

import React, { useState } from "react";
import { QuantizeMode } from "@/lib/audio/quantize";
import type { UseQuantizeReturn } from "@/hooks/audio/useQuantize";

// ============================================================================
// Types
// ============================================================================

interface QuantizeControlProps {
  quantize: UseQuantizeReturn;
  compact?: boolean; // Compact mode for mobile
}

// ============================================================================
// Component
// ============================================================================

export function QuantizeControl({ quantize, compact = false }: QuantizeControlProps) {
  const [showStrength, setShowStrength] = useState(false);

  // Mode display labels
  const getModeLabel = (mode: QuantizeMode): string => {
    switch (mode) {
      case QuantizeMode.OFF:
        return "OFF";
      case QuantizeMode.BEAT:
        return "1/4";
      case QuantizeMode.EIGHTH:
        return "1/8";
      case QuantizeMode.SIXTEENTH:
        return "1/16";
      case QuantizeMode.THIRTYSECOND:
        return "1/32";
    }
  };

  // Mode color (active state)
  const getModeColor = (): string => {
    if (!quantize.isEnabled) return "var(--studio-gray-500)";
    return "var(--studio-accent-primary)";
  };

  return (
    <div
      className={`quantize-control ${compact ? "compact" : ""}`}
      style={{
        display: "flex",
        flexDirection: compact ? "row" : "column",
        gap: compact ? "8px" : "12px",
        padding: compact ? "8px" : "12px",
        backgroundColor: "var(--studio-surface-elevated)",
        borderRadius: "var(--studio-radius-md)",
        border: "1px solid var(--studio-border)",
      }}
    >
      {/* Header */}
      {!compact && (
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--studio-text-secondary)",
          }}
        >
          Quantize
        </div>
      )}

      {/* Mode Toggle Button */}
      <button
        onClick={quantize.cycleMode}
        className="quantize-mode-button"
        style={{
          padding: compact ? "6px 12px" : "8px 16px",
          backgroundColor: quantize.isEnabled
            ? "var(--studio-accent-primary)"
            : "var(--studio-surface)",
          color: quantize.isEnabled
            ? "var(--studio-text-on-accent)"
            : "var(--studio-text-secondary)",
          border: `1px solid ${quantize.isEnabled ? "transparent" : "var(--studio-border)"}`,
          borderRadius: "var(--studio-radius-sm)",
          fontSize: compact ? "13px" : "14px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.15s ease",
          fontVariantNumeric: "tabular-nums",
          minWidth: compact ? "48px" : "60px",
          textAlign: "center",
        }}
        title={`Quantize Mode: ${getModeLabel(quantize.mode)} (Click to cycle)`}
      >
        {getModeLabel(quantize.mode)}
      </button>

      {/* Mode Selector (Dropdown) */}
      {!compact && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "4px",
          }}
        >
          {[
            QuantizeMode.OFF,
            QuantizeMode.BEAT,
            QuantizeMode.EIGHTH,
            QuantizeMode.SIXTEENTH,
            QuantizeMode.THIRTYSECOND,
          ].map((mode) => (
            <button
              key={mode}
              onClick={() => quantize.setMode(mode)}
              className={`quantize-mode-option ${quantize.mode === mode ? "active" : ""}`}
              style={{
                padding: "6px",
                backgroundColor:
                  quantize.mode === mode
                    ? "var(--studio-accent-primary-alpha)"
                    : "var(--studio-surface)",
                color:
                  quantize.mode === mode
                    ? "var(--studio-accent-primary)"
                    : "var(--studio-text-secondary)",
                border: `1px solid ${
                  quantize.mode === mode
                    ? "var(--studio-accent-primary)"
                    : "var(--studio-border)"
                }`,
                borderRadius: "var(--studio-radius-sm)",
                fontSize: "11px",
                fontWeight: quantize.mode === mode ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontVariantNumeric: "tabular-nums",
              }}
              title={`Quantize to ${getModeLabel(mode)} notes`}
            >
              {getModeLabel(mode)}
            </button>
          ))}
        </div>
      )}

      {/* Strength Control */}
      {!compact && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label
              htmlFor="quantize-strength"
              style={{
                fontSize: "11px",
                color: "var(--studio-text-secondary)",
              }}
            >
              Strength
            </label>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: getModeColor(),
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {Math.round(quantize.strength * 100)}%
            </span>
          </div>
          <input
            id="quantize-strength"
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(quantize.strength * 100)}
            onChange={(e) => quantize.setStrength(Number(e.target.value) / 100)}
            disabled={quantize.mode === QuantizeMode.OFF}
            style={{
              width: "100%",
              accentColor: "var(--studio-accent-primary)",
              opacity: quantize.mode === QuantizeMode.OFF ? 0.5 : 1,
              cursor: quantize.mode === QuantizeMode.OFF ? "not-allowed" : "pointer",
            }}
            title="Quantize strength (0% = off, 100% = full snap)"
          />
        </div>
      )}

      {/* Lookahead Toggle */}
      {!compact && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "11px",
            color: "var(--studio-text-secondary)",
            cursor: quantize.mode === QuantizeMode.OFF ? "not-allowed" : "pointer",
            opacity: quantize.mode === QuantizeMode.OFF ? 0.5 : 1,
          }}
        >
          <input
            type="checkbox"
            checked={quantize.lookahead}
            onChange={(e) => quantize.setLookahead(e.target.checked)}
            disabled={quantize.mode === QuantizeMode.OFF}
            style={{
              accentColor: "var(--studio-accent-primary)",
              cursor: quantize.mode === QuantizeMode.OFF ? "not-allowed" : "pointer",
            }}
          />
          Snap Forward Only
        </label>
      )}

      {/* Status Indicator */}
      {quantize.isEnabled && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: compact ? "4px 8px" : "6px 10px",
            backgroundColor: "var(--studio-accent-primary-alpha)",
            borderRadius: "var(--studio-radius-sm)",
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--studio-accent-primary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "var(--studio-accent-primary)",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
          {compact ? "Q" : "Quantize Active"}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .quantize-mode-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .quantize-mode-button:active {
          transform: translateY(0);
        }

        .quantize-mode-option:hover {
          background-color: var(--studio-surface-hover) !important;
        }

        .quantize-mode-option:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}
