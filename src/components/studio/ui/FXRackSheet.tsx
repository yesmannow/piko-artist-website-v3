"use client";

/**
 * FXRackSheet - Collapsible Bottom Sheet for FX Rack
 * 
 * Wrapper component for FXRack with minimize/expand functionality
 * Minimized by default, expands on click
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FXRack } from '@/components/studio/core/FXRack';
import { ChevronUp, ChevronDown, Sliders } from 'lucide-react';
import * as Tone from 'tone';

interface FXRackSheetProps {
  masterBus?: Tone.Gain | null;
  masterPostFx?: Tone.Gain | null;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export function FXRackSheet({ masterBus, masterPostFx, isExpanded, onExpandedChange }: FXRackSheetProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = isExpanded ?? internalExpanded;
  const setExpanded = onExpandedChange ?? setInternalExpanded;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60]">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.div
        className="glass-panel border-t border-white/10 overflow-hidden bg-obsidian-900/80 backdrop-blur-[20px]"
        animate={{ height: expanded ? '16rem' : '3rem' }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        {/* Minimized Bar */}
        <motion.button
          onClick={() => setExpanded(!expanded)}
          className="w-full h-12 px-4 flex items-center justify-between hover:bg-white/5 transition-colors"
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          whileTap={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-studio-purple" />
            <span className="font-mono text-sm uppercase text-white">FX Rack</span>
          </div>
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-white/60" />
          ) : (
            <ChevronUp className="w-5 h-5 text-white/60" />
          )}
        </motion.button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-[calc(100%-3rem)] overflow-hidden"
            >
              <div className="h-full p-4">
                <FXRack masterBus={masterBus} masterPostFx={masterPostFx} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
