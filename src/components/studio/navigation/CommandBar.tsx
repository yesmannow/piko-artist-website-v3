"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Activity, RadioReceiver, ArrowLeft } from 'lucide-react';
import type { ViewId } from '@/app/studio/DjStudio';

interface CommandBarProps {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
  bpm: number;
}

const TABS: { id: ViewId; label: string }[] = [
  { id: 'performance', label: 'PERFORMANCE' },
  { id: 'preparation', label: 'PREPARATION' },
  { id: 'export', label: 'EXPORT' },
  { id: 'record', label: 'RECORD' },
];

export function CommandBar({ activeView, onViewChange, bpm }: CommandBarProps) {
  const isPlayingA = useStore((state) => state.deckA.isPlaying);
  const isPlayingB = useStore((state) => state.deckB.isPlaying);
  
  // Determine if any track is actively playing to toggle HUD mode
  const isPerformanceHUD = isPlayingA || isPlayingB;

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed z-50 flex items-center justify-between border border-white/10 bg-obsidian-900/80 backdrop-blur-[20px] shadow-2xl transition-all duration-500
        ${isPerformanceHUD 
          ? 'bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full w-auto gap-8' // performance HUD
          : 'top-0 left-0 right-0 px-6 py-3 rounded-none w-full gap-4' // top nav configuration
        }
      `}
    >
      {/* Branding / Return */}
      <motion.div layout className="flex items-center gap-4">
        {!isPerformanceHUD && (
          <Link href="/" className="text-white/50 hover:text-white transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-widest hidden md:inline">Exit Studio</span>
          </Link>
        )}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-linear-to-br from-[#00f2ff] to-[#a855f7] flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.4)]">
            <div className="w-2 h-2 rounded-full bg-obsidian-900" />
          </div>
          {!isPerformanceHUD && (
            <span className="font-bold text-sm tracking-widest uppercase">
              <span className="text-[#00f2ff]">PIKO</span>
              <span className="text-white"> STUDIO</span>
            </span>
          )}
        </div>
      </motion.div>

      {/* Primary Navigation Tabs */}
      <motion.nav layout className="flex items-center gap-2 bg-black/40 p-1 rounded-full border border-white/5">
        {TABS.map(tab => {
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={`relative px-4 py-1.5 rounded-full text-xs font-mono tracking-widest uppercase transition-all duration-300 ${
                isActive ? 'text-[#00f2ff]' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-white/10 rounded-full border border-[#00f2ff]/30 shadow-[0_0_15px_1px_rgba(0,242,255,0.2)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </motion.nav>

      {/* System Health Micro-Indicators & Master BPM */}
      <motion.div layout className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/5 cursor-default group">
           <RadioReceiver className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80 transition-colors" />
           <span className="flex h-2 w-2 rounded-full bg-red-500" title="MIDI Disconnected" />
        </div>

        <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/5 cursor-default group">
           <Activity className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80 transition-colors" />
           <span className="text-[10px] font-mono text-white/60 group-hover:text-[#00f2ff] transition-colors">CPU: 12%</span>
        </div>

        {!isPerformanceHUD && (
          <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-1.5 border border-[#00f2ff]/20 shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-pulse" />
            <span className="text-sm font-mono font-bold text-[#00f2ff]">
              {bpm.toFixed(1)}
            </span>
            <span className="text-[10px] tracking-widest text-[#00f2ff]/50">BPM</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
