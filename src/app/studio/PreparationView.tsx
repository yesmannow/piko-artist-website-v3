'use client';

/**
 * PreparationView - Syndicate Vault Timeline Mixer
 *
 * Visual centerpiece for track sequencing.
 * Features "Ghost Trailing" preview for upcoming transitions.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TRACKS, type TrackMeta } from './tracks';

const VAULT_MONO_FONT = 'var(--vault-font-mono)';
const VAULT_NEON_BLUE = 'var(--vault-neon-blue)';
const VAULT_WHITE = 'var(--vault-syndicate-white)';
const VAULT_TEXT_DIM = 'rgba(226,232,240,0.4)';
const VAULT_TEXT_MUTED = 'rgba(226,232,240,0.5)';

function GhostTrailOverlay({ nextTrack }: { nextTrack: TrackMeta | null }) {
  if (!nextTrack) return null;
  return (
    <div className="vault-ghost-trail z-10">
      <div className="vault-ghost-trail-label">
        NEXT: {nextTrack.title} — {nextTrack.bpm} BPM
      </div>
      {/* Ghost Waveform Overlay */}
      <div className="absolute inset-0 opacity-20 bg-[var(--vault-neon-blue)]/5 blur-sm" />
    </div>
  );
}

export function PreparationView() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const nextTrack = selectedIndex !== null && selectedIndex < TRACKS.length - 1
    ? TRACKS[selectedIndex + 1]
    : null;

  return (
    <div className="vault-preparation flex-1 overflow-hidden flex flex-col bg-[#0a0a0c]">
      <div className="vault-preparation-header border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--vault-neon-blue)] animate-pulse" />
          <h2 className="text-sm font-bold tracking-widest text-[var(--vault-neon-blue)]">
            TIMELINE MIXER // SEQUENCE INTEL
          </h2>
        </div>
        <span style={{
          fontFamily: VAULT_MONO_FONT,
          fontSize: '9px',
          color: VAULT_TEXT_DIM,
          letterSpacing: '0.2em',
        }}>
          CROSSFADER FUSION™ READY
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex p-4 gap-4">
        {/* Track List Side (Left) */}
        <div className="w-1/3 flex flex-col overflow-hidden vault-glass rounded-lg border border-white/5">
          <div className="p-3 border-b border-white/5 bg-white/5">
            <span style={{ fontFamily: VAULT_MONO_FONT, fontSize: '9px', color: VAULT_TEXT_DIM }}>TRACK MANIFEST</span>
          </div>
          <div className="flex-1 overflow-y-auto studio-scroll">
            <table className="w-full text-[10px] select-none">
              <tbody style={{ fontFamily: VAULT_MONO_FONT }}>
                {TRACKS.map((track, i) => (
                  <tr
                    key={track.id}
                    className={`track-row cursor-pointer transition-all border-b border-white/[0.03] ${selectedIndex === i ? 'bg-[rgba(0,242,255,0.06)]' : ''}`}
                    onClick={() => setSelectedIndex(i)}
                  >
                    <td className="p-3 opacity-30">{String(i + 1).padStart(2, '0')}</td>
                    <td className="p-3">
                      <div style={{ color: selectedIndex === i ? VAULT_WHITE : VAULT_TEXT_MUTED }}>{track.title}</div>
                      <div className="text-[8px] opacity-40">{track.artist}</div>
                    </td>
                    <td className="p-3 font-mono text-right" style={{ color: VAULT_NEON_BLUE }}>{track.bpm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Timeline Visualization (Right) */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden relative">
          <div className="flex-1 vault-glass rounded-lg border border-white/5 p-6 flex flex-col justify-center relative overflow-hidden">
            <GhostTrailOverlay nextTrack={nextTrack} />
            
            <div className="relative z-20 flex flex-col gap-8">
              {/* Primary Track Waveform Block */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-[var(--vault-neon-blue)]">LIVE DECK // {TRACKS[selectedIndex ?? 0].title}</span>
                  <span className="text-[9px] opacity-40 font-mono">{TRACKS[selectedIndex ?? 0].bpm} BPM // {TRACKS[selectedIndex ?? 0].key}</span>
                </div>
                <div className="h-24 bg-white/5 rounded border border-white/10 relative overflow-hidden">
                  {/* Visual placeholder for waveform */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <div className="w-full h-[1px] bg-[var(--vault-neon-blue)]" />
                  </div>
                  <motion.div 
                    className="absolute inset-y-0 left-0 bg-[var(--vault-neon-blue)]/10"
                    animate={{ width: ['0%', '100%'] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    style={{ borderRight: '1px solid var(--vault-neon-blue)' }}
                  />
                </div>
              </div>

              {/* Ghost Transition Point */}
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <div className="flex flex-col items-center gap-1">
                  <div className="w-2 h-2 rounded-full border border-[var(--vault-neon-blue)]" />
                  <span className="text-[8px] tracking-[0.3em] opacity-40">FUSION POINT</span>
                </div>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {/* Upcoming Track Waveform (Ghost) */}
              {nextTrack && (
                <div className="flex flex-col gap-2 opacity-40">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-[var(--vault-neon-blue)]">UPCOMING // {nextTrack.title}</span>
                    <span className="text-[9px] opacity-40 font-mono">{nextTrack.bpm} BPM // {nextTrack.key}</span>
                  </div>
                  <div className="h-24 bg-white/5 rounded border border-dashed border-white/20 relative overflow-hidden">
                     {/* Ghost waveform placeholder */}
                     <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <div className="w-full h-[1px] bg-[var(--vault-neon-blue)]" />
                     </div>
                  </div>
                </div>
              )}
            </div>

            {/* Background Data Stream (Pure Aesthetic) */}
            <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none opacity-[0.03] overflow-hidden">
              <div className="text-[6px] font-mono whitespace-nowrap animate-pulse">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i}>
                    0xFA12 {((i + 1) * 0xABCDEF).toString(16)} DECODING STREAM__{i} STATUS_NOMINAL
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="h-16 flex gap-4">
            <button className="flex-1 vault-pad vault-pad--blue">
              AUTO-SEQUENCE
            </button>
            <button className="flex-1 vault-pad">
              EXPORT SETLIST
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
