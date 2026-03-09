'use client';

/**
 * DjStudio — Syndicate Vault Edition (Phase 1)
 *
 * Unified /studio route with Vault-branded tabs.
 * Preparation tab features the Timeline Mixer with Ghost Trailing.
 * All views use JetBrains Mono / Space Grotesk typography.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommandBar } from '@/components/studio/navigation/CommandBar';
import { PerformanceView } from './PerformanceView';
import { TRACKS, type TrackMeta } from './tracks';
import './studio.css';

export type ViewId = 'performance' | 'preparation' | 'export' | 'record';

/* ─── Shared Syndicate Vault Style Constants ─────────────────── */
const VAULT_MONO_FONT = 'var(--vault-font-mono)';
const VAULT_NEON_BLUE = 'var(--vault-neon-blue)';
const VAULT_WHITE = 'var(--vault-syndicate-white)';
const VAULT_TEXT_DIM = 'rgba(226,232,240,0.4)';
const VAULT_TEXT_MUTED = 'rgba(226,232,240,0.5)';
const VAULT_TEXT_FAINT = 'rgba(226,232,240,0.35)';
const VAULT_TEXT_GHOST = 'rgba(226,232,240,0.3)';
const VAULT_TEXT_HIDDEN = 'rgba(226,232,240,0.15)';
const VAULT_TEXT_FADED = 'rgba(226,232,240,0.2)';

/* ─── Ghost Trailing Preview ──────────────────────────────────── */
function GhostTrailOverlay({ nextTrack }: { nextTrack: TrackMeta | null }) {
  if (!nextTrack) return null;
  return (
    <div className="vault-ghost-trail">
      <div className="vault-ghost-trail-label">
        NEXT: {nextTrack.title} — {nextTrack.bpm} BPM
      </div>
    </div>
  );
}

