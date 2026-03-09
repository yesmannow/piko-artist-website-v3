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

const VAULT_MONO = "'JetBrains Mono', monospace";

export function StudioHeader({ masterProgress }: StudioHeaderProps) {
  const { isSupported, isActive, error, toggle } = useMidiBridge();
  const performanceMode = useStudioStore((state) => state.performanceMode);
  const stemModeEnabled = useStudioStore((state) => state.stemModeEnabled);
  const masterBpm = useStore((state) => state.masterBpm);
  const setMasterBpm = useStore((state) => state.setMasterBpm);
  const { isConnected: prolinkConnected, error: prolinkError } = useProlinkStatus();

  return (
    <header className="studio-header" style={{
      background: 'rgba(10,10,12,0.9)',
      backdropFilter: 'blur(24px) saturate(1.5)',
      borderBottom: '1px solid rgba(0,242,255,0.08)',
    }}>
      <div className="studio-header-bar">
        <div className="studio-brand">
          <Link href="/" className="studio-back-link" aria-label="Back to site" style={{
            border: '1px solid rgba(0,242,255,0.15)',
            background: 'rgba(0,242,255,0.04)',
          }}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="studio-logo" style={{
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.15em',
          }}>
            <Music2 className="h-4 w-4" style={{ color: '#00f2ff' }} />
            <span style={{ color: '#e2e8f0' }}>SYNDICATE VAULT</span>
          </div>
          <div className="studio-status">
            <span className={`studio-chip ${stemModeEnabled ? "is-active" : ""}`}
              style={{ fontFamily: VAULT_MONO, fontSize: '9px', letterSpacing: '0.15em' }}
            >STEM MODE</span>
            <span className="studio-chip"
              style={{ fontFamily: VAULT_MONO, fontSize: '9px', letterSpacing: '0.15em' }}
            >{performanceMode}</span>
          </div>
        </div>

        <div className="studio-header-controls">
          <div className="studio-bpm" style={{
            fontFamily: VAULT_MONO,
            fontSize: '10px',
            letterSpacing: '0.15em',
            border: '1px solid rgba(0,242,255,0.12)',
          }}>
            <span style={{ color: 'rgba(226,232,240,0.5)' }}>BPM</span>
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
              style={{ fontFamily: VAULT_MONO }}
            />
          </div>

          {/* ProLink Hardware Status */}
          <motion.div
            className={`studio-chip ${prolinkConnected ? "is-active" : ""}`}
            title={prolinkConnected ? "ProLink Connected" : (prolinkError || "ProLink Offline")}
            whileHover={{ scale: 1.02 }}
            style={{
              fontFamily: VAULT_MONO,
              fontSize: '9px',
              letterSpacing: '0.15em',
            }}
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
            style={{
              fontFamily: VAULT_MONO,
              fontSize: '9px',
              letterSpacing: '0.15em',
            }}
          >
            <Activity className="h-3.5 w-3.5" />
            MIDI
          </motion.button>

          <div className="studio-chip" style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            letterSpacing: '0.15em',
          }}>
            <Cpu className="h-3.5 w-3.5" />
            {performanceMode}
          </div>

          <StudioThemeSwitcher />
        </div>
      </div>

      <div className="studio-progress" style={{
        background: 'rgba(0,242,255,0.06)',
        height: '2px',
      }}>
        <div className="studio-progress-fill" style={{
          width: `${masterProgress * 100}%`,
          background: 'linear-gradient(90deg, #00f2ff, #a855f7)',
        }} />
      </div>
    </header>
  );
}
