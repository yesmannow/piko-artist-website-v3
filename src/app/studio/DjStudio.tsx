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
import { PreparationView } from './PreparationView';
import { ExportView } from './ExportView';
import { RecordView } from './RecordView';
import './studio.css';

export type ViewId = 'performance' | 'preparation' | 'export' | 'record';

/* ─── Shared Syndicate Vault Style Constants ─────────────────── */
// These are primarily used by the dynamic CommandBar and Shell components
export const VAULT_MONO_FONT = 'var(--vault-font-mono)';
export const VAULT_NEON_BLUE = 'var(--vault-neon-blue)';
export const VAULT_WHITE = 'var(--vault-syndicate-white)';

/**
 * DjStudio — Syndicate Vault Edition (Final)
 *
 * Unified /studio route with Vault-branded tabs.
 * Refactored to modular sub-views for architectural clarity.
 */
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
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