/* ─── Preparation View - Timeline Mixer Centerpiece ────────────── */
function PreparationView() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const nextTrack = selectedIndex !== null && selectedIndex < TRACKS.length - 1
    ? TRACKS[selectedIndex + 1]
    : null;

  return (
    <div className="vault-preparation flex-1 overflow-hidden flex flex-col">
      <div className="vault-preparation-header">
        <div className="w-2 h-2 rounded-full bg-[var(--vault-neon-blue)] animate-pulse" />
        <h2>PREPARATION // TIMELINE MIXER</h2>
        <span style={{
          fontFamily: VAULT_MONO_FONT,
          fontSize: '9px',
          color: VAULT_TEXT_DIM,
          letterSpacing: '0.2em',
        }}>
          CROSSFADER FUSION™ READY
        </span>
      </div>

      {/* Timeline Mixer - Centerpiece */}
      <div className="flex-1 overflow-y-auto studio-scroll p-4 relative">
        {/* Ghost Trail Overlay */}
        <GhostTrailOverlay nextTrack={nextTrack} />

        <table className="w-full table-auto text-xs">
          <thead>
            <tr style={{
              fontFamily: VAULT_MONO_FONT,
              fontSize: '9px',
              letterSpacing: '0.2em',
              color: VAULT_TEXT_GHOST,
              textTransform: 'uppercase',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <th className="text-left py-2 pl-2 w-8">#</th>
              <th className="text-left py-2">TITLE</th>
              <th className="text-left py-2">ARTIST</th>
              <th className="text-left py-2 w-16" style={{ color: VAULT_NEON_BLUE }}>BPM</th>
              <th className="text-left py-2 w-16">KEY</th>
              <th className="text-left py-2 w-16">DURATION</th>
              <th className="text-left py-2 w-16">STEMS</th>
            </tr>
          </thead>
          <tbody>
            {TRACKS.map((track: TrackMeta, i: number) => (
              <tr
                key={track.id}
                className={`track-row border-b border-white/[0.03] cursor-pointer transition-colors ${selectedIndex === i ? 'bg-[rgba(0,242,255,0.06)]' : ''}`}
                onClick={() => setSelectedIndex(i)}
                style={{ fontFamily: VAULT_MONO_FONT }}
              >
                <td className="py-2.5 pl-2" style={{ color: VAULT_TEXT_FADED }}>{i + 1}</td>
                <td className="py-2.5 font-medium" style={{ color: VAULT_WHITE }}>{track.title}</td>
                <td className="py-2.5" style={{ color: VAULT_TEXT_MUTED }}>{track.artist}</td>
                <td className="py-2.5 font-mono" style={{ color: VAULT_NEON_BLUE }}>{track.bpm}</td>
                <td className="py-2.5 font-mono" style={{ color: VAULT_TEXT_MUTED }}>{track.key}</td>
                <td className="py-2.5 font-mono" style={{ color: VAULT_TEXT_FAINT }}>{track.duration}</td>
                <td className="py-2.5">
                  {track.stemsDir ? (
                    <span className="text-[9px] px-1.5 py-0.5" style={{
                      background: 'rgba(0,242,255,0.08)',
                      color: VAULT_NEON_BLUE,
                      border: '1px solid rgba(0,242,255,0.15)',
                      fontFamily: VAULT_MONO_FONT,
                      letterSpacing: '0.15em',
                    }}>
                      STEMS
                    </span>
                  ) : (
                    <span className="text-[9px]" style={{ color: VAULT_TEXT_HIDDEN }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Crossfader Fusion™ Visual Preview Zone */}
        {selectedIndex !== null && nextTrack && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 vault-glass-deep"
            style={{ borderLeft: '2px solid var(--vault-neon-blue)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--vault-neon-blue)] animate-pulse" />
              <span style={{
                fontFamily: VAULT_MONO_FONT,
                fontSize: '9px',
                color: VAULT_NEON_BLUE,
                letterSpacing: '0.2em',
              }}>
                CROSSFADER FUSION™ TRANSITION POINT
              </span>
            </div>
            <div className="flex items-center gap-6" style={{ fontFamily: VAULT_MONO_FONT, fontSize: '11px' }}>
              <div>
                <span style={{ color: VAULT_TEXT_DIM }}>CURRENT: </span>
                <span style={{ color: VAULT_WHITE }}>{TRACKS[selectedIndex].title}</span>
                <span style={{ color: VAULT_NEON_BLUE, marginLeft: '8px' }}>{TRACKS[selectedIndex].bpm} BPM</span>
              </div>
              <div style={{ color: 'rgba(0,242,255,0.3)' }}>→</div>
              <div>
                <span style={{ color: VAULT_TEXT_DIM }}>NEXT: </span>
                <span style={{ color: VAULT_WHITE }}>{nextTrack.title}</span>
                <span style={{ color: VAULT_NEON_BLUE, marginLeft: '8px' }}>{nextTrack.bpm} BPM</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ─── Export View ─────────────────────────────────────────────── */
function ExportView() {
  return (
    <div className="flex-1 flex items-center justify-center flex-col gap-3" style={{ color: VAULT_TEXT_FAINT }}>
      <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <span style={{ fontFamily: VAULT_MONO_FONT, fontSize: '11px', letterSpacing: '0.15em' }}>
        EXPORT MODULE — COMING SOON
      </span>
    </div>
  );
}

/* ─── Record View ────────────────────────────────────────────── */
function RecordView() {
  return (
    <div className="flex-1 flex items-center justify-center flex-col gap-3" style={{ color: VAULT_TEXT_FAINT }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '2px solid var(--vault-action-red)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 16px rgba(244,63,94,0.3)',
      }}>
        <div
          className="animate-pulse"
          style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--vault-action-red)' }}
        />
      </div>
      <span style={{ fontFamily: VAULT_MONO_FONT, fontSize: '11px', letterSpacing: '0.15em' }}>
        RECORD MODULE — COMING SOON
      </span>
    </div>
  );
}

/* ─── Main Studio Component ──────────────────────────────────── */
export function DjStudio() {
  const [activeView, setActiveView] = useState<ViewId>('performance');
  const [masterBpm] = useState(124);

  return (
    <div className="studio-root">
      <CommandBar
        activeView={activeView}
        onViewChange={setActiveView}
        bpm={masterBpm}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {activeView === 'performance' && <PerformanceView />}
          {activeView === 'preparation' && <PreparationView />}
          {activeView === 'export' && <ExportView />}
          {activeView === 'record' && <RecordView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
