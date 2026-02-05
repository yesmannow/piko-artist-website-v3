"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, ArrowLeft, Cpu, Music2, Wifi, WifiOff } from "lucide-react";
import { useMidiBridge } from "@/hooks/integrations/useMidiBridge";
import { useStudioStore } from "@/store/useStudioStore";
import { useStore } from "@/store/useStore";
import { useState, useEffect, useRef } from "react";
import { StudioThemeSwitcher } from "../controls/StudioThemeSwitcher";

type StudioHeaderProps = {
  readonly masterProgress: number;
};

/**
 * ProLink WebSocket Status Hook
 * Monitors connection to ws://localhost:8080 for hardware CDJ integration
 *
 * DISABLED BY DEFAULT in production to prevent WebSocket spam.
 * Enable by setting NEXT_PUBLIC_ENABLE_PROLINK=true
 */
function useProlinkStatus() {
  const enableProlink = process.env.NEXT_PUBLIC_ENABLE_PROLINK === 'true';
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(
    enableProlink ? null : 'Hardware disabled'
  );
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Gate: Only enable if explicitly configured
    if (!enableProlink) {
      return;
    }

    let mounted = true;

    const connect = () => {
      try {
        const ws = new WebSocket('ws://localhost:8080');
        wsRef.current = ws;

        ws.onopen = () => {
          if (mounted) {
            setIsConnected(true);
            setError(null);
            console.log('[ProLink] Connected to ws://localhost:8080');
          }
        };

        ws.onclose = () => {
          if (mounted) {
            setIsConnected(false);
            setError('Disconnected');

            // Attempt reconnect after 5 seconds
            reconnectTimeoutRef.current = window.setTimeout(() => {
              if (mounted) {
                connect();
              }
            }, 5000);
          }
        };

        ws.onerror = () => {
          if (mounted) {
            setIsConnected(false);
            setError('Connection failed');
          }
        };
      } catch {
        if (mounted) {
          setError('Failed to connect');
          setIsConnected(false);
        }
      }
    };

    connect();

    return () => {
      mounted = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [enableProlink]);

  return { isConnected, error };
}

export function StudioHeader({ masterProgress }: StudioHeaderProps) {
  const { isSupported, isActive, error, toggle } = useMidiBridge();
  const performanceMode = useStudioStore((state) => state.performanceMode);
  const stemModeEnabled = useStudioStore((state) => state.stemModeEnabled);
  const masterBpm = useStore((state) => state.masterBpm);
  const setMasterBpm = useStore((state) => state.setMasterBpm);
  const { isConnected: prolinkConnected, error: prolinkError } = useProlinkStatus();

  return (
    <header className="studio-header">
      <div className="studio-header-bar">
        <div className="studio-brand">
          <Link href="/" className="studio-back-link" aria-label="Back to site">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="studio-logo">
            <Music2 className="h-4 w-4 text-(--color-accent)" />
            <span>Piko Studio</span>
          </div>
          <div className="studio-status">
            <span className={`studio-chip ${stemModeEnabled ? "is-active" : ""}`}>Stem Mode</span>
            <span className="studio-chip">{performanceMode}</span>
          </div>
        </div>

        <div className="studio-header-controls">
          <div className="studio-bpm">
            <span>BPM</span>
            <input
              type="number"
              min={60}
              max={220}
              value={masterBpm}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isNaN(next)) {
                  setMasterBpm(Math.max(60, Math.min(220, next)));
                }
              }}
              aria-label="Master BPM"
            />
          </div>

          {/* ProLink Hardware Status */}
          <motion.div
            className={`studio-chip ${prolinkConnected ? "is-active" : ""}`}
            title={prolinkConnected ? "ProLink Connected" : (prolinkError || "ProLink Offline")}
            whileHover={{ scale: 1.02 }}
          >
            {prolinkConnected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            CDJ
          </motion.div>

          <motion.button
            type="button"
            onClick={toggle}
            disabled={!isSupported}
            className={`studio-chip studio-chip-button ${isActive ? "is-active" : ""}`}
            whileHover={isSupported ? { scale: 1.02 } : undefined}
            whileTap={isSupported ? { scale: 0.98 } : undefined}
            title={error ?? (isSupported ? "Toggle MIDI" : "MIDI not supported")}
            aria-pressed={isActive}
            aria-label="Toggle MIDI"
          >
            <Activity className="h-3.5 w-3.5" />
            MIDI
          </motion.button>

          <div className="studio-chip">
            <Cpu className="h-3.5 w-3.5" />
            {performanceMode}
          </div>

          <StudioThemeSwitcher />
        </div>
      </div>

      <div className="studio-progress">
        <div className="studio-progress-fill" style={{ width: `${masterProgress * 100}%` }} />
      </div>
    </header>
  );
}
